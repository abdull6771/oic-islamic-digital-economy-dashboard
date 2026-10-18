/** Read local workbook revisions; publish only derived score/rank differences. */
import XLSX from "xlsx";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { revisionEntry, snapshotFromDataset } from "../src/lib/revision-history.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaults = ["check_updated yemen palestine_225 Jun_Master_Data collection.xlsx", "New findex_Master_Data collection.xlsx", "18 Oct_New findex_Master_Data collection.xlsx"];
const dates = { [defaults[2]]: "2026-10-18" };
const files = process.argv.length > 2 ? process.argv.slice(2) : defaults;
const finite = (cell) => cell?.t === "n" && Number.isFinite(cell.v) ? Number(cell.v.toFixed(6)) : null;

export function readHistorySnapshot(path) {
  const bytes = readFileSync(path);
  const ws = XLSX.read(bytes, { type: "buffer", sheets: ["OIC_2024 norm"] }).Sheets["OIC_2024 norm"];
  if (!ws) throw new Error(`No authoritative panel in ${basename(path)}.`);
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const columns = {};
  for (let c = 0; c <= range.e.c; c++) {
    const value = ws[XLSX.utils.encode_cell({ r: 3, c })]?.v;
    if (value !== undefined) columns[String(value).trim()] = XLSX.utils.encode_col(c);
  }
  if (!columns.ADEI) throw new Error(`Missing ADEI column in ${basename(path)}.`);
  const codes = Object.keys(columns).filter((code) => /^\d+(\.\d+)*$/.test(code));
  const observations = [], seen = new Set();
  for (let r = 8; r <= range.e.r + 1; r++) {
    let country = ws[`B${r}`]?.v;
    const year = ws[`C${r}`]?.v;
    if (typeof country !== "string" || !Number.isInteger(year)) continue;
    country = country.trim() === "Gambia, The" ? "Gambia" : country.trim();
    if (seen.has(`${country}|${year}`)) throw new Error(`Duplicate ${country} ${year}.`);
    seen.add(`${country}|${year}`);
    const adei = finite(ws[`${columns.ADEI}${r}`]);
    if (adei === null) throw new Error(`Unavailable ADEI for ${country} ${year}.`);
    observations.push({ country, year, adei, scores: Object.fromEntries(codes.map((code) => [code, finite(ws[`${columns[code]}${r}`])])) });
  }
  const years = [...new Set(observations.map((row) => row.year))].sort();
  for (const year of years) observations.filter((row) => row.year === year).sort((a, b) => b.adei - a.adei).forEach((row, index) => { row.rank = index + 1; });
  return { id: createHash("sha256").update(bytes).digest("hex"), source: basename(path), sourceUpdated: dates[basename(path)] || null, referenceYear: years.at(-1), years, scoreCodes: codes, countryCount: new Set(observations.map((row) => row.country)).size, observations };
}

const snapshots = files.map((file) => readHistorySnapshot(resolve(root, file)));
const latest = snapshotFromDataset(JSON.parse(readFileSync(resolve(root, "src/data/adei-dataset.json"), "utf8")));
const last = snapshots.at(-1);
if (last.id !== latest.id) throw new Error("The final workbook must match the current dashboard dataset.");
const comparable = (snapshot) => JSON.stringify([...snapshot.observations].sort((a, b) => a.country.localeCompare(b.country) || a.year - b.year).map((row) => ({ country: row.country, year: row.year, adei: row.adei, rank: row.rank, scores: Object.fromEntries(Object.entries(row.scores).sort(([a], [b]) => a.localeCompare(b))) })));
if (comparable(last) !== comparable(latest)) throw new Error("History snapshot differs from the current dataset.");
const history = { schemaVersion: 1, scope: "Available local workbook revisions only. Dates are shown only when independently established. Changes compare published panel scores rounded to six decimals; ranks are recalculated within each assessment year. Source-only formula or provenance changes are outside this score history.", revisions: snapshots.map((snapshot, index) => revisionEntry(snapshot, snapshots[index - 1])) };
writeFileSync(resolve(root, "src/data/revision-history.json"), JSON.stringify(history) + "\n");
console.log(JSON.stringify(history.revisions.map(({ source, summary }) => ({ source, ...summary })), null, 2));
