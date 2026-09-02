import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "../data/index.js";
import * as fmt from "../lib/format.js";

/**
 * The searchable country selector.
 *
 * The original was a bare `<input>` with a floating `<div>` list whose hover
 * state was written by mutating `e.currentTarget.style` - unreachable by
 * keyboard and invisible to assistive technology. This is a real combobox:
 * arrow keys move the active option, Enter commits, Escape reverts.
 */
export default function CountryCombobox({
  value,
  onChange,
  label = "Country",
  hideLabel = false,
  countries = COUNTRIES,
  id = "country-combobox",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...countries]
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [countries, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      listRef.current
        ?.querySelector('[data-active="true"]')
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [active, open]);

  const commit = (name) => {
    onChange(name);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      if (open && options[active]) {
        e.preventDefault();
        commit(options[active].name);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="field" ref={wrapRef}>
      <label className={hideLabel ? "visually-hidden" : "t-overline"} htmlFor={id}>
        {label}
      </label>
      <div className="combo">
        <input
          id={id}
          className="input"
          style={{ width: "100%" }}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-${active}` : undefined}
          value={open ? query : value}
          placeholder="Search country…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {open && (
          <ul className="combo-list" id={`${id}-list`} role="listbox" ref={listRef}>
            {options.length === 0 && (
              <li className="cmdk-empty t-caption">No match for “{query}”.</li>
            )}
            {options.map((c, i) => (
              <li key={c.name}>
                <button
                  type="button"
                  id={`${id}-${i}`}
                  className="combo-option"
                  role="option"
                  aria-selected={c.name === value}
                  data-active={i === active}
                  data-current={c.name === value}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(c.name)}
                >
                  <span>{c.name}</span>
                  <span className="combo-score">{fmt.score(c.adei)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
