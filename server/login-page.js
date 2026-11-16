const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

const toolkitIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3 13h18M10 13v2h4v-2"/></svg>';
const lockIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>';
const arrowIcon = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const checkIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';

/**
 * This page is served before the protected application or its assets. The form
 * works without JavaScript; the small enhancement adds password visibility and
 * submit feedback. Supply `nonce` when using a nonce-based content security policy.
 */
export function renderLoginPage({ csrfToken, returnTo = "/", error = "", username = "", sessionHours = 8, nonce = "" } = {}) {
  const safeHours = Number.isFinite(sessionHours) && sessionHours > 0 && sessionHours <= 24 ? sessionHours : 8;
  const nonceAttribute = nonce ? ` nonce="${escapeHtml(nonce)}"` : "";
  const safeUsername = escapeHtml(username);
  const errorMarkup = error ? `<div class="login-error" id="login-error" role="alert"><span class="error-symbol" aria-hidden="true">!</span><p>${escapeHtml(error)}</p></div>` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="color-scheme" content="light">
  <title>Sign in | Digital Economy Index: OIC Countries 2025</title>
  <style${nonceAttribute}>
    :root{font-family:Georgia,"Times New Roman",serif;color:#1e293b;background:#f1f5f9;font-synthesis:none;color-scheme:light}
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;min-width:280px;-webkit-font-smoothing:antialiased}
    button,input{font:inherit}
    a{color:#0369a1;text-underline-offset:3px}
    a:hover{color:#075985}
    button,a,input{ -webkit-tap-highlight-color:transparent }
    :focus-visible{outline:3px solid #38bdf8;outline-offset:4px}
    .login-page{min-height:100vh;min-height:100svh;display:grid;place-items:center;padding:40px 24px;background:radial-gradient(ellipse at 15% 10%,#e0f2fe 0,transparent 47%),#f1f5f9}
    .login-shell{width:100%;max-width:1080px;display:grid;grid-template-columns:1.03fr 1fr;border:1px solid #dce5ee;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 20px 70px rgba(15,41,66,.08)}
    .login-story{position:relative;display:flex;flex-direction:column;min-height:650px;padding:44px 42px;color:#fff;background:#0f2942;overflow:hidden}
    .login-story::after{position:absolute;right:-88px;bottom:80px;width:310px;height:310px;content:"";border:1px solid rgba(125,211,252,.12);border-radius:50%;box-shadow:0 0 0 40px rgba(125,211,252,.035),0 0 0 80px rgba(125,211,252,.025);pointer-events:none}
    .login-brand{display:flex;align-items:center;gap:12px;position:relative;z-index:1}
    .brand-icon{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#38bdf8;color:#0b1f3a}
    .brand-name{display:flex;flex-direction:column;gap:4px;font-size:17px;font-weight:700;line-height:1.25;max-width:295px}
    .brand-name small{color:#bae6fd;font-size:12px;font-weight:400;letter-spacing:.02em}
    .story-body{position:relative;z-index:1;margin:auto 0;padding:54px 0 40px}
    .workspace-label{display:inline-flex;align-items:center;gap:7px;border:1px solid #44627d;border-radius:999px;padding:6px 11px;color:#bae6fd;font-size:12px;line-height:1.2}
    .story-body h2{margin:24px 0 18px;font-size:39px;font-weight:700;line-height:1.15;letter-spacing:-.025em}
    .story-description{margin:0;color:#cbd5e1;font-size:17px;line-height:1.7;max-width:35ch}
    .story-features{display:flex;flex-direction:column;gap:13px;padding:0;margin:30px 0 0;list-style:none;color:#e2e8f0;font-size:14px;line-height:1.5}
    .story-features li{display:flex;align-items:center;gap:10px}
    .story-features svg{flex-shrink:0;color:#7dd3fc}
    .story-footer{position:relative;z-index:1;color:#94a3b8;font-size:12px;line-height:1.6}
    .login-panel{display:flex;flex-direction:column;justify-content:center;padding:56px 48px}
    .form-eyebrow{display:flex;align-items:center;gap:8px;margin:0 0 18px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
    .login-panel h1{margin:0 0 13px;color:#0f2942;font-size:38px;font-weight:700;line-height:1.15;letter-spacing:-.025em}
    .form-description{margin:0;color:#64748b;font-size:16px;line-height:1.6}
    .login-form{margin-top:32px}
    .login-field{display:block;margin:0 0 22px}
    .login-field>label{display:block;margin-bottom:9px;color:#334155;font-size:14px;font-weight:700}
    .login-field input{display:block;width:100%;height:52px;border:1px solid #cbd5e1;border-radius:9px;padding:12px 14px;background:#fff;color:#0f2942;font-size:16px;line-height:1.4;transition:border-color .15s,box-shadow .15s}
    .login-field input:hover{border-color:#94a3b8}
    .login-field input:focus{border-color:#0284c7;outline:none;box-shadow:0 0 0 3px #e0f2fe}
    .login-field input::placeholder{color:#94a3b8;opacity:1}
    .password-control{position:relative}
    .password-control input{padding-right:75px}
    .password-toggle{position:absolute;right:6px;top:6px;min-height:40px;min-width:58px;border:0;border-radius:6px;padding:7px;background:transparent;color:#0369a1;font-size:13px;font-weight:700;cursor:pointer}
    .password-toggle:hover{background:#f0f9ff}
    [hidden]{display:none!important}
    .sign-in{display:flex;align-items:center;justify-content:center;gap:11px;width:100%;min-height:52px;margin-top:8px;padding:13px 20px;border:1px solid #38bdf8;border-radius:9px;background:#38bdf8;color:#0b1f3a;font-size:16px;line-height:1.4;font-weight:700;cursor:pointer;transition:background .15s,border-color .15s}
    .sign-in:hover{background:#7dd3fc;border-color:#7dd3fc}
    .sign-in:disabled{cursor:wait;background:#bae6fd;border-color:#bae6fd}
    .session-note{margin:16px 0 0;text-align:center;color:#64748b;font-size:12px;line-height:1.6}
    .support-note{margin:32px 0 0;padding-top:24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px;line-height:1.7}
    .support-note a{font-weight:700;overflow-wrap:anywhere}
    .login-error{display:flex;align-items:flex-start;gap:10px;margin-bottom:24px;padding:13px 14px;border:1px solid #fecaca;border-radius:8px;background:#fff1f2;color:#9f1239;font-size:14px;line-height:1.5}
    .login-error p{margin:0}
    .error-symbol{display:grid;place-items:center;flex:0 0 18px;width:18px;height:18px;margin-top:1px;border:1px solid currentColor;border-radius:50%;font-size:12px;font-weight:700;line-height:1}
    @media(max-width:900px){.login-story{padding:36px 30px}.login-panel{padding:48px 32px}.story-body h2{font-size:34px}.story-description{font-size:16px}.brand-name{font-size:16px}}
    @media(max-width:680px){.login-page{padding:24px 16px;align-items:start}.login-shell{max-width:480px;grid-template-columns:1fr;border-radius:18px}.login-story{min-height:0;padding:26px 28px}.brand-name{font-size:16px;max-width:none}.brand-name small{font-size:11px}.story-body{margin:0;padding:24px 0 0}.workspace-label{font-size:11px}.story-body h2{margin:15px 0 0;font-size:27px;line-height:1.2}.story-description,.story-features,.story-footer{display:none}.login-panel{padding:34px 28px}.form-eyebrow{margin-bottom:14px;font-size:11px}.login-panel h1{font-size:32px}.login-form{margin-top:26px}.support-note{margin-top:26px;padding-top:20px}}
    @media(max-width:360px){.login-page{padding:16px 10px}.login-story,.login-panel{padding-left:22px;padding-right:22px}.brand-name{font-size:15px}.brand-icon{flex-basis:38px;width:38px;height:38px}.story-body h2{font-size:25px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}}
  </style>
</head>
<body>
  <main class="login-page">
    <div class="login-shell">
      <section class="login-story" aria-labelledby="workspace-title">
        <div class="login-brand"><span class="brand-icon">${toolkitIcon}</span><div class="brand-name">Digital Economy Index: OIC Countries 2025</div></div>
        <div class="story-body">
          <span class="workspace-label">${lockIcon} Internal workspace</span>
          <h2 id="workspace-title">The full policy toolkit,<br>in one workspace.</h2>
          <p class="story-description">Benchmark country performance, test policy scenarios and learn from peers across the OIC.</p>
          <ul class="story-features"><li>${checkIcon}Explore country and regional performance</li><li>${checkIcon}Simulate changes in policy priorities</li><li>${checkIcon}Work with the complete set of tools</li></ul>
        </div>
        <div class="story-footer">INCEIF University<br>Islamic Digital Economy Project</div>
      </section>
      <section class="login-panel" aria-labelledby="login-title">
        <p class="form-eyebrow">${lockIcon} Full version access</p>
        <h1 id="login-title">Welcome back</h1>
        <p class="form-description">Sign in with your internal credentials.</p>
        <form class="login-form" id="login-form" method="post" action="/auth/login"${error ? ' aria-describedby="login-error"' : ""}>
          ${errorMarkup}
          <input type="hidden" name="csrfToken" value="${escapeHtml(csrfToken)}">
          <input type="hidden" name="returnTo" id="return-to" value="${escapeHtml(returnTo)}">
          <div class="login-field"><label for="username">Username</label><input id="username" name="username" type="text" value="${safeUsername}" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="256" required${username ? "" : " autofocus"}></div>
          <div class="login-field"><label for="password">Password</label><div class="password-control"><input id="password" name="password" type="password" autocomplete="current-password" maxlength="2048" required${username ? " autofocus" : ""}><button class="password-toggle" id="password-toggle" type="button" aria-label="Show password" aria-controls="password" aria-pressed="false" hidden>Show</button></div></div>
          <button class="sign-in" id="sign-in" type="submit"><span id="sign-in-label">Sign in</span>${arrowIcon}</button>
          <p class="session-note">Signed-in sessions expire after ${safeHours} ${safeHours === 1 ? "hour" : "hours"}.</p>
        </form>
        <p class="support-note">Need access or help signing in?<br><a href="mailto:devbabura@gmail.com">Contact the toolkit administrator</a></p>
      </section>
    </div>
  </main>
  <script${nonceAttribute}>
    (() => {
      const password = document.getElementById("password");
      const toggle = document.getElementById("password-toggle");
      toggle.hidden = false;
      toggle.addEventListener("click", () => {
        const visible = password.type === "password";
        password.type = visible ? "text" : "password";
        toggle.textContent = visible ? "Hide" : "Show";
        toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
        toggle.setAttribute("aria-pressed", String(visible));
      });
      const target = document.getElementById("return-to");
      if (window.location.hash && !target.value.includes("#")) target.value += window.location.hash;
      document.getElementById("login-form").addEventListener("submit", () => {
        document.getElementById("sign-in").disabled = true;
        document.getElementById("sign-in-label").textContent = "Signing in…";
      });
    })();
  </script>
</body>
</html>`;
}
