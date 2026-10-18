/**
 * Exercise the real PDF and ZIP exporters without a browser or source workbook.
 * Run: node scripts/validate-country-reports.mjs
 * If Python + pypdf are installed, also inspect every generated PDF's text/pages.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";
import { COUNTRIES, PILLARS, REFERENCE_YEAR, getCountryYear } from "../src/data/index.js";
import { buildCountryReport } from "../src/lib/country-report-data.js";
import {
  countryReportFilename,
  createAllCountryReports,
  createCountryReportPdf,
} from "../src/lib/country-reports.js";

const generatedAt = new Date("2026-10-18T12:34:56.000Z");
const countries = [...COUNTRIES].sort((a, b) => a.rank - b.rank);
const sourceBefore = JSON.stringify(COUNTRIES);
let checks = 0;
function check(name, action) {
  action();
  checks++;
  console.log(`PASS ${name}`);
}
async function checkAsync(name, action) {
  await action();
  checks++;
  console.log(`PASS ${name}`);
}
const isAbortError = (error) => error?.name === "AbortError";
const normalized = (text) => text.normalize("NFKD").replace(/\p{Diacritic}/gu, "")
  .replace(/[‘’]/g, "'").replace(/[‐‑–—]/g, "-").replace(/\s+/g, " ").toLowerCase();

check("the published dataset covers 57 distinct countries", () => {
  assert.equal(countries.length, 57);
  assert.equal(new Set(countries.map(({ name }) => name)).size, countries.length);
});

check("all reports use published country-specific scores and all nine pillars", () => {
  for (const country of countries) {
    const report = buildCountryReport(country, { generatedAt });
    assert.equal(report.country.name, country.name);
    assert.equal(report.country.rank, country.rank);
    assert.equal(report.country.adei, country.adei);
    assert.equal(report.assessmentYear, REFERENCE_YEAR);
    assert.equal(report.countryCount, countries.length);
    assert.equal(report.generatedAt, generatedAt.toISOString());
    assert.equal(report.pillars.length, 9);
    for (const pillar of PILLARS) {
      assert.equal(report.pillars.find(({ key }) => key === pillar.key)?.score, country[pillar.key]);
    }
  }
});

check("report data depends on the passed country, independent of UI selection", () => {
  const country = countries.at(-1);
  const clonedCountry = { ...country, selected: countries[0].name, activeYear: 2021 };
  assert.deepEqual(buildCountryReport(clonedCountry, { generatedAt }), buildCountryReport(country, { generatedAt }));
  assert.notDeepEqual(buildCountryReport(countries[0], { generatedAt }), buildCountryReport(country, { generatedAt }));
});

check("stale years, altered metrics and invalid dates cannot silently enter reports", () => {
  assert.throws(() => buildCountryReport(getCountryYear(countries[0].name, 2021), { generatedAt }));
  assert.throws(() => buildCountryReport({ ...countries[0], adei: countries[0].adei + 1 }, { generatedAt }));
  assert.throws(() => buildCountryReport({ ...countries[0], p1: countries[0].p1 + 1 }, { generatedAt }));
  assert.throws(() => buildCountryReport(countries[0], { generatedAt: "invalid date" }));
});

check("report recommendations handle both leaders and countries below every benchmark", () => {
  const leader = buildCountryReport(countries[0], { generatedAt });
  const last = buildCountryReport(countries.at(-1), { generatedAt });
  assert.equal(leader.gapToGlobalLeader, 0);
  assert.match(leader.recommendations.at(-1).text, /leads|sustain/i);
  assert.doesNotMatch(leader.recommendations.at(-1).text, /close the 0\.0 point gap/i);
  assert.ok(last.strongest.delta < 0);
  assert.match(last.recommendations[0].text, /below/i);
  assert.doesNotMatch(last.recommendations[0].text, /-\d[\d.]* points above/i);
});

check("every report filename is unique, portable and a PDF", () => {
  const filenames = countries.map(countryReportFilename);
  assert.equal(new Set(filenames).size, countries.length);
  for (const filename of filenames) {
    assert.match(filename, /\.pdf$/i);
    assert.doesNotMatch(filename, /[<>:"/\\|?*\x00-\x1f]/);
  }
});

await checkAsync("a pre-cancelled export stops before generating any report", async () => {
  const controller = new AbortController();
  controller.abort();
  const progress = [];
  await assert.rejects(createAllCountryReports({ generatedAt, signal: controller.signal, onProgress: (event) => progress.push(event) }), isAbortError);
  assert.equal(progress.length, 0);
});

await checkAsync("cancellation interrupts generation before the remaining countries", async () => {
  const controller = new AbortController();
  const progress = [];
  await assert.rejects(createAllCountryReports({
    generatedAt,
    signal: controller.signal,
    onProgress(event) {
      progress.push(event);
      if (event.phase === "generating" && event.completed >= 3) controller.abort();
    },
  }), isAbortError);
  assert.ok(progress.some(({ phase, completed }) => phase === "generating" && completed === 3));
  assert.ok(progress.every(({ completed }) => completed <= 3));
  assert.ok(progress.every(({ phase }) => phase !== "packaging"));
});

await checkAsync("cancellation during ZIP compression does not return a partial download", async () => {
  const controller = new AbortController();
  let reachedCompression = false;
  await assert.rejects(createAllCountryReports({
    generatedAt,
    signal: controller.signal,
    onProgress(event) {
      if (event.phase === "packaging" && event.percent > 0) {
        reachedCompression = true;
        controller.abort();
      }
    },
  }), isAbortError);
  assert.ok(reachedCompression);
});

const progress = [];
const archive = await createAllCountryReports({ generatedAt, onProgress: (event) => progress.push(event) });
const zip = await JSZip.loadAsync(archive.bytes, { checkCRC32: true });
const entries = Object.values(zip.files).filter(({ dir }) => !dir);
const pdfs = [];
for (let index = 0; index < entries.length; index++) {
  pdfs.push({ name: entries[index].name, country: countries[index], bytes: await entries[index].async("uint8array") });
}

check("one ZIP contains every country exactly once in ranking order", () => {
  assert.ok(archive.bytes instanceof Uint8Array);
  assert.equal(archive.count, countries.length);
  assert.match(archive.filename, /\.zip$/i);
  assert.equal(entries.length, countries.length);
  assert.deepEqual(entries.map(({ name }) => name), countries.map(countryReportFilename));
  assert.ok(entries.every(({ name }) => /\.pdf$/i.test(name)));
  assert.ok(Object.values(zip.files).every(({ dir }) => !dir));
});

check("every archive entry is a complete, distinct PDF with valid framing", () => {
  const hashes = new Set();
  for (const { bytes } of pdfs) {
    assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
    assert.match(Buffer.from(bytes.slice(-100)).toString(), /%%EOF\s*$/);
    assert.ok(bytes.length > 1000);
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
  }
  assert.equal(hashes.size, countries.length);
});

check("progress describes all countries and finishes packaging at 100 percent", () => {
  const generating = progress.filter(({ phase }) => phase === "generating");
  const packaging = progress.filter(({ phase }) => phase === "packaging");
  assert.ok(generating.length >= countries.length);
  assert.ok(packaging.length > 0);
  assert.ok(progress.every(({ total }) => total === countries.length));
  for (const country of countries) assert.ok(generating.some((event) => event.country === country.name));
  assert.equal(generating.at(-1).completed, countries.length);
  assert.equal(packaging.at(-1).completed, countries.length);
  assert.equal(packaging.at(-1).percent, 100);
  for (let index = 1; index < generating.length; index++) assert.ok(generating[index].completed >= generating[index - 1].completed);
  for (let index = 1; index < packaging.length; index++) assert.ok(packaging[index].percent >= packaging[index - 1].percent);
});

const individual = await createCountryReportPdf(countries[0], { generatedAt });
check("the individual export returns actual PDF bytes using the same API", () => {
  assert.ok(individual instanceof Uint8Array);
  assert.equal(Buffer.from(individual.slice(0, 5)).toString(), "%PDF-");
});

const python = String.raw`
import base64, io, json, sys
from pypdf import PdfReader
reports = json.load(sys.stdin)
result = []
for item in reports:
    reader = PdfReader(io.BytesIO(base64.b64decode(item["pdf"])), strict=True)
    result.append({"name": item["name"], "pages": len(reader.pages), "text": "\n".join(page.extract_text() or "" for page in reader.pages), "pageTexts": [page.extract_text() or "" for page in reader.pages]})
json.dump(result, sys.stdout)
`;
const pythonProbe = spawnSync("python", ["-c", "import pypdf"], { encoding: "utf8" });
if (pythonProbe.status === 0) {
  const input = [...pdfs, { name: "individual", country: countries[0], bytes: individual }]
    .map(({ name, bytes }) => ({ name, pdf: Buffer.from(bytes).toString("base64") }));
  const result = spawnSync("python", ["-c", python], {
    input: JSON.stringify(input), encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  const extracted = JSON.parse(result.stdout);
  check("all 57 PDFs parse strictly and contain their own country, score, year and nine pillars", () => {
    for (let index = 0; index < pdfs.length; index++) {
      const { country } = pdfs[index];
      const report = extracted[index];
      const text = normalized(report.text);
      assert.ok(report.pages > 0, country.name);
      assert.ok(report.pageTexts.every((page) => page.trim().length > 30), `${country.name}: blank page`);
      assert.ok(text.includes(normalized(country.name)), `${country.name}: country text`);
      assert.ok(text.includes(country.adei.toFixed(1)), `${country.name}: score`);
      assert.ok(text.includes(String(REFERENCE_YEAR)), `${country.name}: year`);
      for (const pillar of PILLARS) assert.ok(text.includes(normalized(pillar.name)), `${country.name}: ${pillar.name}`);
      assert.doesNotMatch(text, /\bundefined\b|\bNaN\b/i, country.name);
      for (const note of buildCountryReport(country, { generatedAt }).coverageNotes) {
        assert.ok(text.includes(normalized(note)), `${country.name}: missing coverage caveat`);
      }
    }
  });
  check("single-country and ZIP reports have identical extracted content", () => {
    assert.equal(extracted[0].text, extracted.at(-1).text);
  });
} else {
  const reason = pythonProbe.error?.message || pythonProbe.stderr?.trim() || "Python pypdf is unavailable";
  console.log(`SKIP optional PDF text inspection: ${reason}`);
}

check("PDF and ZIP generation never mutate the dashboard dataset", () => {
  assert.equal(JSON.stringify(COUNTRIES), sourceBefore);
});
console.log(`\nAll ${checks} country report checks passed (${countries.length} real PDF files).`);
