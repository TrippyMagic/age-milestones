/**
 * src/hooks/useProjectedEvents.ts
 * Fetches and caches future projections from /data/projected-events.json.
 * Converts raw date strings to Unix timestamps (ms) once on load.
 */
import { useEffect, useRef, useState } from "react";
import {
  parseProjectedEvents,
  type ProjectedEventRaw,
  type ProjectedEventParsed,
} from "../types/events";

type Status = "idle" | "loading" | "success" | "error";

type UseProjectedEventsResult = {
  events: ProjectedEventParsed[];
  status: Status;
  error: string | null;
};

let _cache: ProjectedEventParsed[] | null = null;

export function useProjectedEvents(): UseProjectedEventsResult {
  const [events, setEvents] = useState<ProjectedEventParsed[]>(_cache ?? []);
  const [status, setStatus] = useState<Status>(_cache ? "success" : "idle");
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (_cache || fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    setStatus("loading");

    fetch("/data/projected-events.json")
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load projected events: HTTP ${res.status}`);
        return res.json() as Promise<ProjectedEventRaw[]>;
      })
      .then(raw => {
        if (cancelled) return;
        const parsed = parseProjectedEvents(raw);
        _cache = parsed;
        setEvents(parsed);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[useProjectedEvents]", msg);
        setError(msg);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, status, error };
}

