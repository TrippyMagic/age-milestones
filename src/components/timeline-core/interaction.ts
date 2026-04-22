import {
  CATEGORY_META,
  PROJECTION_CERTAINTY_META,
  PROJECTION_TYPE_META,
} from "../../types/events";
import type {
  DetailPanelItem,
  RenderGroup,
  RenderItem,
  TimelineEvent,
  TimelineLane,
} from "../timeline/types";

export const TIMELINE_SINGLE_TARGET_SIZE_PX = 28;
export const TIMELINE_GROUP_TARGET_HEIGHT_PX = 32;

export type TimelineSelectionPayload = {
  selectionKey: string;
  detailItems: DetailPanelItem[];
};

export type TimelineInteractiveTarget = TimelineSelectionPayload & {
  id: string;
  lane: TimelineLane;
  kind: "single" | "group";
  leftPercent: number;
  topPercent: number;
  widthPx: number;
  heightPx: number;
  count: number;
  color: string;
  ariaLabel: string;
  title: string;
  grouping?: RenderGroup["grouping"];
};

export type BuildTimelineInteractiveTargetsOptions = {
  lane: TimelineLane;
  topPercent: number;
  items: RenderItem[];
};

export const toDetailPanelItem = (event: TimelineEvent): DetailPanelItem => ({
  id: event.id,
  label: event.label,
  subLabel: event.subLabel,
  value: event.value,
  category: event.category,
  semanticKind: event.semanticKind,
  temporalStatus: event.temporalStatus,
  projectionType: event.projectionType,
  certainty: event.certainty,
});

export const getTimelineSemanticLabel = (
  item: Pick<TimelineEvent, "semanticKind"> | Pick<DetailPanelItem, "semanticKind">,
): string => {
  switch (item.semanticKind) {
    case "projection":
      return "Future projection";
    case "event":
      return "Past event";
    case "marker":
      return "Global reference";
    default:
      return "Personal marker";
  }
};

export const getTimelineGroupVisualWidthPx = (count: number): number =>
  Math.max(24, Math.min(54, 20 + count * 5));

export const resolveTimelineItemColor = (item: RenderItem): string => {
  if (item.type === "single") {
    if (item.event.color) return item.event.color;
    if (item.event.category) return CATEGORY_META[item.event.category].color;
    if (item.event.semanticKind === "projection") return "#f59e0b";
    return "#a5b4fc";
  }

  const firstColoredEvent = item.events.find(event => event.color || event.category);
  if (firstColoredEvent?.color) return firstColoredEvent.color;
  if (firstColoredEvent?.category) return CATEGORY_META[firstColoredEvent.category].color;
  if (item.grouping === "edge-start" || item.grouping === "edge-end") return "#cbd5e1";
  return "#818cf8";
};

const describeSingleAriaLabel = (event: TimelineEvent): string => {
  const parts = [event.label, getTimelineSemanticLabel(event)];
  if (event.subLabel) parts.push(event.subLabel);
  if (event.category) parts.push(CATEGORY_META[event.category].label);
  if (event.projectionType) parts.push(PROJECTION_TYPE_META[event.projectionType].label);
  if (event.certainty) parts.push(PROJECTION_CERTAINTY_META[event.certainty].label);
  return parts.join(". ");
};

const describeGroupAriaLabel = (grouping: RenderGroup["grouping"], count: number): string => {
  if (grouping === "edge-start") return `${count} events exist before the visible range`;
  if (grouping === "edge-end") return `${count} events exist after the visible range`;
  return `${count} overlapping events`;
};

const describeGroupTitle = (grouping: RenderGroup["grouping"], count: number): string => {
  if (grouping === "edge-start") return `${count} marker${count === 1 ? "" : "s"} before this view`;
  if (grouping === "edge-end") return `${count} marker${count === 1 ? "" : "s"} after this view`;
  return `${count} overlapping marker${count === 1 ? "" : "s"}`;
};

export const buildTimelineInteractiveTargets = ({
  lane,
  topPercent,
  items,
}: BuildTimelineInteractiveTargetsOptions): TimelineInteractiveTarget[] =>
  items.map(item => {
    if (item.type === "single") {
      const detailItem = toDetailPanelItem(item.event);
      return {
        id: item.id,
        lane,
        kind: "single",
        leftPercent: item.leftPercent,
        topPercent,
        widthPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
        heightPx: TIMELINE_SINGLE_TARGET_SIZE_PX,
        count: 1,
        color: resolveTimelineItemColor(item),
        selectionKey: item.event.id,
        detailItems: [detailItem],
        ariaLabel: describeSingleAriaLabel(item.event),
        title: item.event.label,
      };
    }

    return {
      id: item.id,
      lane,
      kind: "group",
      leftPercent: item.leftPercent,
      topPercent,
      widthPx: getTimelineGroupVisualWidthPx(item.events.length),
      heightPx: TIMELINE_GROUP_TARGET_HEIGHT_PX,
      count: item.events.length,
      color: resolveTimelineItemColor(item),
      selectionKey: item.id,
      detailItems: item.events.map(toDetailPanelItem),
      ariaLabel: describeGroupAriaLabel(item.grouping, item.events.length),
      title: describeGroupTitle(item.grouping, item.events.length),
      grouping: item.grouping,
    };
  });

