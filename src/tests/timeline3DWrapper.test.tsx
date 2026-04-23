// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

let mockWebGLSupported = true;
let mockMediaQuery: (query: string) => boolean = () => false;

vi.mock("../hooks/useMediaQuery", () => ({
  useMediaQuery: (query: string) => mockMediaQuery(query),
}));

vi.mock("../utils/webgl", () => ({
  get WEB_GL_SUPPORTED() {
    return mockWebGLSupported;
  },
}));

vi.mock("../components/3d/Timeline3D", () => ({
  default: ({ qualityProfile }: { qualityProfile: string }) => (
    <div data-testid="timeline3d-mock">{qualityProfile}</div>
  ),
}));

import { Timeline3DWrapper } from "../components/3d/Timeline3DWrapper";

const baseProps = {
  events: [],
  range: { start: 0, end: 10 },
  focusValue: 5,
  onExitTo2D: vi.fn(),
};

afterEach(() => {
  cleanup();
  mockWebGLSupported = true;
  mockMediaQuery = () => false;
});

describe("Timeline3DWrapper", () => {
  it("passes the resolved low-power profile to the lazy 3D scene when mobile constraints are active", async () => {
    mockMediaQuery = (query: string) => query === "(max-width:719px)";

    render(<Timeline3DWrapper {...baseProps} />);

    expect((await screen.findByTestId("timeline3d-mock")).textContent).toBe("low-power");
  });

  it("renders the explicit WebGL fallback when 3D is unavailable", () => {
    mockWebGLSupported = false;

    render(<Timeline3DWrapper {...baseProps} />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/webgl is not available in this browser/i)).toBeTruthy();
  });
});




