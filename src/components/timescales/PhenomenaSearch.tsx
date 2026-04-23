/**
 * src/components/timescales/PhenomenaSearch.tsx
 * Debounced search input + dropdown list for selecting a phenomenon.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  searchLabel: string;
  placeholder?: string;
  excludeId?:  string;
  excludedLabel?: string | null;
};

export function PhenomenaSearch({
  phenomena,
  selected,
  onSelect,
  searchLabel,
  placeholder = "Search phenomena…",
  excludeId,
  excludedLabel,
}: PhenomenaSearchProps) {
  const [query, setQuery]             = useState(selected?.label ?? "");
  const [open, setOpen]               = useState(false);
  const [debouncedQ, setDebouncedQ]   = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef                       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef                   = useRef<HTMLDivElement>(null);
  const inputId                        = useId();
  const listboxId                      = `${inputId}-listbox`;
  const hintId                         = `${inputId}-hint`;
  const emptyId                        = `${inputId}-empty`;

  const closeDropdown = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  useOutsideClick(containerRef, closeDropdown);

  useEffect(() => {
    setQuery(selected?.label ?? "");
    setDebouncedQ("");
  }, [selected]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQ(val), DEBOUNCE_MS);
    setOpen(true);
    setActiveIndex(0);
  };

  const handleSelect = (p: TimescalePhenomenon) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onSelect(p);
    setQuery(p.label);
    setDebouncedQ("");
    closeDropdown();
  };

  const filtered = useMemo(() => {
    const q = debouncedQ.trim().toLowerCase();
    return phenomena
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
  }, [debouncedQ, excludeId, phenomena]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }
    if (filtered.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(prev => {
      if (prev >= 0 && prev < filtered.length) return prev;
      const selectedIndex = filtered.findIndex(p => p.id === selected?.id);
      return selectedIndex >= 0 ? selectedIndex : 0;
    });
  }, [filtered, open, selected?.id]);

  const activeOption = activeIndex >= 0 ? filtered[activeIndex] : null;
  const describedBy = [hintId, open && filtered.length === 0 ? emptyId : null]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
      if (filtered.length > 0) {
        setActiveIndex(prev => prev < 0 ? 0 : (prev + 1) % filtered.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      }
      if (filtered.length > 0) {
        setActiveIndex(prev => {
          if (prev < 0) return filtered.length - 1;
          return prev === 0 ? filtered.length - 1 : prev - 1;
        });
      }
      return;
    }

    if (event.key === "Home" && open && filtered.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (event.key === "End" && open && filtered.length > 0) {
      event.preventDefault();
      setActiveIndex(filtered.length - 1);
      return;
    }

    if (event.key === "Enter" && open && activeOption) {
      event.preventDefault();
      handleSelect(activeOption);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} className="ts-search">
      <input
        id={inputId}
        className="ts-search__input"
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => {
          setOpen(true);
          if (!query.trim() || query === selected?.label) {
            setDebouncedQ("");
          }
        }}
        onBlur={event => {
          if (!containerRef.current?.contains(event.relatedTarget)) {
            closeDropdown();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-label={searchLabel}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOption ? `${inputId}-option-${activeOption.id}` : undefined}
        aria-describedby={describedBy || undefined}
      />

      {open && filtered.length > 0 && (
        <ul className="ts-search__list" id={listboxId} role="listbox" aria-label={`${searchLabel} results`}>
          {filtered.map((p, index) => (
            <li
              key={p.id}
              id={`${inputId}-option-${p.id}`}
              className="ts-search__item"
              role="option"
              aria-selected={activeIndex === index}
              data-active={activeIndex === index ? "true" : "false"}
              data-current={selected?.id === p.id ? "true" : "false"}
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

      {open && filtered.length === 0 && (
        <p className="ts-search__empty" id={emptyId} role="status" aria-live="polite">
          No matching phenomena available for this slot.
        </p>
      )}

      <p className="ts-search__hint" id={hintId}>
        {excludedLabel
          ? `Already selected in the other slot: ${excludedLabel}. Use arrow keys to move through the remaining results.`
          : "Search by name, description, or category. Use arrow keys to move through results, Enter to select, and Escape to close."}
      </p>
    </div>
  );
}

