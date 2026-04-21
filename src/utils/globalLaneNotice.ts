export type EventLoadStatus = "idle" | "loading" | "success" | "error";

export type GlobalLaneNotice = "loading" | "error" | "empty" | null;

type ResolveGlobalLaneNoticeInput = {
  historicalStatus: EventLoadStatus;
  projectedStatus: EventLoadStatus;
  noGlobalItems: boolean;
};

export function resolveGlobalLaneNotice({
  historicalStatus,
  projectedStatus,
  noGlobalItems,
}: ResolveGlobalLaneNoticeInput): GlobalLaneNotice {
  if (!noGlobalItems) return null;

  const statuses = [historicalStatus, projectedStatus];
  if (statuses.some(status => status === "idle" || status === "loading")) {
    return "loading";
  }

  if (statuses.some(status => status === "error")) {
    return "error";
  }

  return "empty";
}

