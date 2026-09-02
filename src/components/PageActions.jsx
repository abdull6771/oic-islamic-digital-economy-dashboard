import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

/**
 * Lets a view put its own contextual controls - a country selector, a year
 * picker - into the sticky page header, where the brief puts them, without the
 * shell having to know what each view needs.
 */
const PageActionsContext = createContext(null);

export const PageActionsProvider = PageActionsContext.Provider;

export default function PageActions({ children }) {
  const target = useContext(PageActionsContext);
  if (!target) return null;
  return createPortal(children, target);
}
