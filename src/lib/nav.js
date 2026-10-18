/**
 * Navigation model.
 *
 * The 13 views were a horizontally-scrolling tab strip with no overflow
 * affordance, so anything past the viewport edge was invisible. They are now
 * grouped into four sections in a persistent sidebar. The `id` of every view is
 * unchanged, so existing `#tab=<id>` links still resolve.
 */

export const GROUPS = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "Analysis" },
  { id: "tools", label: "Tools" },
  { id: "about", label: "About" },
];

export const VIEWS = [
  { id: "overview", label: "Global Overview", group: "overview", icon: "◎" },
  { id: "profiles", label: "Country Profiles", group: "overview", icon: "▣" },
  { id: "compare", label: "Compare Countries", group: "overview", icon: "⇄" },

  { id: "pillar", label: "Pillar Analysis", group: "analysis", icon: "▥" },
  { id: "geo", label: "Geographic Analysis", group: "analysis", icon: "⊕" },
  { id: "trends", label: "Trends & Progress", group: "analysis", icon: "↗" },
  { id: "divide", label: "Digital Divide", group: "analysis", icon: "⇕" },
  { id: "stats", label: "Statistical Analysis", group: "analysis", icon: "∑" },
  { id: "quality", label: "Data-quality Explorer", group: "analysis", icon: "▦" },

  { id: "builder", label: "Custom Index Builder", group: "tools", icon: "⚙" },
  { id: "reports", label: "Report Downloads", group: "tools", icon: "⇩" },
  { id: "whatif", label: "What-if Calculator", group: "tools", icon: "±" },
  { id: "peers", label: "Peer Learning", group: "tools", icon: "⇉" },
  { id: "policy", label: "Strategic Recommendations", group: "tools", icon: "★" },

  { id: "methodology", label: "Methodology", group: "about", icon: "§" },
  { id: "history", label: "Update History", group: "about", icon: "↺" },
  { id: "acknowledgement", label: "Acknowledgements", group: "about", icon: "¶" },
];

export const DEFAULT_VIEW = "overview";

export const viewById = (id) => VIEWS.find((v) => v.id === id);

export const isValidView = (id) => Boolean(viewById(id));
