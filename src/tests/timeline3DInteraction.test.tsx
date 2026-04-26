// @vitest-environment jsdom
import type { HTMLAttributes, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import type { TimelineEvent } from "../components/Timeline";
import { Timeline3DWrapper } from "../components/3d/Timeline3DWrapper";

let mockMediaQuery: (query: string) => boolean = () => false;

vi.mock("../hooks/useMediaQuery", () => ({
  useMediaQuery: (query: string) => mockMediaQuery(query),
}));

vi.mock("../utils/webgl", () => ({
  WEB_GL_SUPPORTED: true,
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

const apolloEventValue = new Date("1969-07-20T20:17:00Z").getTime();

vi.mock("../components/3d/Timeline3D", () => ({
  default: ({
    selectedSelectionKey,
    onSelectMarker,
  }: {
    selectedSelectionKey: string | null;
    onSelectMarker: (selectionKey: string, focusValue: number) => void;
  }) => (
    <div data-testid="timeline3d-mock">
      <span data-testid="selected-key">{selectedSelectionKey ?? "none"}</span>
      <button
        type="button"
        onClick={() => onSelectMarker("apollo-11", apolloEventValue)}
      >
        Select Apollo
      </button>
    </div>
  ),
}));

const apolloEvent: TimelineEvent = {
  id: "apollo-11",
  label: "Apollo 11",
  value: apolloEventValue,
  lane: "global",
  semanticKind: "event",
  category: "space",
  subLabel: "First crewed Moon landing.",
};

const baseProps = {
  events: [apolloEvent],
  range: { start: apolloEventValue - 1_000, end: apolloEventValue + 1_000 },
  focusValue: apolloEventValue,
  onExitTo2D: vi.fn(),
  onFocusValueChange: vi.fn(),
};

afterEach(() => {
  cleanup();
  mockMediaQuery = () => false;
  vi.clearAllMocks();
});

describe("Timeline3D interaction bridge", () => {
  it("opens the shared detail inspector and syncs focus when a 3D marker is selected", async () => {
    render(<Timeline3DWrapper {...baseProps} />);

    expect(screen.getByText(/click or tap a marker to inspect it below/i)).toBeTruthy();

    fireEvent.click(await screen.findByRole("button", { name: /select apollo/i }));

    expect(baseProps.onFocusValueChange).toHaveBeenCalledWith(apolloEventValue);
    expect(screen.getByTestId("selected-key").textContent).toBe("apollo-11");

    const dialog = screen.getByRole("dialog", { name: /event details/i });
    expect(within(dialog).getByText("Apollo 11")).toBeTruthy();
    expect(within(dialog).getByText(/first crewed moon landing/i)).toBeTruthy();
  });

  it("clears stale inspector state when the selected event leaves the visible 3D dataset", async () => {
    const { rerender } = render(<Timeline3DWrapper {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /select apollo/i }));
    expect(screen.getByRole("dialog", { name: /event details/i })).toBeTruthy();

    rerender(
      <Timeline3DWrapper
        {...baseProps}
        events={[]}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /event details/i })).toBeNull();
      expect(screen.getByTestId("selected-key").textContent).toBe("none");
    });
  });
});



