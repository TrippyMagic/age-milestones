/**
 * src/components/timescales/PhenomenaSearch.tsx
 * Debounced search input + dropdown list for selecting a phenomenon.
 */
import { useRef, useState } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { formatDuration } from "../../utils/formatDuration";
import type { TimescalePhenomenon } from "../../types/phenomena";
import { PHENOMENON_CATEGORY_META } from "../../types/phenomena";

const MAX_RESULTS   = 14;
const DEBOUNCE_MS   = 180;

type PhenomenaSearchProps = {
  phenomena:   TimescalePhenomenon[];
  selected:    TimescalePhenomenon | null;
  onSelect:    (p: TimescalePhenomenon) => void;
  placeholder?: string;
  excludeId?:  string;
};

export function PhenomenaSearch({
  phenomena,
  selected,
  onSelect,
  placeholder = "Search phenomena…",
  excludeId,
}: PhenomenaSearchProps) {
  const [query, setQuery]             = useState(selected?.label ?? "");
  const [open, setOpen]               = useState(false);
  const [debouncedQ, setDebouncedQ]   = useState("");
  const timerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef                   = useRef<HTMLDivElement>(null);

  useOutsideClick(containerRef, () => setOpen(false));

  const handleInput = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(val), DEBOUNCE_MS);
    setOpen(true);
  };

  const handleSelect = (p: TimescalePhenomenon) => {
    onSelect(p);
    setQuery(p.label);
    setOpen(false);
  };

  const q = debouncedQ.trim().toLowerCase();
  const filtered = phenomena
    .filter(p => {
      if (p.id === excludeId) return false;
      if (q === "") return true;
      return (
        p.label.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    })
    .slice(0, MAX_RESULTS);

  return (
    <div ref={containerRef} className="ts-search">
      <input
        className="ts-search__input"
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />

      {open && filtered.length > 0 && (
        <ul className="ts-search__list" role="listbox">
          {filtered.map(p => (
            <li
              key={p.id}
              className="ts-search__item"
              role="option"
              aria-selected={selected?.id === p.id}
              onMouseDown={() => handleSelect(p)}
            >
              <span
                className="ts-search__item-dot"
                style={{ background: PHENOMENON_CATEGORY_META[p.category].color }}
                aria-hidden="true"
              />
              <span className="ts-search__item-label">{p.label}</span>
              <span className="ts-search__item-duration">
                {formatDuration(p.durationSeconds)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

