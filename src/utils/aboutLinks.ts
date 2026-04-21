export const ABOUT_SECTION_ORDER = ["general", "timeline", "timescales", "settings"] as const;

export type AboutSectionId = (typeof ABOUT_SECTION_ORDER)[number];

export const ABOUT_SECTION_LABELS: Record<AboutSectionId, string> = {
  general: "General concept",
  timeline: "Timeline system",
  timescales: "Timescales system",
  settings: "Settings system",
};

export const getAboutSectionHref = (sectionId: AboutSectionId) => `/about#${sectionId}`;

export const isAboutSectionId = (value: string): value is AboutSectionId =>
  ABOUT_SECTION_ORDER.includes(value as AboutSectionId);

