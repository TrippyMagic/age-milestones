import { describe, expect, it } from "vitest";

import { normalizeTimelineLanes } from "../components/timeline/types";
import { parseHistoricalEvents, parseProjectedEvents } from "../types/events";

describe("timeline event parsing", () => {
  it("marks historical records as historical datasets with timestamps", () => {
    const events = parseHistoricalEvents([
      {
        id: "moon-landing",
        label: "Moon landing",
        date: "1969-07-20",
        category: "space",
        description: "Apollo 11 lands on the Moon.",
        placement: "above",
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]?.dataset).toBe("historical");
    expect(events[0]?.timestamp).toBe(new Date("1969-07-20").getTime());
  });

  it("marks projected records as projected datasets with projection metadata", () => {
    const events = parseProjectedEvents([
      {
        id: "apophis-flyby",
        label: "Apophis close Earth flyby",
        date: "2029-04-13",
        category: "space",
        description: "Projected close flyby.",
        placement: "below",
        projectionType: "astronomical",
        certainty: "high",
      },
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]?.dataset).toBe("projected");
    expect(events[0]?.projectionType).toBe("astronomical");
    expect(events[0]?.certainty).toBe("high");
  });
});

describe("normalizeTimelineLanes", () => {
  it("maps legacy historical and markers lanes to the new global lane", () => {
    expect(normalizeTimelineLanes(["personal", "historical", "markers"])).toEqual([
      "personal",
      "global",
    ]);
  });

  it("falls back to all lanes when saved data is empty or invalid", () => {
    expect(normalizeTimelineLanes([])).toEqual(["personal", "global"]);
    expect(normalizeTimelineLanes("oops")).toEqual(["personal", "global"]);
  });
});

