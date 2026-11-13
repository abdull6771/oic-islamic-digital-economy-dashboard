import { TOOL_CATALOG, TOOL_GROUPS } from "./tool-catalog.js";
import { canAccessView } from "./site-edition.js";

export const GROUPS = [{ id: "home", label: "Home" }, ...TOOL_GROUPS, { id: "about", label: "About" }];
const icons = { overview: "▦", profiles: "⚑", compare: "⇄", pillar: "▥", geo: "⊕", trends: "↗", divide: "⇕", whatif: "±", builder: "⚙", peers: "⇉", policy: "☆", quality: "▤", stats: "∑", methodology: "§", reports: "⇩", history: "↺" };
export const VIEWS = [
  { id: "home", label: "Home", group: "home", icon: "⌂" },
  ...TOOL_CATALOG.map((tool) => ({ ...tool, icon: icons[tool.id] })),
  { id: "acknowledgement", label: "Acknowledgements", group: "about", icon: "¶" },
].filter((view) => canAccessView(view.id));
export const DEFAULT_VIEW = "home";
export const viewById = (id) => VIEWS.find((view) => view.id === id);
export const isValidView = (id) => Boolean(viewById(id));
