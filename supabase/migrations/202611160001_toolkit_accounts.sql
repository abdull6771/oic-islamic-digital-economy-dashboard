-- Toolkit-owned objects only. Apply to a separate, organization-owned Supabase
-- project. Auth owns passwords; these tables never store passwords/raw cookies.
begin;

create table public.toolkit_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (email = lower(btrim(email)) and length(email) between 3 and 254),
  name text not null default '' check (length(name) <= 120),
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  activated_at timestamptz,
  last_sign_in_at timestamptz,
  requires_password_reset boolean not null default true,
  security_version bigint not null default 1 check (security_version > 0),
  password_operation uuid,
  password_operation_started_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);
create table public.toolkit_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.toolkit_accounts(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  purpose text not null check (purpose in ('full', 'setup')),
  security_version bigint not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create index toolkit_sessions_account_idx on public.toolkit_sessions(account_id);
create index toolkit_sessions_expiry_idx on public.toolkit_sessions(expires_at);
create table public.toolkit_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  target_id uuid,
  action text not null check (length(action) between 1 and 80),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);
create index toolkit_audit_created_idx on public.toolkit_audit_events(created_at);
create table public.toolkit_rate_limits (
  key_hash text primary key check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index toolkit_rate_expiry_idx on public.toolkit_rate_limits(expires_at);

alter table public.toolkit_accounts enable row level security;
alter table public.toolkit_sessions enable row level security;
alter table public.toolkit_audit_events enable row level security;
alter table public.toolkit_rate_limits enable row level security;
revoke all on public.toolkit_accounts, public.toolkit_sessions, public.toolkit_audit_events, public.toolkit_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.toolkit_accounts, public.toolkit_sessions, public.toolkit_audit_events, public.toolkit_rate_limits to service_role;

create function public.toolkit_user_json(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select jsonb_build_object('id', id, 'email', email, 'name', name, 'role', role, 'status', status,
    'activatedAt', activated_at, 'lastSignInAt', last_sign_in_at, 'createdAt', created_at,
    'requiresPasswordReset', requires_password_reset)
  from public.toolkit_accounts where id = p_user_id;
$$;

create function public.toolkit_get_session(p_token_hash text) returns jsonb
language sql stable security definer set search_path = pg_catalog, public as $$
  select jsonb_build_object('id', s.id, 'userId', a.id, 'email', a.email, 'name', a.name,
    'role', a.role, 'status', a.status, 'purpose', s.purpose,
    'requiresPasswordReset', a.requires_password_reset, 'activatedAt', a.activated_at, 'expiresAt', s.expires_at)
  from public.toolkit_sessions s join public.toolkit_accounts a on a.id = s.account_id
    join auth.users u on u.id = a.id and u.email_confirmed_at is not null and lower(u.email) = a.email
  where s.token_hash = p_token_hash and s.revoked_at is null and s.expires_at > statement_timestamp()
    and a.status = 'active' and a.security_version = s.security_version
    and (s.purpose = 'setup' or (a.activated_at is not null and not a.requires_password_reset));
$$;

create function public.toolkit_assert_admin(p_actor_hash text) returns uuid
language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor jsonb;
begin
  actor := public.toolkit_get_session(p_actor_hash);
  if actor is null then raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED'; end if;
  if actor->>'purpose' <> 'full' or actor->>'role' <> 'admin' then
    raise exception using errcode = 'PT403', message = 'ADMIN_REQUIRED';
  end if;
  return (actor->>'userId')::uuid;
end;
$$;

create function public.toolkit_create_session(p_user_id uuid, p_token_hash text, p_purpose text, p_expires_at timestamptz) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare account public.toolkit_accounts; v_now timestamptz := clock_timestamp();
begin
  if p_token_hash is null or p_purpose is null or p_expires_at is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_purpose not in ('full', 'setup')
    or p_expires_at <= v_now or p_expires_at > v_now + (case when p_purpose = 'setup' then interval '1 hour' else interval '24 hours' end) then
    raise exception using errcode = 'PT400', message = 'INVALID_SESSION';
  end if;
  select * into account from public.toolkit_accounts where id = p_user_id for update;
  if not found or account.status <> 'active' or (p_purpose = 'full' and (account.activated_at is null or account.requires_password_reset)) then return null; end if;
  if not exists(select 1 from auth.users where id = p_user_id and email_confirmed_at is not null and lower(email) = account.email) then return null; end if;
  delete from public.toolkit_sessions where id in (
    select id from public.toolkit_sessions where expires_at < v_now - interval '7 days'
      or revoked_at < v_now - interval '7 days' limit 100
  );
  insert into public.toolkit_sessions(account_id, token_hash, purpose, security_version, expires_at)
    values(p_user_id, p_token_hash, p_purpose, account.security_version, p_expires_at);
  if p_purpose = 'full' then
    update public.toolkit_accounts set last_sign_in_at = v_now, updated_at = v_now where id = p_user_id;
    insert into public.toolkit_audit_events(actor_id, target_id, action) values(p_user_id, p_user_id, 'signed_in');
  end if;
  return public.toolkit_get_session(p_token_hash);
end;
$$;

create function public.toolkit_revoke_session(p_token_hash text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare who uuid;
begin
  update public.toolkit_sessions set revoked_at = clock_timestamp() where token_hash = p_token_hash and revoked_at is null returning account_id into who;
  if who is not null then insert into public.toolkit_audit_events(actor_id, target_id, action) values(who, who, 'signed_out'); end if;
end;
$$;

create function public.toolkit_admin_get_user(p_actor_hash text, p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare result jsonb;
begin
  perform public.toolkit_assert_admin(p_actor_hash);
  result := public.toolkit_user_json(p_user_id);
  if result is null then raise exception using errcode = 'PT404', message = 'ACCOUNT_NOT_FOUND'; end if;
  return result;
end;
$$;

create function public.toolkit_admin_list_users(p_actor_hash text, p_page integer default 1, p_per_page integer default 25) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare result jsonb; has_next boolean;
begin
  perform public.toolkit_assert_admin(p_actor_hash);
  if p_page is null or p_per_page is null or p_page < 1 or p_page > 100000 or p_per_page < 1 or p_per_page > 100 then raise exception using errcode = 'PT400', message = 'INVALID_PAGE'; end if;
  select coalesce(jsonb_agg(public.toolkit_user_json(a.id) order by a.created_at desc, a.id), '[]'::jsonb) into result
    from (select id, created_at from public.toolkit_accounts order by created_at desc, id limit p_per_page offset (p_page - 1) * p_per_page) a;
  select exists(select 1 from public.toolkit_accounts offset p_page * p_per_page) into has_next;
  return jsonb_build_object('users', result, 'hasNext', has_next);
end;
$$;

create function public.toolkit_admin_create_account(p_actor_hash text, p_user_id uuid, p_email text, p_name text) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor uuid; auth_email text;
begin
  actor := public.toolkit_assert_admin(p_actor_hash);
  select lower(email) into auth_email from auth.users where id = p_user_id;
  if not found or auth_email is distinct from lower(btrim(p_email)) then raise exception using errcode = 'PT400', message = 'IDENTITY_MISMATCH'; end if;
  insert into public.toolkit_accounts(id, email, name, role) values(p_user_id, lower(btrim(p_email)), btrim(p_name), 'member');
  insert into public.toolkit_audit_events(actor_id, target_id, action) values(actor, p_user_id, 'account_created');
  return public.toolkit_user_json(p_user_id);
end;
$$;

create function public.toolkit_admin_record_invite(p_actor_hash text, p_user_id uuid, p_kind text) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor uuid;
begin
  actor := public.toolkit_assert_admin(p_actor_hash);
  if p_kind is null or p_kind not in ('invite', 'recovery') then raise exception using errcode = 'PT400', message = 'INVALID_MESSAGE'; end if;
  if not exists(select 1 from public.toolkit_accounts where id = p_user_id and status = 'active') then raise exception using errcode = 'PT404', message = 'ACCOUNT_NOT_FOUND'; end if;
  insert into public.toolkit_audit_events(actor_id, target_id, action, detail) values(actor, p_user_id, 'invitation_sent', jsonb_build_object('kind', p_kind));
end;
$$;

create function public.toolkit_admin_require_password_reset(p_actor_hash text, p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('toolkit-account-admin-v1', 0));
  actor := public.toolkit_assert_admin(p_actor_hash);
  update public.toolkit_accounts set requires_password_reset = true, security_version = security_version + 1,
    password_operation = null, password_operation_started_at = null, updated_at = clock_timestamp()
    where id = p_user_id and status = 'active';
  if not found then raise exception using errcode = 'PT404', message = 'ACCOUNT_NOT_FOUND'; end if;
  update public.toolkit_sessions set revoked_at = clock_timestamp() where account_id = p_user_id and revoked_at is null;
  insert into public.toolkit_audit_events(actor_id, target_id, action) values(actor, p_user_id, 'password_reset_requested');
  return public.toolkit_user_json(p_user_id);
end;
$$;

create function public.toolkit_admin_set_status(p_actor_hash text, p_user_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare actor uuid; target public.toolkit_accounts;
begin
  perform pg_advisory_xact_lock(hashtextextended('toolkit-account-admin-v1', 0));
  actor := public.toolkit_assert_admin(p_actor_hash);
  if p_status is null or p_status not in ('active', 'disabled') then raise exception using errcode = 'PT400', message = 'INVALID_STATUS'; end if;
  select * into target from public.toolkit_accounts where id = p_user_id for update;
  if not found then raise exception using errcode = 'PT404', message = 'ACCOUNT_NOT_FOUND'; end if;
  if p_status = 'disabled' and (actor = p_user_id or (target.role = 'admin' and target.status = 'active'
    and (select count(*) from public.toolkit_accounts where role = 'admin' and status = 'active') <= 1)) then
    raise exception using errcode = 'PT403', message = 'ADMIN_MUST_REMAIN_ACTIVE';
  end if;
  if target.status = p_status then return public.toolkit_user_json(p_user_id); end if;
  update public.toolkit_accounts set status = p_status, security_version = security_version + 1,
    password_operation = null, password_operation_started_at = null, updated_at = clock_timestamp() where id = p_user_id;
  update public.toolkit_sessions set revoked_at = clock_timestamp() where account_id = p_user_id and revoked_at is null;
  insert into public.toolkit_audit_events(actor_id, target_id, action, detail) values(actor, p_user_id, 'account_status_changed', jsonb_build_object('status', p_status));
  return public.toolkit_user_json(p_user_id);
end;
$$;

-- A durable claim serializes the external Auth password update for an account.
create function public.toolkit_begin_password_setup(p_token_hash text) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare session jsonb; account public.toolkit_accounts; operation uuid := gen_random_uuid();
begin
  session := public.toolkit_get_session(p_token_hash);
  if session is null then raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED'; end if;
  if session->>'purpose' <> 'setup' then raise exception using errcode = 'PT403', message = 'SETUP_SESSION_REQUIRED'; end if;
  select * into account from public.toolkit_accounts where id = (session->>'userId')::uuid for update;
  session := public.toolkit_get_session(p_token_hash);
  if session is null then raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED'; end if;
  if account.password_operation is not null and account.password_operation_started_at > clock_timestamp() - interval '5 minutes' then
    raise exception using errcode = 'PT409', message = 'PASSWORD_CHANGE_BUSY';
  end if;
  update public.toolkit_accounts set password_operation = operation, password_operation_started_at = clock_timestamp() where id = account.id;
  return jsonb_build_object('userId', account.id, 'operationId', operation);
end;
$$;

create function public.toolkit_cancel_password_setup(p_token_hash text, p_operation_id uuid) returns void
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  update public.toolkit_accounts a set password_operation = null, password_operation_started_at = null
    where a.password_operation = p_operation_id and exists(
      select 1 from public.toolkit_sessions s where s.account_id = a.id and s.token_hash = p_token_hash and s.purpose = 'setup'
    );
end;
$$;

create function public.toolkit_complete_password_setup(p_token_hash text, p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare session jsonb; account public.toolkit_accounts;
begin
  session := public.toolkit_get_session(p_token_hash);
  if session is null then raise exception using errcode = 'PT401', message = 'UNAUTHENTICATED'; end if;
  if session->>'purpose' <> 'setup' then raise exception using errcode = 'PT403', message = 'SETUP_SESSION_REQUIRED'; end if;
  select * into account from public.toolkit_accounts where id = (session->>'userId')::uuid for update;
  session := public.toolkit_get_session(p_token_hash);
  if session is null or p_operation_id is null or account.password_operation is null
    or account.password_operation_started_at is null or account.password_operation is distinct from p_operation_id
    or account.password_operation_started_at <= clock_timestamp() - interval '5 minutes' then
    raise exception using errcode = 'PT409', message = 'PASSWORD_CHANGE_EXPIRED';
  end if;
  update public.toolkit_accounts set activated_at = coalesce(activated_at, clock_timestamp()), requires_password_reset = false,
    security_version = security_version + 1, password_operation = null, password_operation_started_at = null, updated_at = clock_timestamp() where id = account.id;
  update public.toolkit_sessions set revoked_at = clock_timestamp() where account_id = account.id and revoked_at is null;
  insert into public.toolkit_audit_events(actor_id, target_id, action) values(account.id, account.id, 'password_set');
  return jsonb_build_object('userId', account.id);
end;
$$;

create function public.toolkit_consume_rate_limit(p_key_hash text, p_limit integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_now timestamptz := clock_timestamp(); current_attempts integer;
begin
  if p_key_hash is null or p_limit is null or p_window_seconds is null or p_key_hash !~ '^[0-9a-f]{64}$' or p_limit not between 1 and 1000 or p_window_seconds not between 1 and 86400 then
    raise exception using errcode = 'PT400', message = 'INVALID_RATE_LIMIT';
  end if;
  delete from public.toolkit_rate_limits where key_hash in (
    select key_hash from public.toolkit_rate_limits where expires_at < v_now - interval '1 day' limit 100
  );
  insert into public.toolkit_rate_limits as r(key_hash, window_started_at, attempts, expires_at)
    values(p_key_hash, v_now, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict(key_hash) do update set
    window_started_at = case when r.window_started_at <= v_now - make_interval(secs => p_window_seconds) then v_now else r.window_started_at end,
    attempts = case when r.window_started_at <= v_now - make_interval(secs => p_window_seconds) then 1 else least(r.attempts + 1, 1001) end,
    expires_at = v_now + make_interval(secs => p_window_seconds)
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;

-- One-time owner-run bootstrap. No public signup, email-string role grants or
-- ongoing role-editing endpoint exists. Only Kinan's immutable Auth ID is bound.
-- The pending administrator cannot get a full session before proving email
-- possession and setting a password through the normal setup flow.
create function public.toolkit_bootstrap_admin(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = pg_catalog, public as $$
declare auth_email text; existing public.toolkit_accounts;
begin
  perform pg_advisory_xact_lock(hashtextextended('toolkit-account-admin-v1', 0));
  select lower(email) into auth_email from auth.users where id = p_user_id;
  if not found or auth_email is distinct from 'kinan@inceif.edu.my' then
    raise exception using errcode = 'PT403', message = 'KINAN_ID_REQUIRED';
  end if;
  select * into existing from public.toolkit_accounts where role = 'admin' limit 1;
  if found then
    if existing.id = p_user_id then return public.toolkit_user_json(existing.id); end if;
    raise exception using errcode = 'PT409', message = 'BOOTSTRAP_ALREADY_COMPLETE';
  end if;
  insert into public.toolkit_accounts(id, email, name, role, activated_at, requires_password_reset)
    values(p_user_id, auth_email, 'Kinan', 'admin', null, true)
  on conflict(id) do update set role = 'admin', activated_at = null,
    requires_password_reset = true, status = 'active', security_version = public.toolkit_accounts.security_version + 1, updated_at = clock_timestamp();
  update public.toolkit_sessions set revoked_at = clock_timestamp() where account_id = p_user_id and revoked_at is null;
  insert into public.toolkit_audit_events(actor_id, target_id, action) values(p_user_id, p_user_id, 'admin_bootstrapped');
  return public.toolkit_user_json(p_user_id);
end;
$$;

-- SECURITY DEFINER functions are never callable by browser roles. Revoke the
-- PostgreSQL default PUBLIC EXECUTE grant, including on internal helpers.
do $$
declare fn record;
begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'toolkit_user_json', 'toolkit_get_session', 'toolkit_assert_admin', 'toolkit_create_session', 'toolkit_revoke_session',
      'toolkit_admin_get_user', 'toolkit_admin_list_users', 'toolkit_admin_create_account', 'toolkit_admin_record_invite',
      'toolkit_admin_require_password_reset', 'toolkit_admin_set_status', 'toolkit_begin_password_setup',
      'toolkit_cancel_password_setup', 'toolkit_complete_password_setup', 'toolkit_consume_rate_limit', 'toolkit_bootstrap_admin'
    ])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
commit;
