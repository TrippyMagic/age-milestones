/**
 * src/context/PreferencesContext.tsx
 * Global user preferences — event category filters,
 * 3D toggle, timescales tab.
 * Persisted in localStorage where applicable.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { EventCategory } from "../types/events";
import {
  normalizeTimelineLanes,
  type TimelineLane,
} from "../components/timeline/types";

export type TimescalesTab = "overview" | "comparator" | "explorer";

const ALL_CATEGORIES: EventCategory[] = [
  "historical",
  "scientific",
  "technological",
  "space",
  "cultural",
];

const LS_CATS     = "pref_eventCategories";
const LS_3D       = "pref_show3D";
const LS_TS_TAB   = "pref_timescalesTab";
const LS_LANES    = "pref_visibleTimelineLanes";

/* ── helpers ──────────────────────────────────────────────── */
const readLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
};

/* ── context shape ────────────────────────────────────────── */
type PreferencesCtx = {
  /* which event categories are visible on the timeline */
  activeCategories: Set<EventCategory>;
  toggleCategory: (cat: EventCategory) => void;
  resetCategories: () => void;

  /* optional 3D mode (Phase 5 stub) */
  show3D: boolean;
  setShow3D: (v: boolean) => void;

  /* active tab in the Timescales page */
  timescalesTab: TimescalesTab;
  setTimescalesTab: (tab: TimescalesTab) => void;

  /* timeline lane visibility */
  visibleTimelineLanes: Set<TimelineLane>;
  toggleTimelineLane: (lane: TimelineLane) => void;
};

const PreferencesCtx = createContext<PreferencesCtx | undefined>(undefined);

/* ── provider ─────────────────────────────────────────────── */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    () => {
      const saved = readLS<EventCategory[] | null>(LS_CATS, null);
      return new Set<EventCategory>(saved ?? ALL_CATEGORIES);
    }
  );

  const [show3D, setShow3DState] = useState<boolean>(
    () => readLS<boolean>(LS_3D, false)
  );

  const [timescalesTab, setTimescalesTabState] = useState<TimescalesTab>(
    () => readLS<TimescalesTab>(LS_TS_TAB, "overview")
  );

  const [visibleTimelineLanes, setVisibleTimelineLanes] = useState<Set<TimelineLane>>(
    () => {
      const saved = readLS<unknown>(LS_LANES, null);
      return new Set<TimelineLane>(normalizeTimelineLanes(saved));
    }
  );

  /* ── setters with persistence ───────────────────────────── */
  const toggleCategory = (cat: EventCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        // Never allow all to be deactivated
        if (next.size === 1) return prev;
        next.delete(cat);
      } else {
        next.add(cat);
      }
      writeLS(LS_CATS, [...next]);
      return next;
    });
  };

  const resetCategories = () => {
    const full = new Set<EventCategory>(ALL_CATEGORIES);
    setActiveCategories(full);
    writeLS(LS_CATS, ALL_CATEGORIES);
  };

  const setShow3D = (v: boolean) => {
    setShow3DState(v);
    writeLS(LS_3D, v);
  };

  const setTimescalesTab = (tab: TimescalesTab) => {
    setTimescalesTabState(tab);
    writeLS(LS_TS_TAB, tab);
  };

  const toggleTimelineLane = (lane: TimelineLane) => {
    setVisibleTimelineLanes(prev => {
      const next = new Set(prev);
      if (next.has(lane)) {
        if (next.size === 1) return prev;
        next.delete(lane);
      } else {
        next.add(lane);
      }
      writeLS(LS_LANES, [...next]);
      return next;
    });
  };

  return (
    <PreferencesCtx.Provider
      value={{
        activeCategories, toggleCategory, resetCategories,
        show3D, setShow3D,
        timescalesTab, setTimescalesTab,
        visibleTimelineLanes, toggleTimelineLane,
      }}
    >
      {children}
    </PreferencesCtx.Provider>
  );
}

/* ── consumer hook ────────────────────────────────────────── */
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesCtx {
  const ctx = useContext(PreferencesCtx);
  if (!ctx) throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
