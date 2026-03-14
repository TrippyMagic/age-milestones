/**
 * src/hooks/useExplorerDrilldown.ts
 * Manages the breadcrumb-based tree navigation for GeoCosmicExplorer.
 * The explorer operates as a stack: each "drill down" pushes a unit onto the
 * path; each "drill up" or breadcrumb click pops back to that depth.
 */
import { useMemo, useState } from "react";
import type { GeologicalUnit } from "../types/geological";

export type Breadcrumb = {
  label: string;
  /** Index into the path array (-1 means root). */
  depth: number;
};

export type UseExplorerDrilldownResult = {
  /** Units displayed at the current navigation level. */
  currentItems: GeologicalUnit[];
  /** Breadcrumb trail from root to current level. */
  breadcrumbs: Breadcrumb[];
  /** Currently selected unit shown in the detail panel (null = none). */
  selected: GeologicalUnit | null;
  /** Drill one level deeper into a unit that has children. */
  drillDown: (unit: GeologicalUnit) => void;
  /** Go one level back (same as clicking the last breadcrumb). */
  drillUp: () => void;
  /** Jump directly to a breadcrumb depth (-1 = root). */
  drillTo: (depth: number) => void;
  /** Select a unit for the detail panel without drilling. */
  setSelected: (unit: GeologicalUnit | null) => void;
  /** True when at the root level. */
  isAtRoot: boolean;
};

export function useExplorerDrilldown(
  root: GeologicalUnit[],
): UseExplorerDrilldownResult {
  // Stack of ancestor units (path from root → current level).
  const [path, setPath]         = useState<GeologicalUnit[]>([]);
  const [selected, setSelected] = useState<GeologicalUnit | null>(null);

  const currentItems = useMemo<GeologicalUnit[]>(() => {
    if (path.length === 0) return root;
    const last = path[path.length - 1];
    return last.children ?? [];
  }, [path, root]);

  const breadcrumbs = useMemo<Breadcrumb[]>(() => [
    { label: "All Eons", depth: -1 },
    ...path.map((unit, i) => ({ label: unit.name, depth: i })),
  ], [path]);

  const drillDown = (unit: GeologicalUnit) => {
    if (unit.children && unit.children.length > 0) {
      setPath(prev => [...prev, unit]);
      setSelected(null);
    }
  };

  const drillUp = () => {
    setPath(prev => prev.slice(0, -1));
    setSelected(null);
  };

  const drillTo = (depth: number) => {
    if (depth < 0) {
      setPath([]);
    } else {
      setPath(prev => prev.slice(0, depth + 1));
    }
    setSelected(null);
  };

  return {
    currentItems,
    breadcrumbs,
    selected,
    drillDown,
    drillUp,
    drillTo,
    setSelected,
    isAtRoot: path.length === 0,
  };
}

