/**
 * src/hooks/useTimescalePhenomena.ts
 * Fetches and caches timescale phenomena from /data/timescale-phenomena.json.
 * Same module-level cache pattern as useHistoricalEvents.
 */
import { useEffect, useRef, useState } from "react";
import type { TimescalePhenomenon } from "../types/phenomena";

type Status = "idle" | "loading" | "success" | "error";

type UseTimescalePhenomenaResult = {
  phenomena: TimescalePhenomenon[];
  status: Status;
  error: string | null;
};

let _cache: TimescalePhenomenon[] | null = null;

export function useTimescalePhenomena(): UseTimescalePhenomenaResult {
  const [phenomena, setPhenomena] = useState<TimescalePhenomenon[]>(_cache ?? []);
  const [status, setStatus]       = useState<Status>(_cache ? "success" : "idle");
  const [error, setError]         = useState<string | null>(null);
  const fetchedRef                 = useRef(false);

  useEffect(() => {
    if (_cache || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    setStatus("loading");

    fetch("/data/timescale-phenomena.json")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load phenomena: HTTP ${res.status}`);
        return res.json() as Promise<TimescalePhenomenon[]>;
      })
      .then(data => {
        if (cancelled) return;
        _cache = data;
        setPhenomena(data);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useTimescalePhenomena]", msg);
        setError(msg);
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, []);

  return { phenomena, status, error };
}

