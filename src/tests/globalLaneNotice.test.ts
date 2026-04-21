import { describe, expect, it } from "vitest";

import { resolveGlobalLaneNotice } from "../utils/globalLaneNotice";

describe("resolveGlobalLaneNotice", () => {
  it("does not show any notice when global items are present", () => {
    expect(
      resolveGlobalLaneNotice({
        historicalStatus: "success",
        projectedStatus: "success",
        noGlobalItems: false,
      }),
    ).toBeNull();
  });

  it("reports loading while either global dataset is still pending", () => {
    expect(
      resolveGlobalLaneNotice({
        historicalStatus: "loading",
        projectedStatus: "success",
        noGlobalItems: true,
      }),
    ).toBe("loading");

    expect(
      resolveGlobalLaneNotice({
        historicalStatus: "idle",
        projectedStatus: "error",
        noGlobalItems: true,
      }),
    ).toBe("loading");
  });

  it("reports error after loading has settled and a dataset failed", () => {
    expect(
      resolveGlobalLaneNotice({
        historicalStatus: "error",
        projectedStatus: "success",
        noGlobalItems: true,
      }),
    ).toBe("error");
  });

  it("reports empty only when both datasets are settled and no global items match", () => {
    expect(
      resolveGlobalLaneNotice({
        historicalStatus: "success",
        projectedStatus: "success",
        noGlobalItems: true,
      }),
    ).toBe("empty");
  });
});

