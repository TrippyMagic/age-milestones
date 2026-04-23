// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Landing from "../pages/Landing";
import Settings from "../pages/Settings";
import { BirthDateProvider } from "../context/BirthDateContext";
import { UserProfileProvider } from "../context/UserProfileContext";

const formatLocalDate = (date: Date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);

function renderApp(initialEntry: "/" | "/settings" = "/settings") {
  return render(
    <BirthDateProvider>
      <UserProfileProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/milestones" element={<div>Milestones route</div>} />
            <Route path="/timescales" element={<div>Timescales route</div>} />
            <Route path="/about" element={<div>About route</div>} />
          </Routes>
        </MemoryRouter>
      </UserProfileProvider>
    </BirthDateProvider>,
  );
}

describe("Settings + shared DOB flow slice 4", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("blocks navbar-brand navigation away from Settings when no birth date is saved", () => {
    renderApp("/settings");

    fireEvent.click(screen.getByLabelText(/go to landing page/i));

    expect(screen.getByText(/you still need a birth date/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /settings/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /explore/i })).toBeNull();
  });

  it("stores the shared birth date and shows the synced picker summary in Settings", () => {
    renderApp("/settings");

    const dateInput = screen.getByLabelText(/date of birth/i) as HTMLInputElement;
    const timeInput = screen.getByLabelText(/time.*optional/i) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: /save settings/i }) as HTMLButtonElement;

    expect(dateInput.max).toBe(formatLocalDate(new Date()));
    expect(saveButton.disabled).toBe(true);

    fireEvent.change(dateInput, { target: { value: "1994-06-12" } });
    fireEvent.change(timeInput, { target: { value: "08:30" } });

    expect(localStorage.getItem("dob")).not.toBeNull();
    expect(localStorage.getItem("dobTime")).toBe("08:30");
    expect(screen.getByText(/saved birth date:/i)).toBeTruthy();
    expect(screen.getByText(/08:30/)).toBeTruthy();
    expect(saveButton.disabled).toBe(false);
  });

  it("reuses the saved picker state on Landing and clears it consistently", () => {
    localStorage.setItem("dob", new Date(1994, 5, 12).toISOString());
    localStorage.setItem("dobTime", "06:45");

    renderApp("/");

    expect(screen.getByText(/saved birth date:/i)).toBeTruthy();
    expect(screen.getByText(/06:45/)).toBeTruthy();

    const exploreButton = screen.getByRole("button", { name: /explore/i }) as HTMLButtonElement;
    expect(exploreButton.disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /clear birth date/i }));

    expect(localStorage.getItem("dob")).toBeNull();
    expect(localStorage.getItem("dobTime")).toBeNull();
    expect(screen.queryByText(/saved birth date:/i)).toBeNull();
    expect((screen.getByRole("button", { name: /explore/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});


