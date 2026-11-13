/** One catalog powers both landing pages, navigation and access checks. */
export const TOOL_GROUPS = [
  { id: "explore", label: "Explore", description: "Where do countries stand, and how are they changing?" },
  { id: "simulate", label: "Simulate", description: "What if a country improved, or priorities changed?" },
  { id: "learn", label: "Learn & act", description: "Who can we learn from, and what should we do next?" },
  { id: "data", label: "Data & methods", description: "Can I trust it, replicate it and reuse it?" },
];

export const TOOL_CATALOG = [
  { id: "overview", label: "Dashboard", group: "explore", icon: "dashboard", description: "The 2025 snapshot: map, tiers, leaders and the full score heatmap." },
  { id: "profiles", label: "Country Profiles", group: "explore", icon: "flag", description: "Scores, ranks and indicator detail for each member state." },
  { id: "compare", label: "Compare Countries", group: "explore", icon: "compare", description: "Put countries side by side across all nine pillars." },
  { id: "pillar", label: "Pillar Analysis", group: "explore", icon: "bars", description: "Who leads and who lags on each of the nine pillars." },
  { id: "geo", label: "Geographic Analysis", group: "explore", icon: "globe", description: "Regional patterns across the OIC, from the GCC to West Africa." },
  { id: "trends", label: "Trends & Progress", group: "explore", icon: "trend", description: "Score trajectories across the 2021–2025 assessments." },
  { id: "divide", label: "Digital Divide", group: "explore", icon: "divide", description: "Each country's gap from the OIC average, leaders to laggards." },
  { id: "whatif", label: "What-if Calculator", group: "simulate", icon: "scenario", description: "Raise a country's pillar scores and see its new overall score, rank and tier." },
  { id: "builder", label: "Custom Index Builder", group: "simulate", icon: "sliders", description: "Change the pillar weights to reflect your policy priorities." },
  { id: "peers", label: "Peer Learning", group: "learn", icon: "people", description: "Find comparable countries that perform better on a chosen pillar." },
  { id: "policy", label: "Strategic Recommendations", group: "learn", icon: "bulb", description: "Country actions derived from pillar gaps, plus bloc-wide priorities." },
  { id: "quality", label: "Data-quality Explorer", group: "data", icon: "database", description: "The values behind every indicator, and how they were sourced." },
  { id: "stats", label: "Statistical Analysis", group: "data", icon: "stats", description: "Distributions, variation and relationships between the pillar scores." },
  { id: "methodology", label: "Methodology", group: "data", icon: "book", description: "The index framework, pillar weights, sources and calculation methods." },
  { id: "reports", label: "Report Downloads", group: "data", icon: "download", description: "Download individual country reports, collections and combined PDFs." },
  { id: "history", label: "Update History", group: "data", icon: "history", description: "Trace workbook revisions and changes to published scores and rankings." },
];
