import { COUNTRIES, INDICATOR_COUNTS, META, PILLARS, REFERENCE_YEAR, YEARS } from "../data/index.js";
import { TOOL_CATALOG, TOOL_GROUPS } from "../lib/tool-catalog.js";
import ToolIcon from "../components/ToolIcon.jsx";
import SignOutButton from "../components/SignOutButton.jsx";
import "../styles/landing-page.css";

const toolsFor = (group) => TOOL_CATALOG.filter((tool) => tool.group === group);
const groupFor = (id) => TOOL_GROUPS.find((group) => group.id === id);

/** Preserve real links, including opening a tool in another browser tab. */
function ToolLink({ id, onNavigate, children, ...props }) {
  return <a href={`#tab=${id}`} {...props} onClick={(event) => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(id);
  }}>{children}</a>;
}

function ToolCard({ tool, onNavigate, vertical = false }) {
  return <ToolLink id={tool.id} onNavigate={onNavigate} className={`landing-tool${vertical ? " landing-tool--vertical" : ""}`} data-tool-id={tool.id} data-tool-state="available">
    <span className="landing-tool-icon"><ToolIcon name={tool.id} /></span>
    <span className="landing-tool-copy"><span className="landing-tool-name">{tool.label}</span><span className="landing-tool-description">{tool.description}</span></span>
  </ToolLink>;
}

function GroupHeading({ group, publicExplore = false }) {
  return <div className="landing-group-header">
    <div className="landing-group-label">
      <span className="landing-group-icon"><ToolIcon name={group.id} size={24} /></span>
      <div><h2 id={`landing-${group.id}-title`}>{group.label}</h2><p>{group.description}</p></div>
    </div>
    {publicExplore && <span className="landing-available"><span aria-hidden="true" />Available now · {toolsFor("explore").length} tools</span>}
  </div>;
}

function LiveGroup({ id, onNavigate, publicExplore = false }) {
  const group = groupFor(id);
  return <section id={id} className={`landing-group landing-group--${id}`} aria-labelledby={`landing-${id}-title`}>
    <GroupHeading group={group} publicExplore={publicExplore} />
    <div className={`landing-tool-grid${id === "data" ? " landing-tool-grid--data" : ""}`}>
      {toolsFor(id).map((tool) => <ToolCard key={tool.id} tool={tool} onNavigate={onNavigate} vertical={id === "data"} />)}
    </div>
  </section>;
}

function ComingGroup({ id }) {
  const group = groupFor(id);
  return <div id={id} className={`landing-coming-group landing-group--${id}`}>
    <div className="landing-coming-group-header">
      <div className="landing-group-label"><span className="landing-group-icon"><ToolIcon name={id} /></span><h3>{group.label}</h3></div>
      <ToolIcon name="lock" size={18} />
    </div>
    <p className="landing-coming-question">{group.description}</p>
    <ul className="landing-coming-tools">
      {toolsFor(id).map((tool) => <li key={tool.id} data-tool-id={tool.id} data-tool-state="coming-soon">
        <span className="landing-tool-name">{tool.label}</span>
        <span className="landing-tool-description">{tool.description}</span>
      </li>)}
    </ul>
    <span className="landing-coming-label">Coming soon</span>
  </div>;
}

function SuggestedPaths({ onNavigate }) {
  const paths = [
    { label: "Policymakers and regulators", steps: [["profiles", "Country Profiles", "see where your country stands"], ["peers", "Peer Learning", "find who does better"], ["policy", "Strategic Recommendations", "choose the next steps"]] },
    { label: "Researchers and analysts", steps: [["methodology", "Methodology", "how the index is built"], ["quality", "Data-quality Explorer", "check the inputs"], ["builder", "Custom Index Builder", "test the weights"]] },
    { label: "Development partners and investors", steps: [["divide", "Digital Divide", "where the gaps are widest"], ["pillar", "Pillar Analysis", "which constraints to examine"], ["whatif", "What-if Calculator", "what closing a gap would mean"]] },
  ];
  return <section className="landing-paths" aria-labelledby="landing-paths-title">
    <div className="landing-section-intro"><h2 id="landing-paths-title">Suggested paths</h2><p>Not sure where to begin? Use the toolkit in this order for your role.</p></div>
    <div className="landing-path-grid">{paths.map((path) => <div className="landing-path" key={path.label}><h3>{path.label}</h3><ol>{path.steps.map(([id, label, description]) => <li key={id}><ToolLink id={id} onNavigate={onNavigate}>{label}</ToolLink>: {description}</li>)}</ol></div>)}</div>
  </section>;
}

function DatasetSnapshot() {
  const tiers = [
    { id: "advanced", label: "Advanced", count: COUNTRIES.filter((country) => country.adei >= 60).length, range: "≥60" },
    { id: "emerging", label: "Emerging", count: COUNTRIES.filter((country) => country.adei >= 40 && country.adei < 60).length, range: "40–59" },
    { id: "foundational", label: "Foundational", count: COUNTRIES.filter((country) => country.adei < 40).length, range: "<40" },
  ];
  const firstYear = YEARS[0];
  const lastYear = YEARS.at(-1);
  const yearRange = firstYear === lastYear ? String(firstYear) : `${firstYear}–${Math.floor(firstYear / 100) === Math.floor(lastYear / 100) ? String(lastYear).slice(-2) : lastYear}`;
  return <aside className="landing-snapshot" aria-label="Index coverage and maturity tiers">
    <dl className="landing-metrics">
      <div><dt>member states</dt><dd>{META.countryCount}</dd></div>
      <div><dt>weighted pillars</dt><dd>{PILLARS.length}</dd></div>
      <div><dt>indicators, {INDICATOR_COUNTS.subIndicators} sub-indicators</dt><dd>{INDICATOR_COUNTS.indicators}</dd></div>
      <div><dt>{YEARS.length} assessment years</dt><dd>{yearRange}</dd></div>
    </dl>
    <div className="landing-tiers">
      <h2>Digital maturity tiers, {REFERENCE_YEAR}</h2>
      <div className="landing-tier-bar" role="img" aria-label={tiers.map((tier) => `${tier.count} ${tier.label}`).join(", ") + " member states"}>
        {tiers.map((tier) => <span key={tier.id} className={`landing-tier landing-tier--${tier.id}`} style={{ flexGrow: tier.count }} />)}
      </div>
      <ul className="landing-tier-legend">{tiers.map((tier) => <li key={tier.id}><span className={`landing-tier-dot landing-tier--${tier.id}`} aria-hidden="true" />{tier.count} {tier.label} ({tier.range})</li>)}</ul>
    </div>
  </aside>;
}

/** Shared source/data, with the two supplied landing-page boards as variants. */
export default function LandingPage({ edition = "public", onNavigate, contactEmail }) {
  const isPublic = edition === "public";
  const publicToolCount = toolsFor("explore").length;
  return <div className={`landing-page landing-page--${edition}`}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <ToolLink id="home" onNavigate={onNavigate} className="landing-brand"><span className="landing-brand-icon"><ToolIcon name="toolkit" /></span><span><strong>Digital Economy Index: OIC Countries {REFERENCE_YEAR}</strong></span></ToolLink>
        <nav className="landing-nav" aria-label="Main">
          <a href="#explore">Explore</a>
          {isPublic ? <a href="#coming" className="landing-coming-nav">Coming soon <span>NEW</span></a> : <><a href="#simulate">Simulate</a><a href="#learn">Learn &amp; act</a><a href="#data">Data &amp; methods</a></>}
          <ToolLink id="overview" onNavigate={onNavigate} className="landing-button landing-button--small">Open Dashboard</ToolLink>
          {!isPublic && <SignOutButton />}
        </nav>
      </div>
    </header>

    <main id="main" tabIndex={-1}>
      <section id="top" className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-container landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Digital Economy Index: OIC Countries {REFERENCE_YEAR}</p>
            <h1 id="landing-title">Practical tools for digital economy policy across {META.countryCount} OIC member states</h1>
            <p className="landing-hero-description">{isPublic ? "Explore where every member state stands on digital readiness, compare countries and track progress. Scenario, peer-learning and data tools are on the way." : "Built on an open, reproducible index of digital readiness, the toolkit helps you benchmark countries, test policy scenarios and learn from peers."}</p>
            <div className="landing-hero-actions">
              <ToolLink id="overview" onNavigate={onNavigate} className="landing-button">Explore the Dashboard <ToolIcon name="arrow" size={18} /></ToolLink>
              {isPublic ? <a href="#coming" className="landing-button landing-button--outline">See what’s coming</a> : <ToolLink id="whatif" onNavigate={onNavigate} className="landing-button landing-button--outline">Run a scenario</ToolLink>}
            </div>
          </div>
          <DatasetSnapshot />
        </div>
      </section>

      <div className="landing-container landing-main-content">
        {!isPublic && <div className="landing-section-intro landing-tool-intro"><h2>Pick the right tool for your question</h2><p>{TOOL_CATALOG.length} tools in four sets, grouped by what you want to find out. Every tool uses the same {REFERENCE_YEAR} scores, published with the full indicator-level data.</p></div>}
        <LiveGroup id="explore" onNavigate={onNavigate} publicExplore={isPublic} />
        {isPublic ? <>
          <section id="coming" className="landing-coming" aria-labelledby="landing-coming-title">
            <div className="landing-section-intro"><span className="landing-development">In development</span><h2 id="landing-coming-title">Coming soon to the toolkit</h2><p>We are developing three new sets of tools that move from describing where countries stand to testing what could change it. They are being refined and will open in future releases.</p></div>
            <div className="landing-coming-grid">{["simulate", "learn", "data"].map((id) => <ComingGroup id={id} key={id} />)}</div>
          </section>
          <section id="contact" className="landing-partner" aria-labelledby="landing-partner-title"><div><h2 id="landing-partner-title">Interested in piloting the new tools?</h2><p>We are inviting policymakers, regulators and development partners to test the scenario and peer-learning tools before public release.</p></div>{contactEmail ? <a href={`mailto:${contactEmail}`} className="landing-button">Register your interest <ToolIcon name="arrow" size={18} /></a> : <p className="landing-contact-pending">Contact details will be published here.</p>}</section>
        </> : <>
          <div className="landing-action-groups"><LiveGroup id="simulate" onNavigate={onNavigate} /><LiveGroup id="learn" onNavigate={onNavigate} /></div>
          <LiveGroup id="data" onNavigate={onNavigate} />
          <SuggestedPaths onNavigate={onNavigate} />
        </>}
      </div>
    </main>

    <footer className="landing-footer"><div className="landing-container landing-footer-inner">
      <div className="landing-footer-copy"><strong>Digital Economy Index: OIC Countries {REFERENCE_YEAR}</strong><p>Developed by INCEIF University under the Islamic Digital Economy Project, supported by the Islamic Economics Research &amp; Innovation Fund (IERIF).</p><p className="landing-source-date">{META.countryCount} member states · {REFERENCE_YEAR} assessment{META.sourceUpdated && ` · Data updated ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${META.sourceUpdated}T00:00:00Z`))}`}</p></div>
      <nav aria-label="Footer">{isPublic ? <><a href="#explore">Explore ({publicToolCount} tools)</a><a href="#coming">Coming soon</a></> : <><ToolLink id="reports" onNavigate={onNavigate}>Download country reports</ToolLink><ToolLink id="methodology" onNavigate={onNavigate}>Methodology</ToolLink><ToolLink id="history" onNavigate={onNavigate}>Update history</ToolLink></>}<ToolLink id="acknowledgement" onNavigate={onNavigate}>Acknowledgements</ToolLink></nav>
    </div></footer>
  </div>;
}
