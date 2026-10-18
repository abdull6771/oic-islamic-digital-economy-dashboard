import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { COUNTRIES, REFERENCE_YEAR, REGIONS } from "../data/index.js";
import { buildCountryReport } from "./country-report-data.js";

// Reports use a fixed light palette so saved PDFs are independent of app theme.
const INK = "#16181a";
const MUTED = "#5c6470";
const BRAND = "#1b6b52";
const LINE = "#d4d1cb";
const SURFACE = "#f4f4f2";
const POSITIVE = "#18825b";
const NEGATIVE = "#c43627";
const CONTENTS_ROWS_PER_PAGE = 29;
const PILLAR_COLORS = ["#3579b6", "#35a0b6", "#22756a", "#2c955f", "#6ba02d", "#866a26", "#763f21", "#a13055", "#722c96"];
const number = (value) => Number.isFinite(value) ? value.toFixed(1) : "n.a.";
const signed = (value) => `${value > 0 ? "+" : ""}${number(value)}`;
const printable = (value) => String(value)
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201c\u201d]/g, '"');
const dateLabel = (value) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(value));

export function countryReportFilename(country) {
  const slug = country.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return `${slug}_OIC_DEI_Profile_${REFERENCE_YEAR}.pdf`;
}

function newReportDocument(title, generatedAt) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true, putOnlyUsedFonts: true });
  doc.setProperties({ title, subject: "Country profiles and pillar performance", author: "INCEIF University", creator: "OIC Digital Economy Index Dashboard" });
  doc.setCreationDate(new Date(generatedAt));
  return doc;
}

/** Render into the current page; the returned range is measured, never assumed. */
function appendCountryReport(doc, country, options = {}) {
  const report = buildCountryReport(country, options);
  const firstPage = doc.getNumberOfPages();
  const margin = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = pageWidth - margin * 2;
  let y = 60;

  function font(size = 10, bold = false, color = INK) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color);
  }
  function runningHeader() {
    font(8, true, BRAND);
    doc.text("INCEIF UNIVERSITY", margin, 29);
    font(8, false, MUTED);
    doc.text(`OIC Digital Economy Index ${report.assessmentYear}`, pageWidth - margin, 29, { align: "right" });
    doc.setDrawColor(LINE);
    doc.line(margin, 40, pageWidth - margin, 40);
  }
  function nextPage() {
    doc.addPage();
    runningHeader();
    y = 60;
  }
  function room(height) {
    if (y + height > pageHeight - 58) nextPage();
  }
  function paragraph(value, { size = 10, bold = false, color = INK, after = 9 } = {}) {
    font(size, bold, color);
    const lines = doc.splitTextToSize(printable(value), width - 8);
    const leading = size * 1.45;
    room(lines.length * leading + after);
    font(size, bold, color);
    doc.text(lines, margin, y + size, { lineHeightFactor: 1.45 });
    y += lines.length * leading + after;
  }
  function heading(value) {
    room(58);
    y += 12;
    font(13, true);
    doc.text(value, margin, y + 13);
    y += 22;
    doc.setDrawColor(LINE);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;
  }
  function highlight(label, pillar) {
    paragraph(label.toUpperCase(), { size: 8, bold: true, color: MUTED, after: 3 });
    paragraph(`${pillar.name}: ${number(pillar.score)} (${signed(pillar.delta)} points vs OIC average).`, { after: 12 });
  }

  runningHeader();
  paragraph(country.name, { size: 27, bold: true, after: 3 });
  paragraph(`Country profile  |  ${report.region}  |  ${report.assessmentYear} assessment`, { size: 10, color: MUTED, after: 17 });

  const stats = [
    ["DEI SCORE / 100", number(country.adei)],
    ["OIC RANK", `#${country.rank} / ${report.countryCount}`],
    ["REGIONAL RANK", `#${report.regionRank} / ${report.regionCount}`],
    ["VS OIC AVERAGE", signed(report.deltaFromOic)],
  ];
  const gap = 9;
  const tileWidth = (width - gap * 3) / 4;
  stats.forEach(([label, value], index) => {
    const x = margin + index * (tileWidth + gap);
    doc.setFillColor(SURFACE);
    doc.roundedRect(x, y, tileWidth, 65, 5, 5, "F");
    font(7.5, true, MUTED);
    doc.text(label, x + 10, y + 17);
    font(20, true, index === 3 ? (report.deltaFromOic >= 0 ? POSITIVE : NEGATIVE) : INK);
    doc.text(value, x + 10, y + 46);
  });
  y += 76;
  heading("Digital Economy Classification");
  paragraph(report.cluster, { size: 11, bold: true, color: BRAND, after: 4 });
  paragraph(report.headlineRecommendation, { size: 9.5, color: MUTED, after: 4 });

  heading("Pillar Score Performance");
  const nameWidth = 204;
  const scoreRight = margin + 250;
  const averageRight = margin + 302;
  const deltaRight = margin + 357;
  const barX = margin + 372;
  const barWidth = width - 372;
  function tableHeader() {
    doc.setFillColor(SURFACE);
    doc.rect(margin, y, width, 23, "F");
    font(8, true, MUTED);
    doc.text("PILLAR (WEIGHT)", margin + 7, y + 15);
    doc.text("SCORE", scoreRight, y + 15, { align: "right" });
    doc.text("OIC AVG", averageRight, y + 15, { align: "right" });
    doc.text("VS AVG", deltaRight, y + 15, { align: "right" });
    doc.text("0-100", barX + barWidth, y + 15, { align: "right" });
    y += 23;
  }
  tableHeader();
  for (const pillar of report.pillars) {
    font(9);
    const lines = doc.splitTextToSize(`${pillar.name} (${pillar.weight}%)`, nameWidth - 12);
    const rowHeight = Math.max(30, lines.length * 12 + 12);
    if (y + rowHeight > pageHeight - 58) {
      nextPage();
      tableHeader();
    }
    font(9);
    doc.text(lines, margin + 7, y + 16, { lineHeightFactor: 1.33 });
    doc.text(number(pillar.score), scoreRight, y + 16, { align: "right" });
    font(9, false, MUTED);
    doc.text(number(pillar.average), averageRight, y + 16, { align: "right" });
    font(9, true, pillar.delta >= 0 ? POSITIVE : NEGATIVE);
    doc.text(signed(pillar.delta), deltaRight, y + 16, { align: "right" });
    doc.setFillColor(SURFACE);
    doc.roundedRect(barX, y + 11, barWidth, 6, 3, 3, "F");
    const filled = Math.min(100, Math.max(0, pillar.score)) / 100 * barWidth;
    if (filled > 0) {
      doc.setFillColor(PILLAR_COLORS[Number(pillar.id) - 1] || BRAND);
      doc.rect(barX, y + 11, filled, 6, "F");
    }
    y += rowHeight;
    doc.setDrawColor(LINE);
    doc.line(margin, y, pageWidth - margin, y);
  }
  y += 8;
  paragraph(`OIC composite average: ${number(report.oicAverage)}. Pillar averages are unweighted means across the ${report.countryCount} covered countries.`, { size: 8, color: MUTED, after: 0 });
  room(85);
  heading("Report Details");
  paragraph(`Generated: ${dateLabel(report.generatedAt)} (UTC). Assessment: ${report.assessmentYear}.${report.sourceUpdated ? ` Data updated: ${dateLabel(report.sourceUpdated)}.` : ""}`, { size: 8, color: MUTED, after: 3 });
  paragraph(`Source: OIC DEI ${report.assessmentYear}, INCEIF University. Scores are shown on a 0-100 scale.`, { size: 8, color: MUTED, after: 0 });

  nextPage();
  paragraph(country.name, { size: 20, bold: true, after: 0 });
  heading("Performance Highlights");
  highlight("Strongest relative pillar", report.strongest);
  highlight("Smallest relative advantage or largest gap", report.weakest);

  heading("Regional and Global Context");
  const regionText = report.regionCount === 1
    ? `${country.name} is the only covered country in ${report.region}; regional peer comparison is limited.`
    : `Ranked #${report.regionRank} of ${report.regionCount} in ${report.region}. ${report.gapToRegionalLeader === 0 ? "The country is the regional leader." : `Gap to regional leader ${report.regionalLeader.name}: ${number(report.gapToRegionalLeader)} points.`}`;
  paragraph(regionText, { size: 9.5, after: 6 });
  paragraph(`${report.globalLeader.name} leads the OIC index at ${number(report.globalLeader.adei)}. ${report.gapToGlobalLeader === 0 ? "This country holds that leading position." : `Gap to the OIC leader: ${number(report.gapToGlobalLeader)} points.`}`, { size: 9.5, after: 9 });
  paragraph("TOP REGIONAL PERFORMERS", { size: 8, bold: true, color: MUTED, after: 4 });
  for (const peer of report.topRegional) {
    paragraph(`#${peer.regionRank}  ${peer.name}  -  ${number(peer.adei)} (OIC rank #${peer.rank})`, { size: 9.5, after: 3 });
  }

  heading("Strategic Recommendations");
  report.recommendations.forEach((recommendation, index) => {
    room(75);
    paragraph(`${index + 1}. ${recommendation.title}`, { size: 10, bold: true, after: 3 });
    paragraph(recommendation.text, { size: 9.5, after: 10 });
  });
  if (report.coverageNotes.length) {
    heading("Data Coverage and Source Notes");
    for (const note of report.coverageNotes) paragraph(note, { size: 9, color: MUTED, after: 10 });
  }
  const lastPage = doc.getNumberOfPages();
  return { firstPage, lastPage };
}

function pageFooters(doc, labels) {
  const pageCount = doc.getNumberOfPages();
  const margin = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(LINE);
    doc.line(margin, pageHeight - 39, pageWidth - margin, pageHeight - 39);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(printable(labels[page - 1]), margin, pageHeight - 24);
    doc.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }
}

/** Create a searchable, paginated PDF without screenshot canvases or a CDN. */
export function createCountryReportPdf(country, options = {}) {
  const report = buildCountryReport(country, options);
  const doc = newReportDocument(`${country.name} - OIC Digital Economy Index ${report.assessmentYear}`, report.generatedAt);
  appendCountryReport(doc, country, options);
  pageFooters(doc, Array(doc.getNumberOfPages()).fill(country.name));
  return new Uint8Array(doc.output("arraybuffer"));
}

function checkCancelled(signal) {
  if (!signal?.aborted) return;
  const error = new Error("Report export cancelled.");
  error.name = "AbortError";
  throw error;
}
const yieldToInterface = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Select names and/or entire regions, deduplicate, and keep published rank order. */
export function selectReportCountries({ countryNames, regions } = {}) {
  if (countryNames === undefined && regions === undefined) return [...COUNTRIES].sort((a, b) => a.rank - b.rank);
  if (countryNames !== undefined && !Array.isArray(countryNames)) throw new Error("Select countries using a list of country names.");
  if (regions !== undefined && !Array.isArray(regions)) throw new Error("Select regions using a list of region names.");
  const knownNames = new Set(COUNTRIES.map(({ name }) => name));
  const knownRegions = new Set(COUNTRIES.map(({ name }) => REGIONS[name] || "Other"));
  for (const name of countryNames || []) if (!knownNames.has(name)) throw new Error(`Unknown report country: ${String(name)}.`);
  for (const region of regions || []) if (!knownRegions.has(region)) throw new Error(`Unknown report region: ${String(region)}.`);
  const names = new Set(countryNames || []);
  const regionSet = new Set(regions || []);
  const countries = COUNTRIES.filter((country) => names.has(country.name) || regionSet.has(REGIONS[country.name] || "Other"))
    .sort((a, b) => a.rank - b.rank);
  if (!countries.length) throw new Error("Select at least one country or region before downloading reports.");
  return countries;
}

function renderContents(doc, entries, { generatedAt, contentsPages }) {
  const margin = 42;
  const pageWidth = doc.internal.pageSize.getWidth();
  const width = pageWidth - margin * 2;
  const rowsPerPage = CONTENTS_ROWS_PER_PAGE;
  for (let page = 1; page <= contentsPages; page++) {
    doc.setPage(page);
    doc.setTextColor(BRAND);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("INCEIF UNIVERSITY", margin, 29);
    doc.setTextColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(`OIC Digital Economy Index ${REFERENCE_YEAR}`, pageWidth - margin, 29, { align: "right" });
    doc.setDrawColor(LINE);
    doc.line(margin, 40, pageWidth - margin, 40);
    doc.setTextColor(INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text(page === 1 ? "Country Reports" : "Contents (continued)", margin, 82);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED);
    doc.text(`${entries.length} selected ${entries.length === 1 ? "country" : "countries"} | ${REFERENCE_YEAR} assessment | ${dateLabel(generatedAt)}`, margin, 105);
    doc.setFontSize(9);
    doc.text("Select a country below to open its report. Reports follow OIC rank order.", margin, 124);
    let y = 145;
    doc.setFillColor(SURFACE);
    doc.rect(margin, y, width, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("OIC RANK", margin + 8, y + 16);
    doc.text("COUNTRY", margin + 72, y + 16);
    doc.text("SCORE", pageWidth - margin - 66, y + 16, { align: "right" });
    doc.text("PAGE", pageWidth - margin - 8, y + 16, { align: "right" });
    y += 25;
    for (const entry of entries.slice((page - 1) * rowsPerPage, page * rowsPerPage)) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(MUTED);
      doc.text(`#${entry.rank}`, margin + 8, y + 16);
      doc.setTextColor(BRAND);
      doc.text(printable(entry.name), margin + 72, y + 16);
      doc.setTextColor(INK);
      doc.text(number(entry.score), pageWidth - margin - 66, y + 16, { align: "right" });
      doc.text(String(entry.firstPage), pageWidth - margin - 8, y + 16, { align: "right" });
      doc.link(margin, y, width, 21, { pageNumber: entry.firstPage, top: 0 });
      doc.setDrawColor(LINE);
      doc.line(margin, y + 21, pageWidth - margin, y + 21);
      y += 21;
    }
  }
}

async function combinedReports(countries, { signal, onProgress, generatedAt }) {
  const contentsPages = Math.ceil(countries.length / CONTENTS_ROWS_PER_PAGE);
  const doc = newReportDocument(`Selected Country Reports - OIC Digital Economy Index ${REFERENCE_YEAR}`, generatedAt);
  for (let page = 1; page < contentsPages; page++) doc.addPage();
  const contents = [];
  const labels = Array(contentsPages).fill("Country reports - Contents");
  for (const [index, country] of countries.entries()) {
    checkCancelled(signal);
    onProgress({ phase: "generating", completed: index, total: countries.length, country: country.name });
    await yieldToInterface();
    checkCancelled(signal);
    doc.addPage();
    const range = appendCountryReport(doc, country, { generatedAt });
    contents.push({ name: country.name, rank: country.rank, score: country.adei, ...range });
    labels.push(...Array(range.lastPage - range.firstPage + 1).fill(country.name));
    onProgress({ phase: "generating", completed: index + 1, total: countries.length, country: country.name });
  }
  await yieldToInterface();
  checkCancelled(signal);
  onProgress({ phase: "packaging", completed: countries.length, total: countries.length, percent: 0 });
  checkCancelled(signal);
  renderContents(doc, contents, { generatedAt, contentsPages });
  pageFooters(doc, labels);
  await yieldToInterface();
  checkCancelled(signal);
  const bytes = new Uint8Array(doc.output("arraybuffer"));
  onProgress({ phase: "packaging", completed: countries.length, total: countries.length, percent: 100 });
  checkCancelled(signal);
  return { bytes, contents, contentsPages, pageCount: doc.getNumberOfPages() };
}

/** A chosen set can be downloaded as separate PDFs in a ZIP or one indexed PDF. */
export async function createCountryReports({ countryNames, regions, format = "zip", signal, onProgress = () => {}, generatedAt = new Date() } = {}) {
  checkCancelled(signal);
  if (format !== "zip" && format !== "combined") throw new Error("Choose ZIP or combined PDF as the report format.");
  const countries = selectReportCountries({ countryNames, regions });
  const total = countries.length;
  const date = new Date(generatedAt);
  if (!Number.isFinite(date.getTime())) throw new Error("Report export requires a valid generation date.");
  const scope = total === COUNTRIES.length ? `All_${total}` : `Selected_${total}`;
  if (format === "combined") {
    const result = await combinedReports(countries, { signal, onProgress, generatedAt: date });
    return { ...result, filename: `OIC_DEI_${REFERENCE_YEAR}_${scope}_Country_Reports.pdf`, count: total, mimeType: "application/pdf" };
  }
  const zip = new JSZip();
  const filenames = new Set();
  for (const [index, country] of countries.entries()) {
    checkCancelled(signal);
    onProgress({ phase: "generating", completed: index, total, country: country.name });
    await yieldToInterface();
    checkCancelled(signal);
    const filename = countryReportFilename(country);
    if (filenames.has(filename)) throw new Error(`Duplicate report filename for ${country.name}.`);
    filenames.add(filename);
    try {
      zip.file(filename, createCountryReportPdf(country, { generatedAt: date }), { date });
    } catch (cause) {
      throw new Error(`Could not create the report for ${country.name}. Please try again.`, { cause });
    }
    onProgress({ phase: "generating", completed: index + 1, total, country: country.name });
  }
  await yieldToInterface();
  checkCancelled(signal);
  onProgress({ phase: "packaging", completed: total, total, percent: 0 });
  checkCancelled(signal);
  const bytes = await zip.generateAsync({
    type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 },
  }, ({ percent }) => {
    checkCancelled(signal);
    onProgress({ phase: "packaging", completed: total, total, percent });
  });
  checkCancelled(signal);
  return { bytes, filename: `OIC_DEI_${REFERENCE_YEAR}_${scope}_Country_Reports.zip`, count: total, mimeType: "application/zip" };
}

/** Backwards-compatible one-click export for the country profile page. */
export async function createAllCountryReports(options = {}) {
  return createCountryReports({ ...options, countryNames: undefined, regions: undefined, format: "zip" });
}
