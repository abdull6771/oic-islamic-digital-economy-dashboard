import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, getCluster } from "../data/index.js";
import { VIEWS } from "../lib/nav.js";
import { CLUSTER_SHORT, toneFor } from "../lib/clusters.js";
import * as fmt from "../lib/format.js";

/**
 * Search across all 57 member states and all 13 views.
 *
 * With this many entities the palette is the highest-value navigation
 * affordance available: a country is two keystrokes away from anywhere.
 */
export default function CommandPalette({ open, onClose, onSelectView, onSelectCountry }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const views = VIEWS.filter((v) => !q || v.label.toLowerCase().includes(q)).map((v) => ({
      kind: "view",
      id: `view:${v.id}`,
      label: v.label,
      icon: v.icon,
      payload: v.id,
    }));
    const countries = COUNTRIES.filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => a.rank - b.rank)
      .map((c) => ({
        kind: "country",
        id: `country:${c.name}`,
        label: c.name,
        icon: "▣",
        meta: `${fmt.score(c.adei)} · ${fmt.rank(c.rank)}`,
        badge: CLUSTER_SHORT[toneFor(getCluster(c.adei).label)],
        payload: c.name,
      }));
    return [...views, ...countries];
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[active];
        if (!item) return;
        if (item.kind === "view") onSelectView(item.payload);
        else onSelectCountry(item.payload);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose, onSelectView, onSelectCountry]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const firstCountryIndex = items.findIndex((i) => i.kind === "country");

  return (
    <div
      className="cmdk-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search countries and views">
        <input
          ref={inputRef}
          className="cmdk-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          aria-activedescendant={items[active] ? `cmdk-${items[active].id}` : undefined}
          aria-label="Search countries and views"
          placeholder="Search 57 member states and 13 views…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
          {items.length === 0 && (
            <li className="cmdk-empty t-body">No match for “{query}”.</li>
          )}
          {items.map((item, i) => (
            <li key={item.id}>
              {i === 0 && item.kind === "view" && (
                <div className="cmdk-group t-overline">Views</div>
              )}
              {i === firstCountryIndex && (
                <div className="cmdk-group t-overline">Member states</div>
              )}
              <button
                type="button"
                id={`cmdk-${item.id}`}
                className="cmdk-item"
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  if (item.kind === "view") onSelectView(item.payload);
                  else onSelectCountry(item.payload);
                  onClose();
                }}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.meta && <span className="cmdk-meta">{item.meta}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
