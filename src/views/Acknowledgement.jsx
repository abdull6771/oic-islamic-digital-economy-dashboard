

function Acknowledgement() {
  const cardStyle = {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "32px 36px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
    transition: "all 0.3s ease",
  };
  const headingStyle = {
    fontFamily: "'Georgia', serif",
    fontSize: "16px",
    fontWeight: 600,
    color: "#000000",
    letterSpacing: "0.05em",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };
  const bodyStyle = {
    color: "#1E293B",
    fontSize: "14px",
    lineHeight: 1.8,
    fontFamily: "'Georgia', serif",
  };
  const nameStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg, #FEF9EC, #FFFBF0)",
    border: "1px solid #F0D67A",
    borderRadius: "6px",
    padding: "6px 14px",
    margin: "4px 6px",
    fontSize: "13px",
    color: "#1E293B",
    fontWeight: 500,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
  };
  const authorEntry = {
    fontSize: "14px",
    color: "#1E293B",
    padding: "10px 0",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s ease",
  };

  return (
    <>
      <div
        style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 16px" }}
      >
        {/* Hero Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #001f3f 0%, #00152b 100%)",
            borderRadius: "14px",
            padding: "48px 40px",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "300px",
              height: "300px",
              background:
                "radial-gradient(circle, rgba(0,168,232,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              transform: "translate(60px,-60px)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                color: "#FFFFFF",
                fontSize: "28px",
                fontWeight: 900,
                margin: "0 0 8px",
                letterSpacing: "0.02em",
              }}
            >
              Acknowledgements
            </h2>
            <p
              style={{
                color: "#E0E7FF",
                fontSize: "14px",
                margin: 0,
                fontStyle: "italic",
                letterSpacing: "0.03em",
                fontWeight: 500,
              }}
            >
              OIC Digital Economy Index (OIC DEI) · 2025 Assessment · Policy
              Report
            </p>
          </div>
        </div>

        {/* About the Project */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>📋</span> About the Project
          </div>
          <p style={bodyStyle}>
            This report was prepared as part of the{" "}
            <strong style={{ color: "#000000" }}>
              Islamic Digital Economy Project
            </strong>
            , supported by a grant from the{" "}
            <strong style={{ color: "#000000" }}>
              Islamic Economics Research &amp; Innovation Fund (IERIF)
            </strong>
            . The project aims to advance research and policy dialogue on the
            development of the Islamic digital economy and to provide
            data-driven insights for policymakers, researchers, and industry
            stakeholders.
          </p>
        </div>

        {/* INCEIF */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>🏛</span> About INCEIF University
          </div>
          <p style={bodyStyle}>
            <strong style={{ color: "#000000" }}>
              INCEIF University — The Global University of Islamic Finance
            </strong>{" "}
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

        {/* Research Team */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>🔬</span> Research Team
          </div>
          <p style={{ ...bodyStyle, marginBottom: "20px" }}>
            The research team for this project includes:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {[
              "Assoc. Prof. Dr. Kinan Salim",
              "Prof. Dr. Baharom Abd Hamid",
              "Prof. Dr. Ahmet Faruk Aysan",
              "Prof. Dr. Nafis Alam",
              "Assoc. Prof. Dr. Mustafa Disli",
              "Dr. Nur Huda Othman",
              "Ruslena Ramli",
              "Haitham Alnaeb",
            ].map((name) => (
              <span key={name} style={nameStyle}>
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Authors */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>✍️</span> Authors
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              "Assoc. Prof. Dr. Kinan Salim",
              "Prof. Dr. Baharom Abdul Hamid",
              "Assoc. Prof. Dr. Mustafa Disli",
              "Khairunnisa Ismah Lutfi",
              "Kurniagung Nur Cahyono",
            ].map((name, i) => (
              <div key={name} style={authorEntry}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #B8922A, #A07810)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: "0 2px 4px rgba(184, 146, 42, 0.2)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontWeight: 500, color: "#000000" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Development Team */}
        <div style={cardStyle}>
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>💻</span> Dashboard Development
            Team
          </div>
          <p style={{ ...bodyStyle, marginBottom: "20px" }}>
            The authors acknowledge the valuable contribution of the dashboard
            development team, whose work in designing and developing the
            interactive dashboard significantly enhanced the accessibility and
            usability of the project's data and findings.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
            {[
              { name: "Haitham Alnaeb", url: null },
              {
                name: "Abdullahi Ahmad Babura",
                url: "https://abdullahiahmad.vercel.app/",
              },
              { name: "Amnan Hanani", url: null },
            ].map((person) => (
              <span key={person.name} style={nameStyle}>
                {person.url ? (
                  <a
                    href={person.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = "#B8922A";
                      e.target.style.textDecoration = "underline";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "inherit";
                      e.target.style.textDecoration = "none";
                    }}
                  >
                    {person.name}
                  </a>
                ) : (
                  person.name
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, #FEF9EC 0%, #FFFBF0 100%)",
            border: "1px solid #F0D67A",
            borderLeft: "4px solid #B8922A",
          }}
        >
          <div style={headingStyle}>
            <span style={{ fontSize: "20px" }}>⚖️</span> Disclaimer
          </div>
          <p style={{ ...bodyStyle, color: "#1E293B", fontSize: "13px" }}>
            The views expressed in this report are those of the authors and do
            not necessarily reflect the official positions of INCEIF University,
            IERIF, or any affiliated organisations. The data presented is
            intended for research and informational purposes only.
          </p>
        </div>

        {/* Footer Attribution */}
        <div
          style={{
            background: "#F8FAFC",
            borderTop: "2px solid #E2E8F0",
            borderRadius: "8px",
            marginTop: "40px",
            padding: "32px 40px",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#1E293B",
                letterSpacing: "0.02em",
              }}
            >
              <strong style={{ color: "#1E293B" }}>
                OIC Digital Economy Index (OIC DEI)
              </strong>{" "}
              · Developed by INCEIF University
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                fontSize: "12px",
                color: "#1E293B",
              }}
            >
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Methodology
              </a>
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Data Sources
              </a>
              <a
                href="#"
                style={{
                  color: "#00a8e8",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                Contact
              </a>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #E2E8F0",
              paddingTop: "16px",
              fontSize: "12px",
              color: "#1E293B",
              letterSpacing: "0.01em",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 8px 0" }}>
              © 2026{" "}
              <strong style={{ color: "#000000" }}>INCEIF University</strong> —
              The Global University of Islamic Finance
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#475569" }}>
              This dashboard is for informational purposes only. Data presented
              reflects the 2025 OIC Digital Economy Assessment. The findings do
              not necessarily reflect the views of INCEIF University.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Acknowledgement;
