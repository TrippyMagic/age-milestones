// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { PhenomenaComparator } from "../components/timescales/PhenomenaComparator";
import type { TimescalePhenomenon } from "../types/phenomena";

const samplePhenomena: TimescalePhenomenon[] = [
  {
    id: "quantum-foam",
    label: "Quantum foam burst",
    durationSeconds: 1e-34,
    category: "quantum",
    description: "Short-lived fluctuation near the Planck frontier.",
  },
  {
    id: "cell-cycle",
    label: "Cell division",
    durationSeconds: 3_600,
    category: "biological",
    description: "Typical biological cycle duration.",
  },
  {
    id: "sleep-cycle",
    label: "Human sleep cycle",
    durationSeconds: 28_800,
    category: "human",
    description: "A nightly human rhythm.",
  },
  {
    id: "ice-age",
    label: "Ice age pulse",
    durationSeconds: 1e12,
    category: "geological",
    description: "A geological-scale climatic rhythm.",
  },
];

function renderComparator() {
  return render(<PhenomenaComparator phenomena={samplePhenomena} status="success" />);
}

function selectWithKeyboard(input: HTMLElement, query: string) {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  act(() => {
    vi.advanceTimersByTime(220);
  });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("PhenomenaComparator slice 3", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("supports keyboard-driven combobox selection and Escape closes the dropdown", () => {
    renderComparator();

    const inputA = screen.getByRole("combobox", { name: /search phenomenon a/i });

    selectWithKeyboard(inputA, "quantum");

    expect((inputA as HTMLInputElement).value).toBe("Quantum foam burst");
    expect(inputA.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText(/choose two different phenomena to unlock the ratio/i)).toBeTruthy();

    fireEvent.focus(inputA);
    expect(screen.getByRole("listbox", { name: /search phenomenon a results/i })).toBeTruthy();

    fireEvent.keyDown(inputA, { key: "Escape" });

    expect(inputA.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox", { name: /search phenomenon a results/i })).toBeNull();
  });

  it("hides the other slot selection and surfaces an explicit empty state instead of allowing duplicates", () => {
    renderComparator();

    const inputA = screen.getByRole("combobox", { name: /search phenomenon a/i });
    const inputB = screen.getByRole("combobox", { name: /search phenomenon b/i });

    selectWithKeyboard(inputA, "quantum");

    fireEvent.focus(inputB);
    const listboxB = screen.getByRole("listbox", { name: /search phenomenon b results/i });
    expect(within(listboxB).queryByText("Quantum foam burst")).toBeNull();

    fireEvent.change(inputB, { target: { value: "quantum" } });
    act(() => {
      vi.advanceTimersByTime(220);
    });

    expect(screen.getByText(/no matching phenomena available for this slot/i)).toBeTruthy();
    expect(
      screen.getByText(/already selected in the other slot: quantum foam burst/i),
    ).toBeTruthy();
  });

  it("compares two distinct phenomena and announces the active comparison state", () => {
    renderComparator();

    const inputA = screen.getByRole("combobox", { name: /search phenomenon a/i });
    const inputB = screen.getByRole("combobox", { name: /search phenomenon b/i });

    selectWithKeyboard(inputA, "quantum");
    selectWithKeyboard(inputB, "ice age");

    expect(screen.getByText(/comparing quantum foam burst and ice age pulse/i)).toBeTruthy();
    expect(screen.getByText(/longer than/i)).toBeTruthy();
    expect(screen.getByText(/position on the absolute timescale/i)).toBeTruthy();
  });

  it("renders comparison bars in slot order with widths consistent with the shared absolute-log scale", () => {
    const { container } = renderComparator();

    const inputA = screen.getByRole("combobox", { name: /search phenomenon a/i });
    const inputB = screen.getByRole("combobox", { name: /search phenomenon b/i });

    selectWithKeyboard(inputA, "quantum");
    selectWithKeyboard(inputB, "ice age");

    const rows = Array.from(container.querySelectorAll<HTMLElement>(".ts-comparator__bar-row"));
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("A")).toBeTruthy();
    expect(within(rows[1]!).getByText("B")).toBeTruthy();

    const widths = rows.map(row => Number.parseFloat(
      row.querySelector<HTMLElement>(".ts-comparator__bar-fill")?.style.width ?? "0",
    ));

    expect(widths[0]).toBeGreaterThan(0);
    expect(widths[1]).toBeGreaterThan(widths[0]);
    expect(widths[1]).toBeLessThanOrEqual(100);
  });
});


