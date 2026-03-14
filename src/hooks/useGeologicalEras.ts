/**
 * src/hooks/useGeologicalEras.ts
 * Fetches and caches the geological/cosmic explorer data
 * from /data/geological-eras.json.
 * Same module-level cache pattern used throughout the project.
 */
import { useEffect, useRef, useState } from "react";
import type { GeoExplorerData } from "../types/geological";

type Status = "idle" | "loading" | "success" | "error";

export type UseGeologicalErasResult = {
  data: GeoExplorerData | null;
  status: Status;
  error: string | null;
};

let _cache: GeoExplorerData | null = null;

export function useGeologicalEras(): UseGeologicalErasResult {
  const [data, setData]     = useState<GeoExplorerData | null>(_cache);
  const [status, setStatus] = useState<Status>(_cache ? "success" : "idle");
  const [error, setError]   = useState<string | null>(null);
  const fetchedRef          = useRef(false);

  useEffect(() => {
    if (_cache || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    setStatus("loading");

    fetch("/data/geological-eras.json")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load geological data: HTTP ${res.status}`);
        return res.json() as Promise<GeoExplorerData>;
      })
      .then(d => {
        if (cancelled) return;
        _cache = d;
        setData(d);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useGeologicalEras]", msg);
        setError(msg);
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, []);

  return { data, status, error };
}

