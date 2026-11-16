const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const csrfField = (token) => `<input type="hidden" name="csrfToken" value="${escapeHtml(token)}">`;
const toolkitIcon = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3 13h18M10 13v2h4v-2"/></svg>';

function messages(notice, error) {
  return `${notice ? `<div class="account-message account-message--success" role="status"><p>${escapeHtml(notice)}</p></div>` : ""}${error ? `<div class="account-message account-message--error" role="alert"><p>${escapeHtml(error)}</p></div>` : ""}`;
}

function page({ title, description = "", content, nonce = "", wide = false, navigation = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)} | Digital Economy Index: OIC Countries 2025</title>
  <style${nonce ? ` nonce="${escapeHtml(nonce)}"` : ""}>
    :root{font-family:Georgia,"Times New Roman",serif;color:#1e293b;background:#f1f5f9;color-scheme:light;font-synthesis:none}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;min-width:280px;-webkit-font-smoothing:antialiased}
    h1,h2,h3,p{margin:0}
    button,input{font:inherit}
    a{color:#0369a1;text-underline-offset:3px}a:hover{color:#075985}
    :focus-visible{outline:3px solid #38bdf8;outline-offset:3px}
    .account-header{background:#0b1f3a;color:#fff}
    .account-header-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;max-width:1240px;margin:auto;padding:22px 28px}
    .account-brand{display:flex;align-items:center;gap:12px;max-width:500px;color:#fff;text-decoration:none}
    .account-brand:hover{color:#fff}
    .account-brand-icon{display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border-radius:10px;background:#38bdf8;color:#0b1f3a}
    .account-brand-copy{display:flex;flex-direction:column;gap:4px;font-size:17px;font-weight:700;line-height:1.3}
    .account-brand-copy small{font-size:12px;font-weight:400;color:#bae6fd;letter-spacing:.02em}
    .account-navigation{display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;font-size:14px}
    .account-navigation a{color:#cbd5e1;text-decoration:none}.account-navigation a:hover{color:#fff;text-decoration:underline}
    .account-navigation form{margin:0}
    .account-navigation button{border:1px solid #47647a;border-radius:8px;padding:8px 12px;background:transparent;color:#e2e8f0;font-size:13px;cursor:pointer}
    .account-navigation button:hover{color:#fff;border-color:#7dd3fc}
    .account-main{width:100%;max-width:760px;margin:auto;padding:56px 28px 64px}
    .account-main--wide{max-width:1240px}
    .account-intro{margin-bottom:30px}
    .account-eyebrow{margin-bottom:12px;color:#0369a1;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
    .account-intro h1{color:#0f2942;font-size:36px;line-height:1.2;letter-spacing:-.025em}
    .account-description{max-width:64ch;margin-top:13px;color:#64748b;font-size:16px;line-height:1.65}
    .account-card{padding:30px;border:1px solid #dce5ee;border-radius:16px;background:#fff;box-shadow:0 4px 20px rgba(15,41,66,.025)}
    .account-card+.account-card{margin-top:28px}
    .account-card-heading{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px;margin-bottom:22px}
    .account-card h2{color:#0f2942;font-size:23px;line-height:1.3}
    .account-hint{color:#64748b;font-size:13px;line-height:1.6}
    .account-card-heading .account-hint{max-width:54ch}
    .account-create-form{display:grid;grid-template-columns:1fr 1.2fr auto;gap:18px;align-items:end}
    .account-field{display:flex;flex-direction:column;gap:9px;min-width:0}
    .account-field label{color:#334155;font-size:14px;font-weight:700}
    .account-field input{width:100%;min-width:0;min-height:48px;border:1px solid #cbd5e1;border-radius:8px;padding:11px 13px;background:#fff;color:#0f2942;font-size:16px;line-height:1.4}
    .account-field input:hover{border-color:#94a3b8}
    .account-field input:focus{border-color:#0284c7;outline:none;box-shadow:0 0 0 3px #e0f2fe}
    .account-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid #38bdf8;border-radius:8px;padding:11px 18px;background:#38bdf8;color:#0b1f3a;font-size:14px;font-weight:700;line-height:1.5;text-decoration:none;cursor:pointer}
    .account-button:hover{background:#7dd3fc;border-color:#7dd3fc;color:#0b1f3a}
    .account-button--secondary{border-color:#cbd5e1;background:#fff;color:#334155}
    .account-button--secondary:hover{border-color:#94a3b8;background:#f8fafc;color:#0f2942}
    .account-button--small{min-height:36px;padding:7px 10px;font-size:12px;white-space:nowrap}
    .account-button--danger{border-color:#fecaca;background:#fff;color:#9f1239}
    .account-button--danger:hover{border-color:#fda4af;background:#fff1f2;color:#9f1239}
    .account-message{margin-bottom:24px;padding:14px 16px;border:1px solid;border-radius:9px;font-size:14px;line-height:1.6;overflow-wrap:anywhere}
    .account-message--success{border-color:#a7f3d0;background:#ecfdf5;color:#065f46}
    .account-message--error{border-color:#fecaca;background:#fff1f2;color:#9f1239}
    .account-table-scroll{max-width:100%;overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px}
    .account-table{width:100%;min-width:850px;border-collapse:collapse;font-size:14px;line-height:1.5;text-align:left}
    .account-table th{padding:13px 16px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;border-bottom:1px solid #e2e8f0}
    .account-table td{padding:17px 16px;vertical-align:middle;border-bottom:1px solid #e2e8f0}
    .account-table tbody tr:last-child td{border-bottom:0}
    .account-user-name{display:block;color:#0f2942;font-weight:700;overflow-wrap:anywhere}
    .account-user-email{display:block;max-width:32ch;margin-top:3px;color:#64748b;font-size:13px;overflow-wrap:anywhere}
    .account-status{display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-size:12px;line-height:1.5;white-space:nowrap}
    .account-status--active{background:#dcfce7;color:#166534}.account-status--pending{background:#fef3c7;color:#92400e}.account-status--disabled{background:#f1f5f9;color:#475569}
    .account-row-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:210px}
    .account-row-actions form{margin:0}
    .account-self{font-size:12px;color:#64748b}
    .account-last-login{font-size:12px;color:#64748b;white-space:nowrap}
    .account-empty{padding:26px!important;color:#64748b;text-align:center}
    .account-pagination{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-top:22px;color:#64748b;font-size:13px}
    .account-pagination-links{display:flex;align-items:center;gap:10px}
    .account-password-form{display:flex;flex-direction:column;gap:23px}
    .account-password-form .account-button{align-self:flex-start;min-width:160px;margin-top:3px}
    .account-confirm-copy,.account-message-copy{color:#475569;font-size:16px;line-height:1.7;white-space:pre-line;overflow-wrap:anywhere}
    .account-confirm-form{margin-top:26px}
    .account-footer{max-width:1240px;margin:0 auto;padding:0 28px 28px;color:#64748b;font-size:12px;line-height:1.6}
    .visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @media(max-width:900px){.account-create-form{grid-template-columns:1fr 1fr}.account-create-form .account-button{grid-column:1/-1;justify-self:start}.account-header-inner{gap:18px}.account-navigation{font-size:13px}}
    @media(max-width:600px){.account-header-inner{padding:20px}.account-brand-copy{font-size:15px}.account-brand-copy small{font-size:11px}.account-navigation{gap:12px 16px}.account-main{padding:34px 20px 44px}.account-intro h1{font-size:30px}.account-description{font-size:15px}.account-card{padding:22px 20px;border-radius:13px}.account-card h2{font-size:21px}.account-create-form{grid-template-columns:1fr}.account-create-form .account-button{justify-self:stretch}.account-pagination{align-items:flex-start;flex-direction:column}.account-footer{padding:0 20px 24px}.account-password-form .account-button{width:100%}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important}}
  </style>
</head>
<body>
  <header class="account-header"><div class="account-header-inner"><a class="account-brand" href="/"><span class="account-brand-icon">${toolkitIcon}</span><span class="account-brand-copy">Digital Economy Index: OIC Countries 2025<small>INCEIF University · Internal workspace</small></span></a>${navigation}</div></header>
  <main class="account-main${wide ? " account-main--wide" : ""}" id="main"><div class="account-intro"><p class="account-eyebrow">Internal workspace</p><h1>${escapeHtml(title)}</h1>${description ? `<p class="account-description">${escapeHtml(description)}</p>` : ""}</div>${content}</main>
  <footer class="account-footer">INCEIF University · Islamic Digital Economy Project</footer>
</body>
</html>`;
}

function accountNavigation(csrfToken) {
  return `<nav class="account-navigation" aria-label="Account"><a href="/">Home</a><a href="/account/password">Change password</a><form action="/auth/logout" method="post">${csrfField(csrfToken)}<button type="submit">Sign out</button></form></nav>`;
}

function rowAction(action, userId, csrfToken, label, { status, danger = false } = {}) {
  return `<form action="${action}" method="post">${csrfField(csrfToken)}<input type="hidden" name="userId" value="${escapeHtml(userId)}">${status ? `<input type="hidden" name="status" value="${escapeHtml(status)}">` : ""}<button class="account-button account-button--secondary account-button--small${danger ? " account-button--danger" : ""}" type="submit">${escapeHtml(label)}</button></form>`;
}

function lastSignIn(user) {
  const value = user.lastSignInAt ?? user.lastLogin ?? user.last_login_at ?? user.last_sign_in_at;
  if (!value) return '<span class="account-last-login">Not signed in yet</span>';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '<span class="account-last-login">Unavailable</span>';
  const label = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos", timeZoneName: "short" }).format(date);
  return `<time class="account-last-login" datetime="${escapeHtml(date.toISOString())}">${escapeHtml(label)}</time>`;
}

export function renderAdminPage({ viewer = {}, users = [], page: pageNumber = 1, hasNext = false, csrfToken, notice = "", error = "", nonce = "" } = {}) {
  const currentPage = Number.isSafeInteger(Number(pageNumber)) && Number(pageNumber) > 0 ? Number(pageNumber) : 1;
  const suppliedUsers = Array.isArray(users) ? users : [];
  const listedUsers = suppliedUsers.slice(0, 50);
  const rows = listedUsers.map((user) => {
    const disabled = user.status === "disabled";
    const pending = !user.activatedAt;
    const statusName = disabled ? "Disabled" : pending ? "Invitation pending" : "Active";
    const statusClass = disabled ? "disabled" : pending ? "pending" : "active";
    const self = String(user.id) === String(viewer.id);
    const mailAction = pending
      ? rowAction("/admin/users/invite", user.id, csrfToken, "Resend invitation")
      : rowAction("/admin/users/reset", user.id, csrfToken, "Send reset link");
    const accessAction = self ? '<span class="account-self">Your account</span>' : rowAction("/admin/users/status", user.id, csrfToken, disabled ? "Enable access" : "Disable access", { status: disabled ? "active" : "disabled", danger: !disabled });
    return `<tr><td><span class="account-user-name">${escapeHtml(user.name || "Name not set")}</span><span class="account-user-email">${escapeHtml(user.email)}</span></td><td>${escapeHtml(user.role === "admin" ? "Administrator" : "Member")}</td><td><span class="account-status account-status--${statusClass}">${statusName}</span></td><td>${lastSignIn(user)}</td><td><div class="account-row-actions">${mailAction}${accessAction}</div></td></tr>`;
  }).join("");
  const viewerName = viewer.name || viewer.email || "Administrator";
  const nextAvailable = Boolean(hasNext) || suppliedUsers.length > 50;
  const content = `${messages(notice, error)}
    <section class="account-card" aria-labelledby="create-user-title"><div class="account-card-heading"><h2 id="create-user-title">Invite a colleague</h2><p class="account-hint">New users receive member access to the full toolkit.</p></div><form class="account-create-form" method="post" action="/admin/users/create" autocomplete="off">${csrfField(csrfToken)}<div class="account-field"><label for="new-user-name">Full name</label><input id="new-user-name" name="name" type="text" maxlength="120" required></div><div class="account-field"><label for="new-user-email">Email address</label><input id="new-user-email" name="email" type="email" maxlength="254" autocapitalize="none" spellcheck="false" required></div><button class="account-button" type="submit">Create and invite user</button></form></section>
    <section class="account-card" aria-labelledby="users-title"><div class="account-card-heading"><h2 id="users-title">Users</h2><p class="account-hint">Signed in as ${escapeHtml(viewerName)}</p></div><div class="account-table-scroll" role="region" aria-label="User accounts" tabindex="0"><table class="account-table"><caption class="visually-hidden">User account name, email, role, access status, last sign-in and available actions</caption><thead><tr><th scope="col">Name and email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last sign-in</th><th scope="col">Actions</th></tr></thead><tbody>${rows || '<tr><td class="account-empty" colspan="5">No users to display.</td></tr>'}</tbody></table></div><nav class="account-pagination" aria-label="User pagination"><span>Page ${currentPage}</span><span class="account-pagination-links">${currentPage > 1 ? `<a class="account-button account-button--secondary account-button--small" href="/admin/users?page=${currentPage - 1}">Previous</a>` : ""}${nextAvailable ? `<a class="account-button account-button--secondary account-button--small" href="/admin/users?page=${currentPage + 1}">Next</a>` : ""}</span></nav></section>`;
  return page({ title: "Manage users", description: "Invite colleagues and manage access to the full toolkit.", content, nonce, wide: true, navigation: accountNavigation(csrfToken) });
}

export function renderPasswordPage({ csrfToken, setup = false, error = "", nonce = "" } = {}) {
  const title = setup ? "Set your password" : "Change password";
  const currentPassword = setup ? "" : '<div class="account-field"><label for="current-password">Current password</label><input id="current-password" name="currentPassword" type="password" autocomplete="current-password" maxlength="128" required autofocus></div>';
  const content = `${messages("", error)}<section class="account-card"><form class="account-password-form" action="/account/password" method="post">${csrfField(csrfToken)}${currentPassword}<div class="account-field"><label for="new-password">New password</label><input id="new-password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" aria-describedby="password-hint" required${setup ? " autofocus" : ""}><p class="account-hint" id="password-hint">Use at least 12 characters.</p></div><div class="account-field"><label for="confirm-password">Confirm new password</label><input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></div><button class="account-button" type="submit">${setup ? "Save password" : "Update password"}</button></form></section>`;
  return page({ title, description: setup ? "Choose a password for your individual internal account." : "Keep access to your internal account up to date.", content, nonce, navigation: accountNavigation(csrfToken) });
}

export function renderConfirmPage({ csrfToken, tokenHash, type, error = "", nonce = "" } = {}) {
  const content = `${messages("", error)}<section class="account-card"><p class="account-confirm-copy">Continue to choose a password for your internal account.</p><form class="account-confirm-form" action="/auth/confirm" method="post">${csrfField(csrfToken)}<input type="hidden" name="tokenHash" value="${escapeHtml(tokenHash)}"><input type="hidden" name="type" value="${escapeHtml(type)}"><button class="account-button" type="submit">Continue to set password</button></form></section>`;
  return page({ title: "Complete your account access", description: "Digital Economy Index: OIC Countries 2025", content, nonce });
}

export function renderMessagePage({ title = "Account access", message = "", nonce = "" } = {}) {
  return page({ title, content: `<section class="account-card"><p class="account-message-copy">${escapeHtml(message)}</p></section>`, nonce });
}
