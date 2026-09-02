import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { COUNTRIES, PILLARS, REFERENCE_YEAR } from "../data/index.js";
import { useChartTokens } from "../styles/tokens.js";
import { openCountry } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import CustomTooltip from "../components/CustomTooltip.jsx";
import CountryCombobox from "../components/CountryCombobox.jsx";
import PageActions from "../components/PageActions.jsx";
import ChartFrame, { LegendKey, animation, SCORE_DOMAIN } from "../components/ChartFrame.jsx";
import {
  Button,
  Card,
  Delta,
  EmptyState,
  InsightBlock,
  ScoreBar,
  StatTile,
} from "../components/Primitives.jsx";

const CASE_STUDIES = {
  p1: {
    country: "Malaysia",
    lesson:
      "Established the Malaysia Digital Economy Blueprint (MyDIGITAL) with clear KPIs, transparent regulatory sandbox, and multi-ministry digital coordination.",
  },
  p2: {
    country: "UAE",
    lesson:
      "UAE Digital Infrastructure Strategy 2031 mandated 5G coverage for all populated areas, subsidized fiber to underserved zones through universal service obligations.",
  },
  p3: {
    country: "Jordan",
    lesson:
      "Jordan Digital Skills Initiative partnered with Google, Microsoft & Coursera to certify 100,000+ youth. Dedicated tech parks attracted diaspora talent.",
  },
  p4: {
    country: "Saudi Arabia",
    lesson:
      "Absher platform digitized 70+ government services. National digital ID became foundational for e-service delivery. E-procurement mandatory for government contracts.",
  },
  p5: {
    country: "UAE",
    lesson:
      "UAE National Innovation Strategy and dedicated R&D funding lifted the country to the OIC's highest Innovation score, well ahead of the next peer. Public-private research partnerships and targeted incentives remain the core transferrable lesson.",
  },
  p6: {
    country: "UAE",
    lesson:
      "UAE National AI Strategy 2031 — designated AI minister, mandatory AI procurement for federal agencies, partnerships with MIT/Oxford for AI research hubs.",
  },
  p7: {
    country: "Indonesia",
    lesson:
      "Making Indonesia 4.0 roadmap streamlined e-commerce regulations, created unicorn accelerator program, and lowered barriers for digital MSMEs through OSS licensing.",
  },
  p8: {
    country: "Malaysia",
    lesson:
      "Malaysia Islamic Fintech regulatory sandbox attracted 60+ licensed digital Islamic banks. Shariah-compliant robo-advisory and halal payment systems grew 340% since 2019.",
  },
  p9: {
    country: "Senegal",
    lesson:
      "Digital Senegal 2025 leveraged mobile money (Wave) for government social transfers, achieving 8M+ unbanked citizens' financial inclusion and connecting 2,000+ schools via 4G.",
  },
};

function PeerLearning() {
  const tokens = useChartTokens();
  const [selected, setSelected] = useState("Egypt");
  const [pillarFocus, setPillarFocus] = useState("p4");
  const [viewMode, setViewMode] = useState("peers");

  const country = COUNTRIES.find((c) => c.name === selected);
  const focusPillar = PILLARS.find((p) => p.key === pillarFocus);

  const peers = COUNTRIES.filter(
    (c) =>
      c.name !== selected &&
      Math.abs(c.adei - country.adei) <= 15 &&
      c[pillarFocus] > country[pillarFocus],
  )
    .sort((a, b) => b[pillarFocus] - a[pillarFocus])
    .slice(0, 6);

  const radarData = PILLARS.map((p) => {
    const row = {
      subject: p.short,
      [country.name]: parseFloat(country[p.key].toFixed(1)),
    };
    peers.slice(0, 3).forEach((peer) => {
      row[peer.name] = parseFloat(peer[p.key].toFixed(1));
    });
    return row;
  });

  // Peers are a small categorical set; take spread-out hues from the
  // CVD-checked pillar palette.
  const peerColor = (i) => tokens.pillar[[0, 3, 5, 7, 8, 1][i % 6]];

  const bestInPillar = Math.max(...COUNTRIES.map((c) => c[pillarFocus]));
  const performanceGap = country[pillarFocus] - bestInPillar;
  const topPeer = peers[0];
  const gap = topPeer ? (topPeer[pillarFocus] - country[pillarFocus]).toFixed(1) : null;

  return (
    <div className="stack">
      <PageActions>
        <CountryCombobox value={selected} onChange={setSelected} hideLabel id="peer-country" />
        <label className="field">
          <span className="visually-hidden">Focus pillar</span>
          <select
            className="select"
            value={pillarFocus}
            onChange={(e) => setPillarFocus(e.target.value)}
          >
            {PILLARS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </PageActions>

      <Card
        title={`${country.name} — digital profile`}
        subtitle={`Focus pillar: ${focusPillar.name} · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
        footer={fmt.SOURCE_LINE}
      >
        <div className="cols-4">
          <StatTile label="OIC DEI rank" value={fmt.rank(country.rank)} support={`of ${COUNTRIES.length}`} />
          <StatTile label="OIC DEI score" value={fmt.score(country.adei)} support="Composite index" />
          <StatTile
            label={`${focusPillar.name} score`}
            value={fmt.score(country[pillarFocus])}
            support={`Weight ${fmt.weight(focusPillar.weight)}`}
          />
          <StatTile
            label="Performance gap"
            value={`${fmt.delta(performanceGap)} pts`}
            delta={performanceGap}
            support={`Against the OIC best of ${fmt.score(bestInPillar)}`}
          />
        </div>
      </Card>

      <div className="row" role="tablist" aria-label="Peer learning view" style={{ gap: "var(--s-8)" }}>
        {[
          { id: "peers", label: "Peer benchmarking" },
          { id: "cases", label: "Success stories" },
        ].map((tab) => (
          <Button
            key={tab.id}
            role="tab"
            aria-selected={viewMode === tab.id}
            aria-pressed={viewMode === tab.id}
            onClick={() => setViewMode(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {viewMode === "peers" && peers.length > 0 ? (
        <>
          <Card
            title={`Best peer comparables — similar OIC DEI, stronger in ${focusPillar.name}`}
            subtitle={`Within 15 points of ${country.name}'s composite score · ${fmt.SCORE_UNIT}`}
            footer={fmt.SOURCE_LINE}
          >
            <div className="cols-3">
              {peers.map((peer, i) => (
                <button
                  type="button"
                  key={peer.name}
                  className="panel"
                  onClick={() => openCountry(peer.name)}
                  style={{ textAlign: "left", cursor: "pointer" }}
                  aria-label={`${peer.name}, ${(peer[pillarFocus] - country[pillarFocus]).toFixed(1)} points ahead in ${focusPillar.name}. Open profile.`}
                >
                  <div className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="t-h3">{peer.name}</div>
                      <div className="t-caption muted">{fmt.rank(peer.rank)}</div>
                    </div>
                    <Delta value={peer[pillarFocus] - country[pillarFocus]} unit=" pts" />
                  </div>
                  <div className="cols-2" style={{ gap: "var(--s-8)", margin: "var(--s-12) 0" }}>
                    <div>
                      <div className="t-overline muted">OIC DEI</div>
                      <div className="t-metric-sm">{fmt.score(peer.adei)}</div>
                    </div>
                    <div>
                      <div className="t-overline muted">{focusPillar.short}</div>
                      <div className="t-metric-sm">{fmt.score(peer[pillarFocus])}</div>
                    </div>
                  </div>
                  <ScoreBar
                    value={peer[pillarFocus]}
                    color={peerColor(i)}
                    label={`${peer.name} ${focusPillar.name}`}
                    showValue={false}
                  />
                </button>
              ))}
            </div>
          </Card>

          <ChartFrame
            title="Comparative profile — radar analysis"
            subtitle={`${country.name} against its three closest comparables · ${fmt.SCORE_UNIT} · ${REFERENCE_YEAR}`}
            summary={`Radar comparing ${country.name}'s nine pillar scores with ${peers.slice(0, 3).map((p) => p.name).join(", ")}.`}
            legend={
              <>
                <LegendKey color={tokens["brand-700"]}>{country.name}</LegendKey>
                {peers.slice(0, 3).map((peer, i) => (
                  <LegendKey key={peer.name} color={peerColor(i + 1)}>
                    {peer.name}
                  </LegendKey>
                ))}
              </>
            }
            note="A radar exaggerates shape; read the peer cards above for exact magnitudes."
          >
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke={tokens.border} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: tokens["text-muted"], fontSize: 11 }} />
                <PolarRadiusAxis
                  domain={SCORE_DOMAIN}
                  tick={{ fill: tokens["text-subtle"], fontSize: 11 }}
                  axisLine={false}
                />
                <Radar
                  name={country.name}
                  dataKey={country.name}
                  stroke={tokens["brand-700"]}
                  fill={tokens["brand-700"]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                  {...animation()}
                />
                {peers.slice(0, 3).map((peer, i) => (
                  <Radar
                    key={peer.name}
                    name={peer.name}
                    dataKey={peer.name}
                    stroke={peerColor(i + 1)}
                    fill={peerColor(i + 1)}
                    fillOpacity={0.08}
                    strokeWidth={2}
                    {...animation()}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>

            {topPeer && (
              <div style={{ marginTop: "var(--s-16)" }}>
                <InsightBlock>
                  <strong>{topPeer.name}</strong> achieves <strong>{gap} points higher</strong>{" "}
                  performance in <strong>{focusPillar.name}</strong> despite having comparable
                  overall OIC DEI scores. This suggests targeted policy intervention in this
                  specific pillar可 yield significant competitive gains for {country.name}.
                  Target learning areas include regulatory frameworks, infrastructure
                  investments, and institutional capacity building.
                </InsightBlock>
              </div>
            )}
          </ChartFrame>
        </>
      ) : viewMode === "cases" ? (
        <>
          <Card
            title={`Success stories — ${focusPillar.name} excellence`}
            subtitle="Transferable lessons from OIC member states"
            footer={fmt.SOURCE_LINE}
          >
            <div className="cols-2">
              {[CASE_STUDIES[pillarFocus], CASE_STUDIES[pillarFocus === "p4" ? "p1" : "p4"]]
                .filter(Boolean)
                .map((cs, i) => (
                  <div className="panel" key={`${cs.country}-${i}`}>
                    <h3 className="t-h3" style={{ marginBottom: "var(--s-8)" }}>
                      {cs.country}&rsquo;s approach
                    </h3>
                    <p className="t-body prose">{cs.lesson}</p>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Implementation roadmap" subtitle="Five steps from benchmark to delivery">
            <ol className="t-body-lg prose" style={{ paddingLeft: "var(--s-20)", margin: 0, lineHeight: 1.9 }}>
              <li>
                Study regulatory and policy frameworks from peer leaders in {focusPillar.name}
              </li>
              <li>Identify resource gaps and institutional capacity requirements</li>
              <li>Develop phased implementation plan with clear KPIs and timelines</li>
              <li>Secure cross-ministry coordination and stakeholder buy-in</li>
              <li>Monitor progress against peer benchmarks quarterly</li>
            </ol>
          </Card>
        </>
      ) : (
        <EmptyState title={`Leading performance in ${focusPillar.name}`} icon="★">
          {country.name} is among the top performers in {focusPillar.name} relative to
          similar OIC DEI countries. Focus on maintaining competitive advantage and thought
          leadership.
        </EmptyState>
      )}
    </div>
  );
}

export default PeerLearning;
