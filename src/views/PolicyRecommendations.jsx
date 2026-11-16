import { useState } from "react";

import { COUNTRIES, FINDEX, META, PILLARS, REFERENCE_YEAR, getCluster } from "../data/index.js";
import * as fmt from "../lib/format.js";
import CountryCombobox from "../components/CountryCombobox.jsx";
import PageActions from "../components/PageActions.jsx";
import { Badge, Card, ClusterBadge, ScoreBar, StatTile } from "../components/Primitives.jsx";

/**
 * Priority is carried by an explicit label and a leading glyph as well as by
 * colour, so it survives greyscale, projection and colour-vision deficiency.
 */
const PRIORITY = {
  IMMEDIATE: { tone: "negative", glyph: "▲▲▲" },
  HIGH: { tone: "warning", glyph: "▲▲" },
  MEDIUM: { tone: "info", glyph: "▲" },
  STRATEGIC: { tone: "positive", glyph: "★" },
};

function PolicyRecommendations() {
  const [selected, setSelected] = useState("United Arab Emirates");
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);
  const imputedFindexCodes = FINDEX.codes.filter((code) =>
    FINDEX.imputed[code]?.includes(country.name),
  );
  const findexSourceDifferences = (FINDEX.sourceDifferences || []).filter(
    (difference) => difference.country === country.name,
  );
  const findexValidationCodes = [...new Set([
    ...imputedFindexCodes,
    ...findexSourceDifferences.map((difference) => difference.code),
  ])];

  const generateRecommendations = (c) => {
    const recs = [];
    const p = PILLARS.reduce((acc, pillar) => {
      acc[pillar.key] = c[pillar.key];
      return acc;
    }, {});

    if (p.p5 < 40)
      recs.push({
        pillar: "Innovation",
        priority: "IMMEDIATE",
        action:
          "Innovation is the primary bottleneck in OIC's digital transformation. R&D activity remains predominantly state-funded with limited private-sector participation. Incentivize private-sector R&D participation, strengthen venture financing ecosystems, and establish structured commercialization pathways linking university research centers with industry and investment capital.",
      });
    if (p.p3 < 40)
      recs.push({
        pillar: "Workforce",
        priority: "HIGH",
        action:
          "Many OIC economies remain structurally concentrated in primary sectors rather than knowledge-intensive industries. Launch national digital skills programs targeting youth and women. Expand knowledge-intensive employment through STEM education, professional certifications, and workforce upskilling initiatives.",
      });
    if (p.p2 < 50)
      recs.push({
        pillar: "Infrastructure",
        priority: "HIGH",
        action:
          "Expand reliable broadband infrastructure, reduce access costs, and treat digital connectivity as a critical public utility. Pursue public-private partnerships for infrastructure financing and leverage Islamic Social Finance (Zakat/Waqf) for digital inclusion programs in underserved areas.",
      });
    if (p.p1 < 50)
      recs.push({
        pillar: "Institutions",
        priority: "HIGH",
        action:
          "Strengthen digital governance frameworks and regulatory quality. Establish an independent digital regulator and implement GDPR-aligned data protection laws.",
      });
    if (p.p4 < 60)
      recs.push({
        pillar: "E-Government",
        priority: "MEDIUM",
        action:
          "Expand national e-ID and digital public service portals. Adopt open data standards and interoperable government systems. Benchmark against UAE PASS and Saudi Arabia's Absher.",
      });
    if (p.p8 < 30)
      recs.push({
        pillar: "Financial Market Development",
        priority: "MEDIUM",
        action: findexValidationCodes.length > 0
          ? `Validate the financial-inclusion source inputs (${findexValidationCodes.join(", ")}) before interpreting the low pillar score as evidence of low inclusion.${imputedFindexCodes.length ? " Obtain observations for inputs using the workbook's imputed floor." : ""}${findexSourceDifferences.length ? " Resolve the differences between collected and filled raw inputs." : ""} The published scores are preserved. Use verified observations to assess whether banking access, digital payments, or other financial-market policies need attention.`
          : "Develop Islamic FinTech regulatory sandbox to attract digital finance innovation. In many OIC economies, a substantial population remains outside the formal banking system. Promote mobile banking, digital wallets, and Shariah-compliant FinTech solutions to drive financial inclusion, especially in rural areas.",
      });
    if (p.p6 < 40)
      recs.push({
        pillar: "Future Technologies",
        priority: "MEDIUM",
        action:
          "Many Emerging and Foundational Digital Economies have yet to formalize national AI strategies or mobilize sustained capital toward frontier technologies. Create a national AI strategy with clear governance frameworks and investment incentives for advanced digital sectors to capture value from the next wave of technological transformation.",
      });
    if (p.p7 < 40)
      recs.push({
        pillar: "Market Development & Sophistication",
        priority: "MEDIUM",
        action:
          "Limited access to growth-stage financing constrains start-up scaling, while insufficient industrial diversification narrows the domestic demand base. Reduce digital trade barriers, streamline e-commerce regulations, expand start-up financing accessibility, and support SME digital adoption.",
      });

    if (!recs.length)
      recs.push({
        pillar: "Leadership",
        priority: "STRATEGIC",
        action:
          "Maintain leadership position by expanding digital exports, establishing regional tech hubs, and leading OIC digital standards. Invest in cutting-edge research in AI, quantum computing, and blockchain.",
      });

    return recs;
  };

  const recs = generateRecommendations(country);

  const pillarFor = (name) =>
    PILLARS.find((p) => p.name === name || p.short === name);

  const OIC_WIDE = [
    {
      title: "1. Aligning Policy with Digital Maturity",
      desc: "National digital strategies should reflect a country's current digital maturity. Foundational economies: prioritize affordable broadband and digital literacy. Emerging economies: accelerate SME digitalization and workforce upskilling. Advanced economies: scale private-sector R&D and advance frontier technologies.",
    },
    {
      title: "2. Transforming the Digital Divide into Intra-OIC Synergy",
      desc: "Establish structured intra-OIC corridors for knowledge transfer, venture capital mobilization, and digital trade facilitation. Create common standards for e-commerce governance, digital identity recognition, cybersecurity protocols, and Shariah-compliant FinTech solutions.",
    },
    {
      title: "3. Shared OIC Digital Talent & Innovation Mobility Framework",
      desc: "Develop a bloc-level mechanism to facilitate digital talent movement, harmonize skills certification standards, and co-finance regional centers of excellence in AI, data science, and Islamic FinTech. Structured university-industry collaboration can reduce brain drain and position the OIC as a coordinated digital knowledge hub.",
    },
    {
      title: "4. Leveraging Islamic Finance for Inclusive Growth",
      desc: "Deploy Zakat and Waqf-backed microfinance for digital inclusion in Foundational economies. Use Shariah-compliant venture capital and equity crowdfunding for Emerging economy start-ups. Advanced economies should pioneer regulatory standards for digital Sukuk and Shariah-compliant FinTech frameworks.",
    },
  ];

  return (
    <div className="stack">
      <PageActions>
        <CountryCombobox value={selected} onChange={setSelected} hideLabel id="policy-country" />
        <ClusterBadge cluster={cluster.label} short />
      </PageActions>

      <div className="cols-3">
        <StatTile label="OIC DEI score" value={fmt.score(country.adei)} support={cluster.label} />
        <StatTile
          label="Global rank"
          value={fmt.rank(country.rank)}
          support={`of ${META.countryCount} OIC states`}
        />
        <StatTile
          label="Recommendations"
          value={recs.length}
          support="Derived from pillar-level gaps"
        />
      </div>

      {(imputedFindexCodes.length > 0 || findexSourceDifferences.length > 0) && (
        <Card title="Financial inclusion data coverage">
          {imputedFindexCodes.length > 0 && (
            <p className="t-caption prose muted">
              In {FINDEX.year}, {country.name} uses the workbook's imputed floor for{" "}
              {imputedFindexCodes.map((code) => `${code} (${FINDEX.labels[code]})`).join("; ")}.
              These values are not survey observations. Pillar 8 and the overall score
              incorporate these floor values; validate source coverage before drawing
              conclusions about financial inclusion.
            </p>
          )}
          {findexSourceDifferences.map((difference) => (
            <p key={difference.code} className="t-caption prose muted">
              <strong>Source difference:</strong> {difference.code} ({FINDEX.labels[difference.code]})
              {" "}has a collected input of {fmt.percent(difference.collectedPercent)} and
              a filled input of {fmt.percent(difference.filledPercent)}. This is a
              difference between raw source inputs, not a missing observation.
              Validate the difference before drawing financial inclusion conclusions;
              the published pillar and overall scores are preserved.
            </p>
          ))}
        </Card>
      )}

      <Card
        title={`Strategic context for ${country.name}`}
        subtitle={`${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        footer={fmt.SOURCE_LINE}
      >
        <p className="t-body-lg prose">
          {country.name} is classified as a <strong>{cluster.label}</strong> with an OIC DEI
          score of <strong>{fmt.score(country.adei)}</strong> (Rank {fmt.rank(country.rank)} of{" "}
          {META.countryCount} OIC states). The following evidence-based recommendations are
          derived from pillar-level gap analysis relative to OIC leading nations and global
          best practices.
        </p>
      </Card>

      <div className="stack-sm">
        {recs.map((rec) => {
          const pillar = pillarFor(rec.pillar);
          const meta = PRIORITY[rec.priority];
          return (
            <Card key={rec.pillar}>
              <div className="row" style={{ gap: "var(--s-8)", marginBottom: "var(--s-8)" }}>
                <Badge tone={meta.tone}>
                  <span aria-hidden="true">{meta.glyph}</span> {rec.priority}
                </Badge>
                <span className="t-h3">{rec.pillar}</span>
                {pillar && (
                  <span className="t-caption muted tnum push">
                    Current score {fmt.score(country[pillar.key])} · weight{" "}
                    {fmt.weight(pillar.weight)}
                  </span>
                )}
              </div>
              {pillar && (
                <div style={{ marginBottom: "var(--s-12)", maxWidth: "420px" }}>
                  <ScoreBar value={country[pillar.key]} color={pillar.color} label={pillar.name} />
                </div>
              )}
              <p className="t-body-lg prose">{rec.action}</p>
            </Card>
          );
        })}
      </div>

      <Card
        title="OIC-wide strategic recommendations"
        subtitle="Bloc-level actions, independent of any one member state"
        footer={fmt.SOURCE_LINE}
      >
        <ol className="stack-sm" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {OIC_WIDE.map((r) => (
            <li
              key={r.title}
              style={{
                paddingBottom: "var(--s-12)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 className="t-h3" style={{ marginBottom: "var(--s-4)" }}>
                {r.title}
              </h3>
              <p className="t-body prose muted">{r.desc}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

export default PolicyRecommendations;
