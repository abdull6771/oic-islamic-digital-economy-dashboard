import { createContext, useContext } from "react";
import { createPortal } from "react-dom";

/**
 * Contextual controls stay with their view beneath the dashboard tabs.
 * A host can still supply a portal target when embedding a view elsewhere.
 */
const PageActionsContext = createContext(null);

export const PageActionsProvider = PageActionsContext.Provider;

export default function PageActions({ children }) {
  const target = useContext(PageActionsContext);
  if (!target) return <div className="page-context no-print">{children}</div>;
  return createPortal(children, target);
}
