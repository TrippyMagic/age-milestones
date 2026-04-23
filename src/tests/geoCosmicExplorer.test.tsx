// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { GeoCosmicExplorer } from "../components/timescales/GeoCosmicExplorer";
import type { GeoExplorerData } from "../types/geological";

const mockUseGeologicalEras = vi.fn();

vi.mock("../hooks/useGeologicalEras", () => ({
  useGeologicalEras: () => mockUseGeologicalEras(),
}));

const sampleData: GeoExplorerData = {
  geological: [
    {
      id: "archean",
      name: "Archean Eon",
      rank: "eon",
      startMya: 4000,
      endMya: 2500,
      color: "#f0a0a0",
      description: "The emergence of the earliest durable crust and microbial life.",
      keyEvents: ["Stromatolites emerge"],
      children: [
        {
          id: "eoarchean",
          name: "Eoarchean Era",
          rank: "era",
          startMya: 4000,
          endMya: 3600,
          color: "#f5c0c0",
          description: "Very early crust and oceans.",
        },
      ],
    },
    {
      id: "proterozoic",
      name: "Proterozoic Eon",
      rank: "eon",
      startMya: 2500,
      endMya: 541,
      color: "#f77f61",
      description: "Oxygenation and complex cells.",
    },
  ],
  cosmic: [
    {
      id: "big-bang",
      name: "Big Bang",
      timeAgoMya: 13800,
      description: "Observable universe begins expanding.",
      icon: "💥",
    },
    {
      id: "solar-system",
      name: "Solar System forms",
      timeAgoMya: 4600,
      description: "The Sun and planets coalesce from a protoplanetary disk.",
      icon: "☀️",
    },
    {
      id: "present-day",
      name: "Present day",
      timeAgoMya: 0,
      description: "The current cosmic moment.",
      icon: "🕰️",
    },
  ],
};

describe("GeoCosmicExplorer slice 2", () => {
  beforeEach(() => {
    mockUseGeologicalEras.mockImplementation(() => ({
      data: sampleData,
      status: "success",
      error: null,
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a loading skeleton while geological data is loading", () => {
    mockUseGeologicalEras.mockImplementation(() => ({
      data: null,
      status: "loading",
      error: null,
    }));

    const { container } = render(<GeoCosmicExplorer />);

    expect(container.querySelectorAll(".ts-loading__row").length).toBeGreaterThan(0);
  });

  it("shows an explicit error message when geological data fails to load", () => {
    mockUseGeologicalEras.mockImplementation(() => ({
      data: null,
      status: "error",
      error: "offline cache unavailable",
    }));

    render(<GeoCosmicExplorer />);

    expect(screen.getByText(/offline cache unavailable/i)).toBeTruthy();
  });

  it("toggles the geological detail panel and wires aria-expanded on the details control", () => {
    render(<GeoCosmicExplorer />);

    const detailsButton = screen.getAllByRole("button", { name: /show details/i })[0];
    fireEvent.click(detailsButton);

    expect(detailsButton.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("region", { name: /details: archean eon/i }),
    ).toBeTruthy();
    expect(screen.getByText(/the emergence of the earliest durable crust/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /close detail panel/i }));

    expect(screen.queryByRole("region", { name: /details: archean eon/i })).toBeNull();
  });

  it("supports explore, breadcrumb navigation and one-level back flow", () => {
    render(<GeoCosmicExplorer />);

    fireEvent.click(screen.getAllByRole("button", { name: /show details/i })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /explore sub-units inside archean eon/i }));

    expect(screen.getByText("Eoarchean Era")).toBeTruthy();
    expect(screen.queryByRole("region", { name: /details: archean eon/i })).toBeNull();
    expect(screen.getByRole("button", { name: /back one level/i })).toBeTruthy();
    expect(screen.getByText("Archean Eon", { selector: ".ts-explorer__summary-title" })).toBeTruthy();

    const breadcrumb = screen.getByRole("navigation", { name: /geological navigation/i });
    expect(within(breadcrumb).getByText("Archean Eon").getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByRole("button", { name: /all eons/i }));

    expect(screen.getByText("Proterozoic Eon")).toBeTruthy();
    expect(screen.getByText("All Eons", { selector: ".ts-explorer__summary-title" })).toBeTruthy();
  });

  it("switches to the cosmic tab and expands milestone details", () => {
    render(<GeoCosmicExplorer />);

    const cosmicTab = screen.getByRole("tab", { name: /cosmic/i });
    fireEvent.mouseDown(cosmicTab);
    fireEvent.click(cosmicTab);
    const cosmicButton = screen.getByRole("button", { name: /big bang/i });
    fireEvent.click(cosmicButton);

    expect(cosmicButton.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText(/observable universe begins expanding/i)).toBeTruthy();
  });

  it("normalizes cosmic milestone bars on the shared absolute-log scale", () => {
    const { container } = render(<GeoCosmicExplorer />);

    const cosmicTab = screen.getByRole("tab", { name: /cosmic/i });
    fireEvent.mouseDown(cosmicTab);
    fireEvent.click(cosmicTab);

    const items = Array.from(container.querySelectorAll<HTMLElement>(".ts-cosmic__item"));
    expect(items).toHaveLength(3);
    expect(within(items[0]!).getByText("Big Bang")).toBeTruthy();
    expect(within(items[1]!).getByText("Solar System forms")).toBeTruthy();
    expect(within(items[2]!).getByText("Present day")).toBeTruthy();

    const widths = Array.from(container.querySelectorAll<HTMLElement>(".ts-cosmic__bar-fill"))
      .map(node => Number.parseFloat(node.style.width || "0"));

    expect(widths).toHaveLength(3);
    expect(widths[0]).toBeGreaterThan(99.99);
    expect(widths[1]).toBeGreaterThan(0);
    expect(widths[1]).toBeLessThan(widths[0]);
    expect(widths[2]).toBe(0);
  });
});



