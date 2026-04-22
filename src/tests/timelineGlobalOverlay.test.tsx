// @vitest-environment jsdom
import type { HTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import Timeline from "../components/timeline/Timeline";
import type { TimelineEvent } from "../components/Timeline";
import type { Range } from "../utils/scaleTransform";

vi.mock("../hooks/useElementSize", () => ({
  useElementSize: () => [() => undefined, { width: 960, height: 360 }],
}));

vi.mock("../hooks/usePinchZoom", () => ({
  usePinchZoom: () => ({ showPinchHint: false }),
}));

vi.mock("../hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    aside: ({ children, ...props }: HTMLAttributes<HTMLElement> & {
      drag?: unknown;
      dragConstraints?: unknown;
      dragElastic?: unknown;
    }) => {
      const nextProps = { ...props } as Record<string, unknown>;
      delete nextProps.drag;
      delete nextProps.dragConstraints;
      delete nextProps.dragElastic;
      return <aside {...(nextProps as HTMLAttributes<HTMLElement>)}>{children}</aside>;
    },
  },
}));

const range: Range = {
  start: new Date("2000-01-01").getTime(),
  end: new Date("2001-01-01").getTime(),
};

const makeGlobalEvent = (overrides: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id: "moon-landing",
  label: "Moon landing",
  value: new Date("2000-07-20").getTime(),
  lane: "global",
  semanticKind: "event",
  category: "space",
  subLabel: "Apollo 11 reaches the Moon.",
  ...overrides,
});

const makePersonalEvent = (overrides: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id: "mid-life",
  label: "Mid-life checkpoint",
  value: range.start + (range.end - range.start) / 2,
  lane: "personal",
  semanticKind: "personal",
  subLabel: "Shared overlay model milestone.",
  ...overrides,
});

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: vi.fn(() => ({
      setTransform: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("Timeline interactive overlay", () => {
  it("uses accessible overlay buttons for both lanes and opens the detail panel without DOM event markers", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Timeline
        range={range}
        value={new Date("2000-06-01").getTime()}
        onChange={onChange}
        events={[makePersonalEvent(), makeGlobalEvent()]}
      />,
    );

    expect(container.querySelectorAll(".timeline__event")).toHaveLength(0);

    const target = screen.getByRole("button", { name: /mid-life checkpoint/i });
    fireEvent.click(target);

    expect(onChange).not.toHaveBeenCalled();
    expect(target.getAttribute("aria-pressed")).toBe("true");
    const dialog = screen.getByRole("dialog", { name: /event details/i });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText("Mid-life checkpoint")).toBeTruthy();
  });

  it("supports keyboard activation for the shared overlay buttons", () => {
    render(
      <Timeline
        range={range}
        value={new Date("2000-06-01").getTime()}
        onChange={vi.fn()}
        events={[makeGlobalEvent({ id: "apollo", label: "Apollo" })]}
      />,
    );

    const target = screen.getByRole("button", { name: /apollo/i });
    fireEvent.keyDown(target, { key: "Enter" });

    const dialog = screen.getByRole("dialog", { name: /event details/i });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText("Apollo")).toBeTruthy();
  });

  it("activates personal targets through pointer hit-testing before falling back to bare-axis focus changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Timeline
        range={range}
        value={new Date("2000-06-01").getTime()}
        onChange={onChange}
        events={[makePersonalEvent()]}
      />,
    );

    const axis = container.querySelector(".timeline__axis") as HTMLDivElement;
    expect(axis).toBeTruthy();
    axis.getBoundingClientRect = () => ({
      width: 1000,
      height: 360,
      top: 0,
      left: 100,
      right: 1100,
      bottom: 360,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(axis, { isPrimary: true, pointerId: 1, clientX: 600, clientY: 108 });
    fireEvent.pointerUp(axis, { isPrimary: true, pointerId: 1, clientX: 600, clientY: 108 });

    expect(onChange).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: /event details/i });
    expect(within(dialog).getByText("Mid-life checkpoint")).toBeTruthy();
  });

  it("keeps bare-axis pointer selection working when no interactive target is hit", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Timeline
        range={range}
        value={new Date("2000-06-01").getTime()}
        onChange={onChange}
        events={[makeGlobalEvent()]}
      />,
    );

    const axis = container.querySelector(".timeline__axis") as HTMLDivElement;
    expect(axis).toBeTruthy();
    axis.getBoundingClientRect = () => ({
      width: 1000,
      height: 360,
      top: 0,
      left: 100,
      right: 1100,
      bottom: 360,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(axis, { isPrimary: true, pointerId: 1, clientX: 120, clientY: 20 });
    fireEvent.pointerUp(axis, { isPrimary: true, pointerId: 1, clientX: 120, clientY: 20 });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});





