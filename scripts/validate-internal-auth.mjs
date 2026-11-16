import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { handleInternalRequest, createInternalAuthMiddleware, sanitizeReturnTo } from "../server/auth.js";
import { renderLoginPage } from "../server/login-page.js";

const password = randomBytes(32).toString("base64url");
const sessionSecret = randomBytes(32).toString("base64url");
const full = { buildEdition: "full", siteEdition: "full", username: "internal", password, sessionSecret };
const base = "http://127.0.0.1:9876";
let count = 0;
async function check(name, run) {
  await run();
  count++;
  console.log(`PASS ${name}`);
}
const cookiePairs = (response) => response.headers.getSetCookie().map((cookie) => cookie.split(";", 1)[0]);
const cookies = (response) => cookiePairs(response).filter((pair) => pair.split("=").slice(1).join("=")).join("; ");
const cookieValue = (response, name) => cookiePairs(response).find((pair) => pair.startsWith(`${name}=`))?.slice(name.length + 1);
const sessionCookie = (response, secure = false) => {
  const name = secure ? "__Host-oic_session" : "oic_session";
  const value = cookieValue(response, name);
  assert.ok(value, "Successful login must set a session cookie");
  return `${name}=${value}`;
};
const hiddenValue = (html, name) => {
  const tag = (html.match(/<input\b[^>]*>/g) || []).find((input) => input.includes(`name="${name}"`));
  const value = tag?.match(/\bvalue="([^"]*)"/)?.[1];
  assert.ok(value !== undefined, `Login form needs ${name}`);
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
};
async function call(path, { options = full, origin = base, method = "GET", headers = {}, form, cookie, rawBody } = {}) {
  const requestHeaders = new Headers(headers);
  if (cookie) requestHeaders.set("Cookie", cookie);
  if (form !== undefined) requestHeaders.set("Content-Type", "application/x-www-form-urlencoded");
  return handleInternalRequest(new Request(new URL(path, origin), {
    method,
    headers: requestHeaders,
    ...((form !== undefined || rawBody !== undefined) ? { body: form !== undefined ? new URLSearchParams(form).toString() : rawBody } : {}),
  }), options);
}
async function loginForm({ options = full, origin = base, returnTo = "/" } = {}) {
  const response = await call(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`, { options, origin });
  assert.equal(response.status, 200);
  const html = await response.text();
  return { response, csrfToken: hiddenValue(html, "csrfToken"), cookie: cookies(response), returnTo: hiddenValue(html, "returnTo"), html };
}
async function signIn({ options = full, origin = base, username = options.username || "internal", secret = options.password, returnTo = "/" } = {}) {
  const state = await loginForm({ options, origin, returnTo });
  const response = await call("/auth/login", { options, origin, method: "POST", headers: { Origin: origin }, cookie: state.cookie,
    form: { username, password: secret, csrfToken: state.csrfToken, returnTo: state.returnTo } });
  return { state, response };
}

await check("public requests remain anonymous only when build and deployment settings agree", async () => {
  assert.equal(await call("/", { options: { buildEdition: "public", siteEdition: "public" } }), null);
  assert.equal(await call("/auth/login", { options: { buildEdition: "public", siteEdition: "public" } }), null);
  for (const [buildEdition, siteEdition] of [[null, "public"], ["full", "public"], ["public", "full"], ["public", undefined], ["full", undefined], ["typo", "public"]]) {
    assert.equal((await call("/", { options: { ...full, buildEdition, siteEdition } })).status, 503);
  }
});
await check("full access fails closed for missing or malformed server credentials", async () => {
  for (const extra of [{ password: undefined }, { password: "" }, { password: "   " }, { username: "" }, { username: "bad:user" }, { password: "bad\nsecret" }]) {
    assert.equal((await call("/auth/login", { options: { ...full, ...extra } })).status, 503);
  }
});
await check("the full edition requires an independent server session secret", async () => {
  for (const missingOrInvalid of [undefined, "", "short", "x".repeat(31), " ".repeat(40), "x".repeat(40) + "\n"]) {
    assert.equal((await call("/auth/login", { options: { ...full, sessionSecret: missingOrInvalid } })).status, 503);
  }
});
await check("unauthenticated documents lead to login while internal assets and APIs stay inaccessible", async () => {
  for (const path of ["/", "/index.html", "/some-document"]) {
    const response = await call(path, { headers: { Accept: "text/html" } });
    assert.equal(response.status, 303, path);
    assert.ok(response.headers.get("location").startsWith("/auth/login"));
    assert.equal(response.headers.get("www-authenticate"), null);
  }
  for (const path of ["/assets/app.js", "/src/App.jsx", "/api/data", "/.env", "/server/auth.js"]) {
    const response = await call(path);
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get("www-authenticate"), null);
  }
});
await check("the branded login page is independent of protected application assets", async () => {
  const state = await loginForm();
  assert.match(state.response.headers.get("content-type"), /text\/html/);
  assert.match(state.html, /Digital Economy Index: OIC Countries 2025/);
  assert.match(state.html, /name="username"/);
  assert.match(state.html, /name="password"/);
  assert.match(state.html, /action="\/auth\/login"/);
  assert.ok(state.cookie.includes("oic_login_csrf="));
  const csrfCookie = state.response.headers.getSetCookie().find((value) => value.startsWith("oic_login_csrf="));
  assert.match(csrfCookie, /HttpOnly/i);
  assert.match(csrfCookie, /SameSite=Strict/i);
  assert.match(csrfCookie, /Max-Age=600/i);
  assert.ok(!state.html.includes('/src/main.jsx'));
  assert.ok(!state.html.includes(password));
  assert.ok(!state.html.includes(sessionSecret));
  assert.equal(state.response.headers.get("www-authenticate"), null);
});
await check("the login template escapes dynamic content and never fills a password", () => {
  const html = renderLoginPage({ csrfToken: '\"><script>csrf</script>', returnTo: '/\"><script>redirect</script>', username: '\"><script>user</script>', error: '<img src=x onerror=alert(1)>' });
  for (const raw of ["<script>csrf</script>", "<script>redirect</script>", "<script>user</script>", "<img src=x onerror=alert(1)>"]) assert.ok(!html.includes(raw));
  const passwordField = (html.match(/<input\b[^>]*>/g) || []).find((input) => input.includes('name="password"'));
  assert.ok(passwordField && !/\bvalue="[^"]+"/.test(passwordField));
});
await check("valid credentials create a private eight-hour session and restore the requested view", async () => {
  const { response } = await signIn({ returnTo: "/#tab=whatif" });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/#tab=whatif");
  const session = response.headers.getSetCookie().find((value) => value.startsWith("oic_session="));
  assert.match(session, /HttpOnly/i);
  assert.match(session, /SameSite=Strict/i);
  assert.match(session, /Path=\//i);
  assert.match(session, /Max-Age=28800/i);
  assert.ok(!/Domain=/i.test(session));
  assert.ok(!/;\s*Secure/i.test(session), "Loopback HTTP cookie must remain usable");
  assert.equal(await call("/assets/internal.js", { cookie: sessionCookie(response) }), null);
});
await check("HTTPS sessions use a host-only Secure cookie", async () => {
  const { response } = await signIn({ origin: "https://internal.example.test" });
  assert.equal(response.status, 303);
  const session = response.headers.getSetCookie().find((value) => value.startsWith("__Host-oic_session="));
  assert.ok(session);
  assert.match(session, /;\s*Secure/i);
  assert.match(session, /HttpOnly/i);
  assert.match(session, /SameSite=Strict/i);
  assert.ok(!/Domain=/i.test(session));
  assert.equal(await call("/assets/internal.js", { origin: "https://internal.example.test", cookie: sessionCookie(response, true) }), null);
});
await check("wrong usernames and passwords get the same generic error without creating a session", async () => {
  for (const [username, secret] of [["someone-else", password], ["internal", "incorrect-" + password], ["internal", ""]]) {
    const { response } = await signIn({ username, secret });
    assert.equal(response.status, 401);
    assert.ok(!cookieValue(response, "oic_session"));
    const html = await response.text();
    assert.match(html, /role="alert"/);
    assert.ok(!html.includes(password));
    assert.ok(!html.includes(secret || "not-an-empty-placeholder"));
    assert.equal(response.headers.get("www-authenticate"), null);
  }
});
await check("legacy Basic authorization cannot bypass the login screen", async () => {
  const header = "Basic " + Buffer.from(`internal:${password}`).toString("base64");
  assert.equal((await call("/assets/app.js", { headers: { Authorization: header } })).status, 401);
});
await check("login rejects missing, mismatched, tampered and expired CSRF tokens", async () => {
  const now = 1_800_000_000_000;
  const options = { ...full, now };
  const state = await loginForm({ options });
  const validForm = { username: "internal", password, csrfToken: state.csrfToken, returnTo: "/" };
  const mutations = [
    { cookie: undefined, form: validForm },
    { cookie: state.cookie, form: { ...validForm, csrfToken: "" } },
    { cookie: state.cookie, form: { ...validForm, csrfToken: state.csrfToken + "x" } },
    { cookie: state.cookie, form: validForm, options: { ...options, now: now + 10 * 60 * 1000 + 1 } },
  ];
  for (const mutation of mutations) {
    const response = await call("/auth/login", { options, method: "POST", headers: { Origin: base }, ...mutation });
    assert.equal(response.status, 403);
    assert.ok(!cookieValue(response, "oic_session"));
  }
});
await check("login and logout require the exact same-origin Origin header", async () => {
  const state = await loginForm();
  const { response: signedIn } = await signIn();
  for (const origin of [undefined, "null", "https://attacker.example", "http://127.0.0.1:9877"]) {
    const response = await call("/auth/login", { method: "POST", headers: origin ? { Origin: origin } : {}, cookie: state.cookie,
      form: { username: "internal", password, csrfToken: state.csrfToken, returnTo: "/" } });
    assert.equal(response.status, 403);
    assert.equal((await call("/auth/logout", { method: "POST", headers: origin ? { Origin: origin } : {}, cookie: sessionCookie(signedIn), form: {} })).status, 403);
  }
});
await check("signed CSRF tokens and session tokens cannot substitute for each other", async () => {
  const state = await loginForm();
  assert.equal((await call("/assets/app.js", { cookie: `oic_session=${state.csrfToken}` })).status, 401);
  const { response: signedIn } = await signIn();
  const session = cookieValue(signedIn, "oic_session");
  const form = { username: "internal", password, csrfToken: session, returnTo: "/" };
  const result = await call("/auth/login", { method: "POST", headers: { Origin: base }, cookie: `oic_login_csrf=${session}`, form });
  assert.equal(result.status, 403);
  const forged = state.csrfToken.slice(0, 20) + (state.csrfToken[20] === "A" ? "B" : "A") + state.csrfToken.slice(21);
  assert.equal((await call("/auth/login", { method: "POST", headers: { Origin: base }, cookie: `oic_login_csrf=${forged}`, form: { ...form, csrfToken: forged } })).status, 403);
});
await check("ambiguous, oversized and malformed login forms are rejected before authentication", async () => {
  const state = await loginForm();
  const validBody = new URLSearchParams({ username: "internal", password, csrfToken: state.csrfToken, returnTo: "/" }).toString();
  const bodyCases = [
    { rawBody: validBody + "&username=someone-else", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    { rawBody: validBody + "&padding=" + "x".repeat(9000), headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    { rawBody: JSON.stringify({ username: "internal", password }), headers: { "Content-Type": "application/json" } },
    { rawBody: Buffer.from([0xff]), headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  ];
  for (const body of bodyCases) {
    const result = await call("/auth/login", { method: "POST", cookie: state.cookie, ...body, headers: { Origin: base, ...body.headers } });
    assert.equal(result.status, 400);
    assert.ok(!cookieValue(result, "oic_session"));
  }
});
await check("session signatures, expiry and credential or signing-secret rotation prevent stale access", async () => {
  const now = 1_800_000_000_000;
  const options = { ...full, now };
  const { response } = await signIn({ options });
  const session = sessionCookie(response);
  assert.equal(await call("/assets/app.js", { options, cookie: session }), null);
  const value = session.slice(session.indexOf("=") + 1);
  const middle = Math.floor(value.length / 2);
  const tampered = value.slice(0, middle) + (value[middle] === "A" ? "B" : "A") + value.slice(middle + 1);
  for (const [cookie, changed] of [
    [`oic_session=${tampered}`, options],
    [session, { ...options, now: now + 8 * 60 * 60 * 1000 + 1 }],
    [session, { ...options, now: now - 60_000 }],
    [session, { ...options, password: "rotated-" + password }],
    [session, { ...options, sessionSecret: "rotated-" + sessionSecret }],
    [session, { ...options, username: "changed-user" }],
  ]) assert.equal((await call("/assets/app.js", { cookie, options: changed })).status, 401);
});
await check("malformed and duplicate session cookies cannot select an authenticated identity", async () => {
  const { response } = await signIn();
  const session = sessionCookie(response);
  for (const cookie of ["oic_session=not-a-token", "oic_session=" + "x".repeat(20_000), "oic_session=%FF", `${session}; ${session}`, `oic_session=wrong; ${session}`]) {
    assert.equal((await call("/assets/app.js", { cookie })).status, 401);
  }
});
await check("return destinations cannot redirect outside this site or back into authentication", () => {
  for (const destination of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "\\attacker.example", "/%2f%2fattacker.example", "/%5cattacker.example", "/%0d%0aLocation:evil", "/auth/login", "/auth/logout?returnTo=/", "/auth/login/../login", "/%2e%2e//evil.test", "/..//evil.test", "/%2E//evil.test"]) {
    assert.equal(sanitizeReturnTo(destination), "/", destination);
  }
  assert.equal(sanitizeReturnTo("/#tab=whatif"), "/#tab=whatif");
  assert.equal(sanitizeReturnTo("/index.html?country=Malaysia#tab=profiles"), "/index.html?country=Malaysia#tab=profiles");
  assert.equal(sanitizeReturnTo("/#country=United%20Arab%20Emirates&tab=profiles"), "/#country=United%20Arab%20Emirates&tab=profiles");
});
await check("logout is a same-origin POST that clears the browser session", async () => {
  const { response: signedIn } = await signIn();
  assert.equal((await call("/auth/logout", { cookie: sessionCookie(signedIn) })).status, 405);
  const response = await call("/auth/logout", { method: "POST", headers: { Origin: base }, cookie: sessionCookie(signedIn), form: {} });
  assert.equal(response.status, 303);
  assert.ok(response.headers.get("location").startsWith("/auth/login"));
  const deletion = response.headers.getSetCookie().find((value) => value.startsWith("oic_session="));
  assert.match(deletion, /Max-Age=0/i);
  assert.match(deletion, /HttpOnly/i);
  assert.match(deletion, /SameSite=Strict/i);
});
await check("authentication responses are uncacheable and never echo configured credentials", async () => {
  const state = await loginForm();
  const denied = await call("/assets/app.js");
  for (const response of [state.response, denied, await call("/", { options: { ...full, siteEdition: undefined } })]) {
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
    const html = response.bodyUsed ? "" : await response.text();
    const exposed = JSON.stringify([...response.headers]) + html;
    assert.ok(!exposed.includes(password));
    assert.ok(!exposed.includes(sessionSecret));
  }
});

async function withServer(options, run) {
  const guard = createInternalAuthMiddleware(options);
  const server = createServer((req, res) => {
    guard(req, res, () => {
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.writeHead(200, { "Cache-Control": "public, max-age=31536000", "Content-Type": "text/plain" });
      res.end(`resource:${req.url}`);
    }).catch(() => { res.statusCode = 500; res.end("Unexpected guard error"); });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.close(); server.closeAllConnections(); await once(server, "close"); }
}
await check("the live HTTP adapter completes login, protects every path and clears logout cookies", async () => {
  await withServer({ edition: "full", env: { SITE_EDITION: "full", INTERNAL_SITE_PASSWORD: password, INTERNAL_SESSION_SECRET: sessionSecret } }, async (origin) => {
    const getForm = await fetch(origin + "/auth/login", { redirect: "manual" });
    assert.equal(getForm.status, 200);
    const csrfToken = hiddenValue(await getForm.text(), "csrfToken");
    const login = await fetch(origin + "/auth/login", { method: "POST", redirect: "manual", headers: { Origin: origin, Cookie: cookies(getForm), "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username: "internal", password, csrfToken, returnTo: "/" }) });
    assert.equal(login.status, 303);
    const session = sessionCookie(login);
    for (const path of ["/", "/index.html", "/assets/internal.js", "/src/views/WhatIfCalculator.jsx", "/api/data", "/.env", "/server/build-edition.js"]) {
      const denied = await fetch(origin + path, { redirect: "manual", headers: path === "/" || path === "/index.html" ? { Accept: "text/html" } : {} });
      assert.ok([303, 401].includes(denied.status), path);
      assert.ok(!(await denied.text()).includes("resource:"));
      const allowed = await fetch(origin + path, { headers: { Cookie: session } });
      assert.equal(allowed.status, 200, path);
      assert.match(allowed.headers.get("cache-control"), /private, no-store/);
      assert.equal(allowed.headers.get("cdn-cache-control"), "no-store");
      assert.match(await allowed.text(), /^resource:/);
    }
    const head = await fetch(origin + "/assets/internal.js", { method: "HEAD", redirect: "manual" });
    assert.equal(head.status, 401);
    assert.equal(await head.text(), "");
    const logout = await fetch(origin + "/auth/logout", { method: "POST", redirect: "manual", headers: { Origin: origin, Cookie: session } });
    assert.equal(logout.status, 303);
    assert.ok(logout.headers.getSetCookie().some((value) => value.startsWith("oic_session=") && /Max-Age=0/i.test(value)));
  });
});
await check("public local HTTP requests remain available without login", async () => {
  await withServer({ edition: "public", env: {} }, async (origin) => assert.equal((await fetch(origin + "/")).status, 200));
});
await check("Vercel uses the same all-path session handler without exposing secret variables", () => {
  const middleware = readFileSync(new URL("../middleware.js", import.meta.url), "utf8");
  assert.match(middleware, /matcher:\s*"\/:path\*"/);
  assert.match(middleware, /handleInternalRequest/);
  assert.match(middleware, /BUILD_EDITION/);
  assert.match(middleware, /process\.env\.SITE_EDITION/);
  assert.ok(!middleware.includes("VITE_INTERNAL"));
});
console.log(`${count} internal login and session checks passed.`);
