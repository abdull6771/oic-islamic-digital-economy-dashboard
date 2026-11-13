/** Verify edition access, rendered entry points and the production module graph. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build as bundle } from "esbuild";
import { build as buildSite, resolveConfig } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXPLORE = ["overview", "profiles", "compare", "pillar", "geo", "trends", "divide"];
const RESTRICTED = ["whatif", "builder", "peers", "policy", "quality", "stats", "methodology", "reports", "history"];
const PUBLIC_VIEWS = ["home", ...EXPLORE, "acknowledgement"];
const FULL_VIEWS = [...PUBLIC_VIEWS, ...RESTRICTED];
const INTERNAL_MODULES = [
  "WhatIfCalculator.jsx", "CustomIndexBuilder.jsx", "PeerLearning.jsx",
  "PolicyRecommendations.jsx", "DataQualityExplorer.jsx", "StatisticalAnalysis.jsx",
  "Methodology.jsx", "ReportDownloads.jsx", "UpdateHistory.jsx",
];
const datasetPath = join(ROOT, "src/data/adei-dataset.json");
const hashData = () => createHash("sha256").update(readFileSync(datasetPath)).digest("hex");
const sourceHash = hashData();
const source = JSON.parse(readFileSync(datasetPath, "utf8"));
const setEqual = (actual, expected, message) => assert.deepEqual([...actual].sort(), [...expected].sort(), message);
let checks = 0;
async function check(name, action) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}

// Keep the fixture within this checkout so external React imports use the same
// installation as the renderer. The fixture contains no secrets or source edits.
const temporaryParent = join(ROOT, "tmp");
mkdirSync(temporaryParent, { recursive: true });
const temporary = mkdtempSync(join(temporaryParent, "edition-check-"));

async function loadEdition(edition) {
  const outfile = join(temporary, `${edition}.mjs`);
  await bundle({
    stdin: {
      contents: [
        'export * from "./src/lib/site-edition.js";',
        'export * from "./src/lib/tool-catalog.js";',
        'export { VIEWS, DEFAULT_VIEW } from "./src/lib/nav.js";',
        'export { META, COUNTRIES } from "./src/data/index.js";',
        'export { default as LandingPage } from "./src/views/LandingPage.jsx";',
        'export { default as CommandPalette } from "./src/components/CommandPalette.jsx";',
        'export { default as CountryProfiles } from "./src/views/CountryProfiles.jsx";',
        'export { default as App } from "./src/App.jsx";',
        'export { navigate, openCountry } from "./src/lib/routing.js";',
      ].join("\n"),
      resolveDir: ROOT,
      sourcefile: `edition-check-${edition}.js`,
    },
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    alias: { "#edition-views": join(ROOT, `src/views/registry.${edition}.js`) },
    loader: { ".css": "empty" },
    define: {
      "import.meta.env": JSON.stringify({ VITE_SITE_EDITION: edition, MODE: edition, DEV: false, PROD: true }),
      __SITE_EDITION__: JSON.stringify(edition),
    },
    jsx: "automatic",
    logLevel: "silent",
  });
  return import(pathToFileURL(outfile).href);
}

const routeLinks = (markup) => [...markup.matchAll(/href="([^"]*)"/g)].flatMap((match) => {
  const href = match[1].replaceAll("&amp;", "&");
  if (!href.startsWith("#")) return [];
  const tab = new URLSearchParams(href.slice(1)).get("tab");
  return tab ? [tab] : [];
});
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

try {
  const editions = { public: await loadEdition("public"), full: await loadEdition("full") };

  await check("public and full editions compile to their intended fixed setting", () => {
    assert.equal(editions.public.EDITION, "public");
    assert.equal(editions.public.IS_PUBLIC, true);
    assert.equal(editions.full.EDITION, "full");
    assert.equal(editions.full.IS_PUBLIC, false);
  });
  await check("public allows the seven Explore tools and informational pages only", () => {
    for (const edition of Object.values(editions)) {
      setEqual(edition.allowedViewIds("public"), PUBLIC_VIEWS);
      for (const id of PUBLIC_VIEWS) assert.equal(edition.canAccessView(id, "public"), true, id);
      for (const id of RESTRICTED) {
        assert.equal(edition.canAccessView(id, "public"), false, id);
        assert.equal(edition.resolveView(id, "public"), "home", `Public direct link ${id}`);
      }
    }
  });
  await check("full edition preserves all sixteen tools and Acknowledgements", () => {
    for (const edition of Object.values(editions)) {
      setEqual(edition.allowedViewIds("full"), FULL_VIEWS);
      for (const id of FULL_VIEWS) {
        assert.equal(edition.canAccessView(id, "full"), true, id);
        assert.equal(edition.resolveView(id, "full"), id, id);
      }
    }
  });
  await check("unknown or malformed view identifiers cannot select a component", () => {
    for (const edition of Object.values(editions)) {
      for (const id of [null, undefined, "", "missing", "__proto__", "constructor", "WHATIF", "whatif/../overview"]) {
        for (const mode of ["public", "full"]) {
          assert.equal(edition.canAccessView(id, mode), false, String(id));
          assert.equal(edition.resolveView(id, mode), "home", String(id));
        }
      }
    }
  });
  await check("programmatic navigation applies the same public restriction as direct links", () => {
    const previousWindow = globalThis.window;
    try {
      globalThis.window = { location: { hash: "" } };
      for (const id of RESTRICTED) {
        globalThis.window.location.hash = "#tab=overview&country=Nigeria";
        editions.public.navigate({ tab: id });
        const params = new URLSearchParams(globalThis.window.location.hash.replace(/^#/, ""));
        assert.equal(params.get("tab"), "home", id);
        assert.equal(params.get("country"), null, "Blocked routes do not retain stale tool state");
      }
      editions.public.openCountry("Nigeria");
      let params = new URLSearchParams(globalThis.window.location.hash.replace(/^#/, ""));
      assert.equal(params.get("tab"), "profiles");
      assert.equal(params.get("country"), "Nigeria");
      for (const id of RESTRICTED) {
        editions.full.navigate({ tab: id });
        params = new URLSearchParams(globalThis.window.location.hash.replace(/^#/, ""));
        assert.equal(params.get("tab"), id, id);
      }
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  });
  await check("the public App renders Home immediately for every restricted direct hash", () => {
    const previousWindow = globalThis.window;
    try {
      for (const id of RESTRICTED) {
        globalThis.window = { location: { hash: `#tab=${id}&country=Nigeria` } };
        const markup = render(editions.public.App);
        assert.ok(markup.includes('class="landing-page landing-page--public"'), id);
        assert.ok(!markup.includes('class="app-shell"'), `Restricted dashboard shell ${id}`);
      }
      for (const hash of ["#tab=%77hatif", "#tab=builder&edition=full", "#tab=quality&mode=full", "#tab=reports&tab=overview"]) {
        globalThis.window = { location: { hash } };
        assert.ok(render(editions.public.App).includes('class="landing-page landing-page--public"'), hash);
      }
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  });
  await check("navigation defaults to Home and preserves the overview deep link as Dashboard", () => {
    for (const [mode, edition] of Object.entries(editions)) {
      assert.equal(edition.DEFAULT_VIEW, "home");
      assert.equal(edition.VIEWS.find(({ id }) => id === "overview")?.label, "Dashboard");
      setEqual(edition.VIEWS.map(({ id }) => id), mode === "public" ? PUBLIC_VIEWS : FULL_VIEWS);
    }
  });
  await check("the shared catalog contains exactly sixteen distinct tools in the four requested groups", () => {
    for (const edition of Object.values(editions)) {
      setEqual(edition.TOOL_CATALOG.map(({ id }) => id), [...EXPLORE, ...RESTRICTED]);
      setEqual(edition.TOOL_GROUPS.map(({ id }) => id), ["explore", "simulate", "learn", "data"]);
      assert.equal(new Set(edition.TOOL_CATALOG.map(({ id }) => id)).size, 16);
      setEqual(edition.TOOL_CATALOG.filter(({ group }) => group === "explore").map(({ id }) => id), EXPLORE);
      assert.ok(edition.TOOL_CATALOG.every(({ label, description, group }) => label && description && edition.TOOL_GROUPS.some(({ id }) => id === group)));
    }
  });
  await check("public landing names the forthcoming tools without linking to them", () => {
    const edition = editions.public;
    const markup = render(edition.LandingPage, { edition: "public", onNavigate() {} });
    const links = routeLinks(markup);
    for (const id of EXPLORE) assert.ok(links.includes(id), `Missing Explore link ${id}`);
    for (const tool of edition.TOOL_CATALOG.filter(({ id }) => RESTRICTED.includes(id))) {
      assert.ok(markup.includes(tool.label.replaceAll("&", "&amp;")), `Missing forthcoming card ${tool.label}`);
      assert.ok(!links.includes(tool.id), `Restricted link ${tool.id}`);
    }
    assert.match(markup, /coming soon|in development/i);
  });
  await check("full landing links all sixteen tools", () => {
    const edition = editions.full;
    const links = routeLinks(render(edition.LandingPage, { edition: "full", onNavigate() {} }));
    for (const id of [...EXPLORE, ...RESTRICTED]) assert.ok(links.includes(id), id);
  });
  await check("the public command palette cannot surface restricted tools", () => {
    const markup = render(editions.public.CommandPalette, { open: true, onClose() {}, onSelectView() {}, onSelectCountry() {} });
    for (const id of EXPLORE) assert.ok(markup.includes(`view:${id}`), id);
    for (const id of RESTRICTED) assert.ok(!markup.includes(`view:${id}`), id);
  });
  await check("Country Profiles hides PDF and bulk report entry points on the public site", () => {
    const markup = render(editions.public.CountryProfiles);
    assert.ok(!markup.includes("profile-export-pdf"));
    assert.ok(!markup.includes("profile-export-all"));
    assert.ok(!markup.includes('id="country-report-downloads"'));
    assert.ok(!routeLinks(markup).includes("reports"));
    assert.ok(markup.includes("Export CSV"), "Existing public profile CSV remains available");
  });
  await check("full Country Profiles keeps PDF and bulk report controls", () => {
    const markup = render(editions.full.CountryProfiles);
    assert.ok(markup.includes("profile-export-pdf"));
    assert.ok(markup.includes("profile-export-all"));
    assert.ok(markup.includes('id="country-report-downloads"'));
  });
  await check("both editions read the same current dataset and source fingerprint", () => {
    for (const edition of Object.values(editions)) {
      assert.equal(edition.META.sourceSha256, source.meta.sourceSha256);
      assert.equal(edition.META.sourceUpdated, source.meta.sourceUpdated);
      assert.equal(edition.COUNTRIES.length, source.meta.countryCount);
    }
    assert.deepEqual(editions.public.COUNTRIES, editions.full.COUNTRIES);
  });
  await check("the real Vite build configuration fixes the intended edition and view registry", async () => {
    for (const edition of ["public", "full"]) {
      const config = await resolveConfig({ root: ROOT, configFile: join(ROOT, "vite.config.js"), mode: edition, logLevel: "silent" }, "build");
      assert.equal(JSON.parse(config.define?.__SITE_EDITION__ || "null"), edition, edition);
      const registry = config.resolve.alias.find(({ find }) => find === "#edition-views");
      assert.ok(registry?.replacement.replaceAll("\\", "/").endsWith(`/registry.${edition}.js`), edition);
    }
  });

  const graphs = {};
  for (const edition of ["public", "full"]) {
    const result = await buildSite({
      root: ROOT,
      configFile: join(ROOT, "vite.config.js"),
      mode: edition,
      logLevel: "silent",
      build: { write: false, minify: false, sourcemap: false, emptyOutDir: false },
    });
    const bundles = Array.isArray(result) ? result : [result];
    graphs[edition] = bundles.flatMap((output) => output.output || []).filter(({ type }) => type === "chunk")
      .flatMap(({ modules }) => Object.keys(modules)).map((path) => path.replaceAll("\\", "/"));
  }
  await check("public production chunks exclude every internal tool and PDF/ZIP implementation", () => {
    for (const file of INTERNAL_MODULES) assert.ok(!graphs.public.some((path) => path.endsWith(`/${file}`)), file);
    for (const fragment of ["/registry.full.js", "/lib/country-reports.js", "/node_modules/jspdf/", "/node_modules/jszip/"]) {
      assert.ok(!graphs.public.some((path) => path.includes(fragment)), fragment);
    }
    assert.ok(graphs.public.some((path) => path.endsWith("/registry.public.js")));
  });
  await check("full production chunks retain all nine restricted tool implementations", () => {
    for (const file of INTERNAL_MODULES) assert.ok(graphs.full.some((path) => path.endsWith(`/${file}`)), file);
    assert.ok(graphs.full.some((path) => path.endsWith("/lib/country-reports.js")));
  });
  await check("rendering and both production builds leave the source data unchanged", () => assert.equal(hashData(), sourceHash));
  console.log(`${checks} edition checks passed.`);
} finally {
  // Delete only the exact temporary directory created above, never a supplied
  // path or the shared checkout/dependency directories.
  const cleanupTarget = resolve(temporary);
  if (dirname(cleanupTarget) === resolve(temporaryParent) && relative(temporaryParent, cleanupTarget).startsWith("edition-check-") && existsSync(cleanupTarget)) {
    rmSync(cleanupTarget, { recursive: true, force: true });
  }
}
