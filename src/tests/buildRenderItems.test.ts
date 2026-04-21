import { describe, expect, it } from "vitest";

import { buildRenderItems } from "../components/timeline/buildRenderItems";
import type { TimelineEvent } from "../components/Timeline";
import type { Range } from "../utils/scaleTransform";

const makeEvent = (id: string, value: number): TimelineEvent => ({
  id,
  label: id,
  value,
  lane: "personal",
});

describe("buildRenderItems", () => {
  it("keeps nearby events separate at high zoom unless they truly collide", () => {
    const range: Range = {
      start: new Date("2024-01-01").getTime(),
      end: new Date("2024-01-31").getTime(),
    };

    const items = buildRenderItems(
      [
        makeEvent("a", new Date("2024-01-10").getTime()),
        makeEvent("b", new Date("2024-01-11").getTime()),
      ],
      range,
      1000,
      "linear",
    );

    expect(items).toHaveLength(2);
    expect(items.every(item => item.type === "single")).toBe(true);
  });

  it("groups collisions conservatively at low zoom", () => {
    const range: Range = {
      start: new Date("1900-01-01").getTime(),
      end: new Date("2100-01-01").getTime(),
    };

    const items = buildRenderItems(
      [
        makeEvent("a", new Date("2000-01-10").getTime()),
        makeEvent("b", new Date("2000-01-11").getTime()),
      ],
      range,
      500,
      "linear",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.type).toBe("group");
  });

  it("does not group events that are merely clamped outside the visible range", () => {
    const range: Range = {
      start: new Date("2000-01-01").getTime(),
      end: new Date("2001-01-01").getTime(),
    };

    const items = buildRenderItems(
      [
        makeEvent("old-a", new Date("1980-01-01").getTime()),
        makeEvent("old-b", new Date("1985-01-01").getTime()),
      ],
      range,
      800,
      "linear",
    );

    expect(items).toHaveLength(2);
    expect(items.every(item => item.type === "single")).toBe(true);
  });

  it("still groups exact overlaps when measured axis is available", () => {
    const range: Range = {
      start: new Date("2020-01-01").getTime(),
      end: new Date("2030-01-01").getTime(),
    };

    const items = buildRenderItems(
      [
        makeEvent("same-a", new Date("2025-01-01").getTime()),
        makeEvent("same-b", new Date("2025-01-01").getTime()),
      ],
      range,
      900,
      "linear",
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.type).toBe("group");
  });
});


