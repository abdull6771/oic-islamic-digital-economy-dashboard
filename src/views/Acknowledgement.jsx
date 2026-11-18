import "../styles/acknowledgements.css";

const researchTeam = [
  "Assoc. Prof. Dr. Kinan Salim",
  "Prof. Dr. Baharom Abdul Hamid",
  "Prof. Dr. Ahmet Faruk Aysan",
  "Prof. Dr. Nafis Alam",
  "Assoc. Prof. Dr. Mustafa Disli",
  "Dr. Nur Huda Othman",
  "Ruslena Ramli",
  "Haitham Alnaeb",
];

const developmentTeam = [
  { name: "Haitham Alnaeb" },
  { name: "Abdullahi Ahmad Babura", url: "https://abdullahiahmad.vercel.app/" },
  { name: "Amnan Hanani" },
];

function SectionHeading({ id, eyebrow, children }) {
  return (
    <header className="ack-section-heading">
      <span className="ack-eyebrow">{eyebrow}</span>
      <h3 id={id}>{children}</h3>
    </header>
  );
}

function Acknowledgement() {
  return (
    <div className="acknowledgements-page">
      <header className="ack-hero">
        <p className="ack-eyebrow">OIC Digital Economy Index</p>
        <h2>Acknowledgements</h2>
        <span className="ack-hero-rule" aria-hidden="true" />
        <p className="ack-hero-subtitle">
          OIC Digital Economy Index (OIC DEI) · 2025 Assessment · Policy Report
        </p>
      </header>

      <div className="ack-intro-grid">
        <section className="ack-card" aria-labelledby="ack-project-title">
          <SectionHeading id="ack-project-title" eyebrow="Our purpose">
            About the Project
          </SectionHeading>
          <div className="ack-prose">
            <p>
              This digital economy index and policy toolkit were prepared as part
              of the <strong>Islamic Digital Economy Project</strong>, supported
              by a grant from the <strong>Islamic Economics Research &amp;
              Innovation Fund (IERIF)</strong> under the Ministry of Finance
              Malaysia (MOF), and undertaken in strategic partnership with the
              Islamic Development Bank (IsDB). The project aims to advance
              research and policy dialogue on the development of the Islamic
              digital economy and provide data-driven insights for policymakers,
              researchers, and industry stakeholders.
            </p>
            <p>
              We gratefully acknowledge the IsDB Center of Excellence Kuala Lumpur
              and the IsDB Global Practices and Partnerships (GPP) Directorate for
              their valuable contributions and support throughout the project.
            </p>
          </div>
        </section>

        <section className="ack-card ack-university" aria-labelledby="ack-university-title">
          <SectionHeading id="ack-university-title" eyebrow="Our institution">
            About INCEIF University
          </SectionHeading>
          <div className="ack-prose">
            <p>
              <strong>INCEIF University — The Global University of Islamic Finance</strong>{" "}
              is a world-class institution dedicated to advancing knowledge and
              expertise in Islamic finance and economics. Established by Bank
              Negara Malaysia, INCEIF provides postgraduate education and
              spearheads cutting-edge research that bridges Islamic principles
              with contemporary financial and digital economy challenges. Through
              its academic programmes and research initiatives, INCEIF contributes
              to shaping evidence-based policy and building human capital for the
              global Islamic economy.
            </p>
          </div>
        </section>
      </div>

      <section className="ack-appreciation" aria-labelledby="ack-support-title">
        <SectionHeading id="ack-support-title" eyebrow="With appreciation">
          Research support
        </SectionHeading>
        <p>
          We extend our appreciation to the research assistants, Khairunnisa
          Ismah Lutfi, Kurniagung Nur Cahyono, Afief El Ashfahany, Nimotallahi
          Durojaiye, Dr Faaza Fakhrunnas, Dr Annisa Fithria, and Hassan Olakunle,
          for their dedicated support. Special thanks to Amnan Hanani for her
          professionalism and dedication in managing the project.
        </p>
      </section>

      <div className="ack-people-grid">
        <section className="ack-card ack-team" aria-labelledby="ack-research-title">
          <SectionHeading id="ack-research-title" eyebrow="Research & expertise">
            Research Team
          </SectionHeading>
          <p className="ack-team-intro">The research team for this project includes:</p>
          <ul className="ack-name-list ack-research-names">
            {researchTeam.map((name) => <li key={name}>{name}</li>)}
          </ul>
          <div className="ack-technical-contributor">
            <span>IsDB Technical Contributor</span>
            <strong>Mr Syed Faiq Najeeb</strong>
          </div>
        </section>

        <section className="ack-card ack-team" aria-labelledby="ack-development-title">
          <SectionHeading id="ack-development-title" eyebrow="Design & development">
            Dashboard Development Team
          </SectionHeading>
          <p className="ack-team-intro">
            The authors acknowledge the valuable contribution of the dashboard
            development team, whose work in designing and developing the
            interactive dashboard significantly enhanced the accessibility and
            usability of the project's data and findings.
          </p>
          <ul className="ack-name-list ack-development-names">
            {developmentTeam.map((person) => (
              <li key={person.name}>
                {person.url ? (
                  <a href={person.url} target="_blank" rel="noopener noreferrer">
                    {person.name}<span className="ack-external-link" aria-hidden="true"> ↗</span>
                  </a>
                ) : person.name}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="ack-disclaimer" aria-labelledby="ack-disclaimer-title">
        <SectionHeading id="ack-disclaimer-title" eyebrow="Please note">
          Disclaimer
        </SectionHeading>
        <div className="ack-prose ack-disclaimer-copy">
          <p>
            The findings, interpretations, and conclusions expressed in these
            policy toolkit and dashboard are solely those of the authors and do
            not necessarily reflect the views of INCEIF University or the
            official policies, position, or views of the IsDB Group, its
            Management, Board of Executive Directors, or member state
            shareholders.
          </p>
          <p>
            While reasonable efforts have been made to ensure the accuracy of
            the information presented, INCEIF University does not accept
            responsibility for the completeness of the content and shall not be
            liable for any loss arising from its use. The designations employed
            and the presentation of material in this publication do not imply
            the expression of any opinion concerning the legal status or
            boundaries.
          </p>
          <p>
            Nothing herein shall constitute or be considered a limitation or
            waiver of the privileges and immunities of INCEIF University, all of
            which are expressly reserved.
          </p>
        </div>
      </section>

      <footer className="ack-attribution">
        <p><strong>OIC Digital Economy Index (OIC DEI)</strong> · Developed by INCEIF University</p>
        <p>© 2026 <strong>INCEIF University</strong> — The Global University of Islamic Finance</p>
        <p className="ack-attribution-note">
          This dashboard is for informational purposes only. Data presented
          reflects the 2025 OIC Digital Economy Assessment. The findings do
          not necessarily reflect the views of INCEIF University.
        </p>
      </footer>
    </div>
  );
}

export default Acknowledgement;
