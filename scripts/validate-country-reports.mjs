/**
 * Exercise the real PDF and ZIP exporters without a browser or source workbook.
 * Run: node scripts/validate-country-reports.mjs
 * If Python + pypdf are installed, also inspect every generated PDF's text/pages.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import JSZip from "jszip";
import { COUNTRIES, PILLARS, REFERENCE_YEAR, REGIONS, getCountryYear } from "../src/data/index.js";
import { buildCountryReport } from "../src/lib/country-report-data.js";
import {
  countryReportFilename,
  createAllCountryReports,
  createCountryReportPdf,
  createCountryReports,
  selectReportCountries,
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

check("country and region selections are deduplicated in published rank order", () => {
  const region = REGIONS[countries[0].name];
  const expected = countries.filter((country) => country.name === countries.at(-1).name || REGIONS[country.name] === region);
  assert.deepEqual(selectReportCountries({ countryNames: [countries.at(-1).name, countries[0].name, countries[0].name], regions: [region, region] }), expected);
  assert.deepEqual(selectReportCountries(), countries);
  assert.deepEqual(selectReportCountries({ regions: [region] }), countries.filter((country) => REGIONS[country.name] === region));
});

await checkAsync("empty, unknown or malformed selections and unsupported formats fail before generating reports", async () => {
  for (const selection of [{ countryNames: [] }, { regions: [] }, { countryNames: ["Singapore"] }, { regions: ["Unknown region"] }, { countryNames: "Malaysia" }, { regions: null }]) {
    let started = false;
    await assert.rejects(createCountryReports({ ...selection, onProgress: () => { started = true; } }));
    assert.equal(started, false);
  }
  await assert.rejects(createCountryReports({ format: "docx" }));
  await assert.rejects(createCountryReports({ generatedAt: "invalid date" }));
});

await checkAsync("a selected ZIP contains only the requested countries with no duplicates", async () => {
  const chosen = [countries.at(-1), countries[0], countries[2]];
  const result = await createCountryReports({ countryNames: [...chosen.map(({ name }) => name), chosen[0].name], generatedAt });
  const selectedZip = await JSZip.loadAsync(result.bytes, { checkCRC32: true });
  assert.equal(result.count, 3);
  assert.equal(result.mimeType, "application/zip");
  assert.match(result.filename, /Selected_3.*\.zip$/);
  assert.deepEqual(Object.keys(selectedZip.files), [...chosen].sort((a, b) => a.rank - b.rank).map(countryReportFilename));
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

const combinedProgress = [];
const combined = await createCountryReports({ format: "combined", generatedAt, onProgress: (event) => combinedProgress.push(event) });
const selectedCombined = await createCountryReports({ countryNames: [countries.at(-1).name, countries[0].name, countries[2].name], format: "combined", generatedAt });

check("combined PDFs use measured profile ranges and contents entries in rank order", () => {
  assert.equal(combined.count, countries.length);
  assert.equal(combined.mimeType, "application/pdf");
  assert.match(combined.filename, /All_57.*\.pdf$/);
  assert.equal(combined.contentsPages, 2);
  assert.equal(combined.contents[0].firstPage, combined.contentsPages + 1);
  assert.equal(combined.contents.at(-1).lastPage, combined.pageCount);
  assert.deepEqual(combined.contents.map(({ name }) => name), countries.map(({ name }) => name));
  for (let index = 0; index < combined.contents.length; index++) {
    const entry = combined.contents[index];
    assert.ok(entry.lastPage >= entry.firstPage);
    if (index) assert.equal(entry.firstPage, combined.contents[index - 1].lastPage + 1);
  }
  assert.equal(selectedCombined.count, 3);
  assert.equal(selectedCombined.contentsPages, 1);
  assert.deepEqual(selectedCombined.contents.map(({ name }) => name), [countries[0], countries[2], countries.at(-1)].map(({ name }) => name));
  assert.equal(combinedProgress.at(-1).percent, 100);
  assert.equal(combinedProgress.at(-1).completed, countries.length);
});

check("every contents row links to its actual PDF page object", () => {
  for (const result of [combined, selectedCombined]) {
    assert.equal(Buffer.from(result.bytes.slice(0, 5)).toString(), "%PDF-");
    const objects = [...Buffer.from(result.bytes).toString("latin1").matchAll(/\b(\d+) 0 obj\b([\s\S]*?)endobj/g)];
    const pages = objects.filter(([, , body]) => /\/Type \/Page\b/.test(body));
    assert.equal(pages.length, result.pageCount);
    const destinations = pages.slice(0, result.contentsPages).flatMap(([, , body]) => [...body.matchAll(/\/Dest\s*\[(\d+) 0 R\b/g)].map((match) => Number(match[1])));
    assert.equal(destinations.length, result.count);
    assert.deepEqual(destinations, result.contents.map(({ firstPage }) => Number(pages[firstPage - 1][1])));
  }
});

await checkAsync("combined exports honour cancellation before generation, mid-generation and during final assembly", async () => {
  for (const stage of ["before", "generating", "packaging"]) {
    const controller = new AbortController();
    let lastCompleted = 0;
    if (stage === "before") controller.abort();
    await assert.rejects(createCountryReports({ format: "combined", generatedAt, signal: controller.signal, onProgress(event) {
      lastCompleted = event.completed;
      if (stage === "generating" && event.completed >= 2) controller.abort();
      if (stage === "packaging" && event.phase === "packaging") controller.abort();
    } }), isAbortError);
    if (stage === "before") assert.equal(lastCompleted, 0);
    if (stage === "generating") assert.equal(lastCompleted, 2);
  }
});

const python = String.raw`
import base64, io, json, sys
from pypdf import PdfReader
reports = json.load(sys.stdin)
result = []
for item in reports:
    reader = PdfReader(io.BytesIO(base64.b64decode(item["pdf"])), strict=True)
    page_numbers = {page.indirect_reference.idnum: index for index, page in enumerate(reader.pages)}
    links = []
    for page in reader.pages:
        for annotation in page.get("/Annots", []):
            destination = annotation.get_object().get("/Dest")
            if destination:
                links.append(page_numbers[destination[0].idnum])
    result.append({"name": item["name"], "pages": len(reader.pages), "text": "\n".join(page.extract_text() or "" for page in reader.pages), "pageTexts": [page.extract_text() or "" for page in reader.pages], "links": links})
json.dump(result, sys.stdout)
`;
const pythonProbe = spawnSync("python", ["-c", "import pypdf"], { encoding: "utf8" });
if (pythonProbe.status === 0) {
  const input = [...pdfs, { name: "individual", country: countries[0], bytes: individual }, { name: "combined", bytes: combined.bytes }, { name: "selected-combined", bytes: selectedCombined.bytes }]
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
    assert.equal(extracted[0].text, extracted[pdfs.length].text);
  });
  check("combined PDFs parse strictly and every contents link opens the named country's first profile page", () => {
    for (const [offset, result] of [[-2, combined], [-1, selectedCombined]]) {
      const parsed = extracted.at(offset);
      assert.equal(parsed.pages, result.pageCount);
      assert.deepEqual(parsed.links, result.contents.map(({ firstPage }) => firstPage - 1));
      assert.ok(parsed.pageTexts.every((page) => page.trim().length > 30));
      for (const entry of result.contents) {
        assert.ok(normalized(parsed.pageTexts[entry.firstPage - 1]).includes(normalized(entry.name)));
        assert.ok(parsed.pageTexts[entry.firstPage - 1].includes(entry.score.toFixed(1)));
      }
    }
  });
} else {
  const reason = pythonProbe.error?.message || pythonProbe.stderr?.trim() || "Python pypdf is unavailable";
  console.log(`SKIP optional PDF text inspection: ${reason}`);
}

check("PDF and ZIP generation never mutate the dashboard dataset", () => {
  assert.equal(JSON.stringify(COUNTRIES), sourceBefore);
});
console.log(`\nAll ${checks} country report checks passed (${countries.length} real PDF files).`);
