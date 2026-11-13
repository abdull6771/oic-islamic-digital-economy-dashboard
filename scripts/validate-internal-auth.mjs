import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { checkInternalAccess, createInternalAuthMiddleware } from "../server/auth.js";

const password = randomBytes(32).toString("base64url");
const authorization = (user, secret) => `Basic ${Buffer.from(`${user}:${secret}`).toString("base64")}`;
const valid = authorization("internal", password);
const full = { buildEdition: "full", siteEdition: "full", password };
let count = 0;
async function check(name, run) {
  await run();
  count++;
  console.log(`PASS ${name}`);
}

await check("public allows anonymous requests only when artifact and deployment agree", () => {
  assert.equal(checkInternalAccess(null, { buildEdition: "public", siteEdition: "public" }), null);
  for (const [buildEdition, siteEdition] of [[null, "public"], ["full", "public"], ["public", "full"], ["public", undefined], ["full", undefined], ["typo", "public"]]) {
    assert.equal(checkInternalAccess(valid, { buildEdition, siteEdition, password }).status, 503);
  }
});

await check("full deployments fail closed with missing or malformed server credentials", () => {
  for (const extra of [{ password: undefined }, { password: "" }, { password: "   " }, { username: "" }, { username: "bad:user" }, { password: "bad\nsecret" }]) {
    assert.equal(checkInternalAccess(valid, { ...full, ...extra }).status, 503);
  }
});

await check("full requests require both the configured username and password", () => {
  assert.equal(checkInternalAccess(valid, full), null);
  assert.equal(checkInternalAccess(authorization("custom-user", password), { ...full, username: "custom-user" }), null);
  for (const supplied of [null, "", authorization("other", password), authorization("internal", "incorrect"), authorization("internal", ""), `Bearer ${password}`]) {
    const response = checkInternalAccess(supplied, full);
    assert.equal(response.status, 401);
    assert.match(response.headers.get("www-authenticate"), /^Basic /);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.match(response.headers.get("x-robots-tag"), /noindex/);
  }
});

await check("malformed, duplicate, oversized and invalid UTF-8 Basic headers are rejected safely", () => {
  for (const supplied of ["Basic !!!", "Basic a", "Basic YQ==,Basic YQ==", "Basic YQ===", "Basic /w==", "Basic " + "A".repeat(8192), `Basic ${Buffer.from("no-colon").toString("base64")}`, `Basic ${Buffer.from("internal:bad\nsecret").toString("base64")}`]) {
    assert.equal(checkInternalAccess(supplied, full).status, 401);
  }
  const utfPassword = "test-meaningful-\u00e9:colon";
  assert.equal(checkInternalAccess(authorization("internal", utfPassword), { ...full, password: utfPassword }), null);
});

await check("authentication responses never echo supplied or configured secrets", async () => {
  for (const response of [checkInternalAccess(authorization("internal", "wrong-" + password), full), checkInternalAccess(valid, { ...full, siteEdition: undefined })]) {
    const content = JSON.stringify([...response.headers]) + await response.text();
    assert.ok(!content.includes(password));
    assert.ok(!content.includes(valid));
  }
});

async function withServer(options, run) {
  const guard = createInternalAuthMiddleware(options);
  const server = createServer((req, res) => {
    guard(req, res, () => {
      // Exercise a downstream static handler trying to enable public caching.
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.writeHead(200, { "Cache-Control": "public, max-age=31536000", "Content-Type": "text/plain" });
      res.end(`resource:${req.url}`);
    }).catch(() => { res.statusCode = 500; res.end("Unexpected guard error"); });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
    server.closeAllConnections();
    await once(server, "close");
  }
}

await check("HTTP guard protects HTML, source, assets, APIs and hidden paths", async () => {
  await withServer({ edition: "full", env: { SITE_EDITION: "full", INTERNAL_SITE_PASSWORD: password } }, async (origin) => {
    for (const path of ["/", "/index.html", "/assets/internal.js", "/src/views/WhatIfCalculator.jsx", "/api/data", "/.env", "/server/build-edition.js", "/favicon.ico"]) {
      for (const auth of [undefined, authorization("internal", "wrong")]) {
        const result = await fetch(origin + path, { headers: auth ? { Authorization: auth } : {} });
        assert.equal(result.status, 401, path);
        assert.ok(!(await result.text()).includes("resource:"));
      }
      const result = await fetch(origin + path, { headers: { Authorization: valid } });
      assert.equal(result.status, 200, path);
      assert.match(result.headers.get("cache-control"), /private, no-store/);
      assert.equal(result.headers.get("cdn-cache-control"), "no-store");
      assert.match(result.headers.get("vary"), /Authorization/);
      assert.match(await result.text(), /^resource:/);
    }
    const head = await fetch(origin + "/assets/internal.js", { method: "HEAD" });
    assert.equal(head.status, 401);
    assert.equal(await head.text(), "");
  });
});

await check("HTTP guard rejects missing secrets and explicit edition mismatches", async () => {
  for (const options of [{ edition: "full", env: {} }, { edition: "full", env: { SITE_EDITION: "public", INTERNAL_SITE_PASSWORD: password } }, { edition: "public", env: { SITE_EDITION: "full", INTERNAL_SITE_PASSWORD: password } }]) {
    await withServer(options, async (origin) => {
      const result = await fetch(origin + "/assets/app.js", { headers: { Authorization: valid } });
      assert.equal(result.status, 503);
      assert.ok(!(await result.text()).includes("resource:"));
    });
  }
});

await check("public local server serves requests without credentials", async () => {
  await withServer({ edition: "public", env: {} }, async (origin) => {
    const result = await fetch(origin + "/");
    assert.equal(result.status, 200);
  });
});

await check("Vercel guard covers every path and contains no client-exposed credential names", () => {
  const middleware = readFileSync(new URL("../middleware.js", import.meta.url), "utf8");
  assert.match(middleware, /matcher:\s*"\/:path\*"/);
  assert.match(middleware, /BUILD_EDITION/);
  assert.match(middleware, /process\.env\.SITE_EDITION/);
  assert.ok(!middleware.includes("VITE_INTERNAL"));
});

console.log(`${count} internal authentication checks passed.`);
