/**
 * src/components/Timeline.tsx
 * Backward-compatibility re-export.
 * Uses explicit sub-paths to avoid case-sensitivity ambiguity on Windows
 * between this file (Timeline.tsx) and the timeline/ folder.
 */
export { default } from "./timeline/Timeline";
export type { TimelineEvent, TimelineTick } from "./timeline/types";
export type { Range } from "../utils/scaleTransform";
