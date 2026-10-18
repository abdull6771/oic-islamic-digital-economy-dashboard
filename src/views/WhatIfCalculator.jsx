import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, REFERENCE_YEAR } from "../data/index.js";
import CountryCombobox from "../components/CountryCombobox.jsx";
import { Badge, Button, Card, ClusterBadge, Delta, StatTile, TableScroll } from "../components/Primitives.jsx";
import { hashParam } from "../lib/routing.js";
import * as fmt from "../lib/format.js";
import { getWhatIfBaseline, simulatePillarImprovements } from "../lib/what-if.js";
import "../styles/what-if.css";

const initialCountry = () => COUNTRIES.find(({ name }) => name === hashParam("country"))?.name || COUNTRIES[0].name;

function PillarTarget({ pillar, target, onChange }) {
  const [draft, setDraft] = useState(String(target));
  useEffect(() => setDraft((current) => current.trim() && Number(current) === target ? current : String(target)), [target]);
  const parsed = draft.trim() ? Number(draft) : NaN;
  const invalid = !Number.isFinite(parsed) || parsed < pillar.baseline || parsed > 100;
  const inputId = `what-if-number-${pillar.key}`;
  const helpId = `what-if-help-${pillar.key}`;
  const errorId = `what-if-error-${pillar.key}`;
  const updateNumber = (value) => {
    setDraft(value);
    const number = value.trim() ? Number(value) : NaN;
    if (Number.isFinite(number) && number >= pillar.baseline && number <= 100) onChange(number);
  };

  return (
    <fieldset className="what-if-pillar">
      <legend className="t-sm">
        <span className="swatch-dot" style={{ background: pillar.color }} aria-hidden="true" />
        {pillar.name}
      </legend>
      <p id={helpId} className="t-caption subtle">
        Published {fmt.score(pillar.baseline)} · Official weight {fmt.weight(pillar.weight)}
      </p>
      <div className="what-if-pillar-inputs">
        <label className="visually-hidden" htmlFor={`what-if-range-${pillar.key}`}>
          {pillar.name} target score slider
        </label>
        <input
          id={`what-if-range-${pillar.key}`}
          className="range"
          type="range"
          min={pillar.baseline}
          max={100}
          step="any"
          value={target}
          aria-describedby={helpId}
          aria-valuetext={`${target.toFixed(2)} out of 100`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="what-if-number">
          <label className="t-caption" htmlFor={inputId}>Target score</label>
          <input
            id={inputId}
            className="input tnum"
            type="number"
            inputMode="decimal"
            min={pillar.baseline}
            max={100}
            step="any"
            value={draft}
            aria-label={`${pillar.name} target score`}
            aria-describedby={`${helpId}${invalid ? ` ${errorId}` : ""}`}
            aria-invalid={invalid || undefined}
            onChange={(event) => updateNumber(event.target.value)}
          />
        </div>
      </div>
      {invalid && <p id={errorId} className="t-caption what-if-error">Enter {pillar.baseline} to 100. The last valid target is used.</p>}
      <div className="what-if-pillar-effect t-caption">
        <span>Pillar increase <strong>{fmt.delta(pillar.improvement, 2)}</strong></span>
        <span>Overall gain <strong>{fmt.delta(pillar.contribution, 2)}</strong></span>
      </div>
    </fieldset>
  );
}

export default function WhatIfCalculator() {
  const [countryName, setCountryName] = useState(initialCountry);
  const [targets, setTargets] = useState(() => getWhatIfBaseline(countryName));
  const [resetVersion, setResetVersion] = useState(0);
  const scenario = useMemo(() => simulatePillarImprovements(countryName, targets), [countryName, targets]);
  const chooseCountry = (name) => {
    setCountryName(name);
    setTargets(getWhatIfBaseline(name));
  };
  const reset = () => {
    setTargets(getWhatIfBaseline(countryName));
    setResetVersion((value) => value + 1);
  };

  return (
    <div className="stack what-if-calculator">
      <Card title="What-if calculator" subtitle={`Pillar improvement scenarios · ${REFERENCE_YEAR}`}>
        <p className="t-body-lg prose">
          Choose a country and raise its pillar scores to explore the effect on its overall score and OIC ranking.
          Official pillar weights stay fixed, and every other country keeps its published {REFERENCE_YEAR} score.
        </p>
        <div className="what-if-controls">
          <CountryCombobox id="what-if-country" value={countryName} onChange={chooseCountry} />
          <Button onClick={reset}>Reset to published scores</Button>
          <Badge tone="info">Hypothetical scenario</Badge>
        </div>
        <p className="t-caption subtle">This calculation describes an assumed score change; it does not forecast outcomes or estimate the investment needed to achieve them.</p>
      </Card>

      <Card title={`${countryName}: scenario result`} subtitle={`${scenario.changedPillars} of ${scenario.pillars.length} pillar targets changed`}>
        <div className="what-if-results" role="status" aria-live="polite" aria-atomic="true">
          <StatTile label="Published overall score" value={fmt.score(scenario.baseline.score)} support={`Published rank #${scenario.baseline.rank} of ${scenario.countryCount}`} />
          <StatTile label="Simulated overall score" value={fmt.score(scenario.simulated.score)} support={`${fmt.delta(scenario.scoreGain, 2)} score points`} />
          <StatTile label="Simulated OIC rank" value={`#${scenario.simulated.rank}`} support={`${scenario.rankGain} place${scenario.rankGain === 1 ? "" : "s"} gained · of ${scenario.countryCount}`} />
        </div>
        <div className="what-if-clusters">
          <span className="t-caption subtle">Published classification</span>
          <ClusterBadge cluster={scenario.baseline.cluster} />
          <span className="t-caption subtle">Simulated classification</span>
          <ClusterBadge cluster={scenario.simulated.cluster} />
        </div>
        <p className="t-caption subtle">
          {scenario.tiedCountries.length
            ? `Shared rank with ${scenario.tiedCountries.join(", ")}. `
            : "No country shares this simulated rank. "}
          Equal scores share a competition rank; the next rank skips the tied positions. Scores within 0.000000001 points count as equal.
        </p>
      </Card>

      <Card title="Improve pillar scores" subtitle="Each target starts at its exact published value and can rise to 100">
        <div className="what-if-pillars">
          {scenario.pillars.map((pillar) => (
            <PillarTarget
              key={`${countryName}-${resetVersion}-${pillar.key}`}
              pillar={pillar}
              target={targets[pillar.key]}
              onChange={(value) => setTargets((current) => ({ ...current, [pillar.key]: value }))}
            />
          ))}
        </div>
      </Card>

      <div className="what-if-detail-grid">
        <Card title="How the overall score changes" subtitle="Pillar increase × official weight = overall score contribution">
          <TableScroll>
            <table className="data-table what-if-contributions">
              <caption className="visually-hidden">Published and target pillar scores, official weights and weighted contributions for {countryName}.</caption>
              <thead><tr><th scope="col">Pillar</th><th scope="col" className="numeric">Published</th><th scope="col" className="numeric">Target</th><th scope="col" className="numeric">Weight</th><th scope="col" className="numeric">Overall gain</th></tr></thead>
              <tbody>
                {scenario.pillars.map((pillar) => (
                  <tr key={pillar.key}>
                    <th scope="row">{pillar.short}</th>
                    <td className="numeric tnum">{fmt.score(pillar.baseline)}</td>
                    <td className="numeric tnum">{fmt.score(pillar.target)}</td>
                    <td className="numeric tnum">{fmt.weight(pillar.weight)}</td>
                    <td className="numeric tnum"><Delta value={pillar.contribution} digits={2} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><th scope="row" colSpan={4}>Total overall gain</th><td className="numeric tnum">{fmt.delta(scenario.scoreGain, 2)}</td></tr></tfoot>
            </table>
          </TableScroll>
          <p className="t-caption subtle what-if-formula">
            Simulated score = published overall score + sum of weighted pillar increases.
            Calculations retain full stored precision. Published scores and pillar values are rounded in the dataset, so an unchanged scenario preserves the published overall score exactly.
          </p>
        </Card>

        <Card title="Nearby countries in the scenario" subtitle="The selected country moves; other countries retain their published scores">
          <TableScroll>
            <table className="data-table what-if-neighbors">
              <caption className="visually-hidden">Nearby countries ranked with the hypothetical score for {countryName}.</caption>
              <thead><tr><th scope="col" className="numeric">Rank</th><th scope="col">Country</th><th scope="col" className="numeric">Score</th></tr></thead>
              <tbody>
                {scenario.neighbors.map((entry) => (
                  <tr key={entry.name} data-simulated={entry.simulated || undefined}>
                    <td className="numeric tnum">#{entry.rank}</td>
                    <th scope="row">{entry.name}{entry.simulated && <span className="t-caption what-if-simulated-label">Simulated</span>}</th>
                    <td className="numeric tnum">{fmt.score(entry.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </Card>
      </div>
    </div>
  );
}
