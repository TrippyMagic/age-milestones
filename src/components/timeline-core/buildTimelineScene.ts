import {
  clamp,
  generateTicks,
  toPercent,
  valueToRatio,
  type Range,
  type TimelineTick,
} from "../../utils/scaleTransform";
import {
  ALL_TIMELINE_LANES,
  LANE_META,
  type RenderItem,
  type TimelineEvent,
  type TimelineLane,
} from "../timeline/types";
import { buildRenderItems } from "./buildRenderItems";
import {
  buildTimelineInteractiveTargets,
  type TimelineInteractiveTarget,
} from "./interaction";

export const TIMELINE_LANE_ORDER: TimelineLane[] = [...ALL_TIMELINE_LANES];

const DEFAULT_LANE_TOP_PERCENT = 30;
const LANE_VERTICAL_STEP_PERCENT = 28;

export const getTimelineLaneTopPercent = (laneIndex: number): number =>
  DEFAULT_LANE_TOP_PERCENT + laneIndex * LANE_VERTICAL_STEP_PERCENT;

export type TimelineSceneLane = {
  lane: TimelineLane;
  label: string;
  topPercent: number;
  items: RenderItem[];
  interactiveTargets: TimelineInteractiveTarget[];
};

export type TimelineSceneTick = TimelineTick & {
  leftPercent: number;
};

export type TimelineScene = {
  range: Range;
  focusValue: number;
  focusRatio: number;
  focusLeftPercent: number;
  ticks: TimelineSceneTick[];
  lanes: TimelineSceneLane[];
};

export type BuildTimelineSceneOptions = {
  events: TimelineEvent[];
  range: Range;
  axisWidth: number;
  focusValue: number;
  laneOrder?: TimelineLane[];
};

const sanitizeLaneOrder = (laneOrder?: TimelineLane[]): TimelineLane[] => {
  if (!laneOrder?.length) return TIMELINE_LANE_ORDER;

  const next: TimelineLane[] = [];
  for (const lane of laneOrder) {
    if (!ALL_TIMELINE_LANES.includes(lane) || next.includes(lane)) continue;
    next.push(lane);
  }

  return next.length > 0 ? next : TIMELINE_LANE_ORDER;
};

export const buildTimelineScene = ({
  events,
  range,
  axisWidth,
  focusValue,
  laneOrder,
}: BuildTimelineSceneOptions): TimelineScene => {
  const lanes = sanitizeLaneOrder(laneOrder);
  const sortedEvents = events.slice().sort((a, b) => a.value - b.value);
  const safeFocusValue = clamp(focusValue, range.start, range.end);
  const focusRatio = valueToRatio(safeFocusValue, range);

  return {
    range,
    focusValue: safeFocusValue,
    focusRatio,
    focusLeftPercent: toPercent(focusRatio),
    ticks: generateTicks(range).map(tick => ({
      ...tick,
      leftPercent: toPercent(valueToRatio(tick.value, range)),
    })),
    lanes: lanes.map((lane, index) => {
      const topPercent = getTimelineLaneTopPercent(index);
      const items = buildRenderItems(
        sortedEvents.filter(event => (event.lane ?? "personal") === lane),
        range,
        axisWidth,
      );

      return {
        lane,
        label: LANE_META[lane].label,
        topPercent,
        items,
        interactiveTargets: buildTimelineInteractiveTargets({ lane, topPercent, items }),
      };
    }),
  };
};



