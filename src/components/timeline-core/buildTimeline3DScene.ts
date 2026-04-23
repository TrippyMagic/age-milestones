import {
  clamp,
  generateTicks,
  type Range,
  type TimelineTick,
} from "../../utils/scaleTransform";
import {
  LANE_META,
  type TimelineEvent,
  type TimelineLane,
} from "../timeline/types";
import { TIMELINE_LANE_ORDER } from "./buildTimelineScene";

export const TIMELINE_3D_AXIS_MIN_X = -10;
export const TIMELINE_3D_AXIS_MAX_X = 10;
export const TIMELINE_3D_LANE_OFFSET_Y = 0.5;
export const TIMELINE_3D_LANE_Y: Record<TimelineLane, number> = {
  personal: 1.85,
  global: -1.85,
};

export type Timeline3DSceneLane = {
  lane: TimelineLane;
  label: string;
  axisY: number;
};

export type Timeline3DSceneTick = TimelineTick & {
  x: number;
};

export type Timeline3DSceneMarker = {
  id: string;
  event: TimelineEvent;
  lane: TimelineLane;
  x: number;
  axisY: number;
  y: number;
  isPersonal: boolean;
  isProjection: boolean;
};

export type Timeline3DScene = {
  range: Range;
  focusValue: number;
  focusX: number;
  lanes: Timeline3DSceneLane[];
  ticks: Timeline3DSceneTick[];
  markers: Timeline3DSceneMarker[];
};

export type BuildTimeline3DSceneOptions = {
  events: TimelineEvent[];
  range: Range;
  focusValue: number;
  maxTickCount?: number;
};

const normalizeTimeline3DLane = (event: TimelineEvent): TimelineLane =>
  (event.lane ?? "personal") === "global" ? "global" : "personal";

export const toTimeline3DX = (value: number, range: Range): number => {
  if (range.end <= range.start) return 0;

  const ratio = clamp((value - range.start) / (range.end - range.start), 0, 1);
  return TIMELINE_3D_AXIS_MIN_X + ratio * (TIMELINE_3D_AXIS_MAX_X - TIMELINE_3D_AXIS_MIN_X);
};

const buildTimeline3DTicks = (range: Range, maxTickCount: number): Timeline3DSceneTick[] => {
  const ticks = generateTicks(range, "linear");
  if (ticks.length === 0) return [];

  const safeMaxTickCount = Math.max(1, Math.floor(maxTickCount));
  const visibleTicks = ticks.length <= safeMaxTickCount
    ? ticks
    : ticks.filter((_, index) => {
      const step = Math.ceil(ticks.length / safeMaxTickCount);
      return index % step === 0 || index === ticks.length - 1;
    });

  return visibleTicks.map(tick => ({
    ...tick,
    x: toTimeline3DX(tick.value, range),
  }));
};

export const buildTimeline3DScene = ({
  events,
  range,
  focusValue,
  maxTickCount = 10,
}: BuildTimeline3DSceneOptions): Timeline3DScene => {
  const safeFocusValue = range.end > range.start
    ? clamp(focusValue, range.start, range.end)
    : range.start;

  const lanes = TIMELINE_LANE_ORDER.map(lane => ({
    lane,
    label: LANE_META[lane].label,
    axisY: TIMELINE_3D_LANE_Y[lane],
  }));

  const markers = events
    .slice()
    .sort((a, b) => a.value - b.value)
    .map(event => {
      const lane = normalizeTimeline3DLane(event);
      const axisY = TIMELINE_3D_LANE_Y[lane];
      const y = axisY + (event.placement === "below" ? -TIMELINE_3D_LANE_OFFSET_Y : TIMELINE_3D_LANE_OFFSET_Y);

      return {
        id: event.id,
        event,
        lane,
        x: toTimeline3DX(event.value, range),
        axisY,
        y,
        isPersonal: lane === "personal",
        isProjection: event.semanticKind === "projection",
      } satisfies Timeline3DSceneMarker;
    });

  return {
    range,
    focusValue: safeFocusValue,
    focusX: toTimeline3DX(safeFocusValue, range),
    lanes,
    ticks: buildTimeline3DTicks(range, maxTickCount),
    markers,
  };
};

