/**
 * src/hooks/useHistoricalEvents.ts
 * Fetches and caches historical events from /data/historical-events.json.
 * Converts raw date strings to Unix timestamps (ms) once on load.
 */
import { useEffect, useRef, useState } from "react";
import type { HistoricalEventRaw, HistoricalEventParsed } from "../types/events";

type Status = "idle" | "loading" | "success" | "error";

type UseHistoricalEventsResult = {
  events: HistoricalEventParsed[];
  status: Status;
  error: string | null;
};

/** Module-level cache so the JSON is fetched only once per session */
let _cache: HistoricalEventParsed[] | null = null;

const parseEvents = (raw: HistoricalEventRaw[]): HistoricalEventParsed[] =>
  raw.map(({ date, ...rest }) => ({
    ...rest,
    timestamp: new Date(date).getTime(),
  }));

export function useHistoricalEvents(): UseHistoricalEventsResult {
  const [events, setEvents]   = useState<HistoricalEventParsed[]>(_cache ?? []);
  const [status, setStatus]   = useState<Status>(_cache ? "success" : "idle");
  const [error,  setError]    = useState<string | null>(null);
  const fetchedRef             = useRef(false);

  useEffect(() => {
    // Already cached or already fetching
    if (_cache || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    setStatus("loading");

    fetch("/data/historical-events.json")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load events: HTTP ${res.status}`);
        return res.json() as Promise<HistoricalEventRaw[]>;
      })
      .then(raw => {
        if (cancelled) return;
        const parsed = parseEvents(raw);
        _cache = parsed;
        setEvents(parsed);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useHistoricalEvents]", msg);
        setError(msg);
        setStatus("error");
      });

    return () => { cancelled = true; };
  }, []);

  return { events, status, error };
}

