import { describe, expect, it } from "vitest";

import {
  ABOUT_SECTION_LABELS,
  ABOUT_SECTION_ORDER,
  getAboutSectionHref,
  isAboutSectionId,
} from "../utils/aboutLinks";

describe("aboutLinks", () => {
  it("builds stable about section hrefs", () => {
    expect(getAboutSectionHref("general")).toBe("/about#general");
    expect(getAboutSectionHref("timeline")).toBe("/about#timeline");
    expect(getAboutSectionHref("timescales")).toBe("/about#timescales");
    expect(getAboutSectionHref("settings")).toBe("/about#settings");
  });

  it("exposes all canonical FAQ sections in order", () => {
    expect(ABOUT_SECTION_ORDER).toEqual(["general", "timeline", "timescales", "settings"]);
    expect(Object.keys(ABOUT_SECTION_LABELS)).toEqual(ABOUT_SECTION_ORDER);
  });

  it("recognizes only valid about section ids", () => {
    expect(isAboutSectionId("general")).toBe(true);
    expect(isAboutSectionId("timeline")).toBe(true);
    expect(isAboutSectionId("foo")).toBe(false);
    expect(isAboutSectionId("")).toBe(false);
  });
});

