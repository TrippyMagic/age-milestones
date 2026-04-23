// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Timescales from "../pages/Timescales";
import type { TimescalePhenomenon } from "../types/phenomena";

const mockSetTimescalesTab = vi.fn();
const mockUsePreferences = vi.fn();
const mockUseTimescalePhenomena = vi.fn();

vi.mock("../context/PreferencesContext", () => ({
  usePreferences: () => mockUsePreferences(),
}));

vi.mock("../hooks/useTimescalePhenomena", () => ({
  useTimescalePhenomena: () => mockUseTimescalePhenomena(),
}));

vi.mock("../hooks/useElementSize", () => ({
  useElementSize: () => [() => undefined, { width: 720, height: 720 }],
}));

vi.mock("../components/common/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("../components/common/Headers", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

vi.mock("../components/timescales/PhenomenaComparator", () => ({
  PhenomenaComparator: () => <div>Comparator stub</div>,
}));

vi.mock("../components/timescales/GeoCosmicExplorer", () => ({
  GeoCosmicExplorer: () => <div>Explorer stub</div>,
}));

const basePhenomena: TimescalePhenomenon[] = [
  {
    id: "quantum-foam",
    label: "Quantum foam burst",
    durationSeconds: 1e-34,
    category: "quantum",
    description: "Short-lived fluctuation near the Planck frontier.",
    examples: ["Vacuum jitter"],
  },
  {
    id: "cell-cycle",
    label: "Cell division",
    durationSeconds: 3_600,
    category: "biological",
    description: "Typical biological cycle duration.",
    examples: ["Mitosis"],
  },
  {
    id: "ice-age",
    label: "Ice age pulse",
    durationSeconds: 1e12,
    category: "geological",
    description: "A geological-scale climatic rhythm.",
    examples: ["Glacial advance"],
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <Timescales />
    </MemoryRouter>,
  );
}

describe("Timescales overview slice 1", () => {
  beforeEach(() => {
    mockSetTimescalesTab.mockReset();
    mockUsePreferences.mockImplementation(() => ({
      timescalesTab: "overview",
      setTimescalesTab: mockSetTimescalesTab,
    }));
    mockUseTimescalePhenomena.mockImplementation(() => ({
      phenomena: basePhenomena,
      status: "success",
      error: null,
    }));
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a live summary for overview filters and lets the user reset them", () => {
    renderPage();

    expect(screen.getByText("3 phenomena shown across 5 active categories.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quantum" }));

    expect(screen.getByText("2 phenomena shown across 4 active categories.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    expect(screen.getByText("3 phenomena shown across 5 active categories.")).toBeTruthy();
  });

  it("pins a phenomenon detail panel from overview interactions for touch and keyboard-safe fallback", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /quantum foam burst/i }));

    expect(
      screen.getByRole("region", { name: /phenomenon details: quantum foam burst/i }),
    ).toBeTruthy();
    expect(screen.getByText("Short-lived fluctuation near the Planck frontier.")).toBeTruthy();
    expect(screen.getByText("Vacuum jitter")).toBeTruthy();
  });

  it("cleans up pinned overview selection when filters hide the selected phenomenon", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /quantum foam burst/i }));

    expect(
      screen.getByRole("region", { name: /phenomenon details: quantum foam burst/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quantum" }));

    expect(screen.getByText("2 phenomena shown across 4 active categories.")).toBeTruthy();
    expect(
      screen.queryByRole("region", { name: /phenomenon details: quantum foam burst/i }),
    ).toBeNull();
  });

  it("surfaces a loading note while the overview data is still being prepared", () => {
    mockUseTimescalePhenomena.mockImplementation(() => ({
      phenomena: [],
      status: "loading",
      error: null,
    }));

    renderPage();

    expect(
      screen.getByText(/loading the overview ruler and preparing the visible phenomena list/i),
    ).toBeTruthy();
  });

  it("surfaces an explicit error note when timescale phenomena fail to load", () => {
    mockUseTimescalePhenomena.mockImplementation(() => ({
      phenomena: [],
      status: "error",
      error: "network offline",
    }));

    renderPage();

    expect(screen.getByText(/could not load timescale phenomena: network offline/i)).toBeTruthy();
   });
 });


