"use client";

import { useBoard } from "./BoardContext";
import type { FeatureStatus } from "../types";

export function StatusBadge({ status }: { status: FeatureStatus }): React.JSX.Element | null {
  const { labels, cx } = useBoard();
  if (status === "open" || status === "unknown") return null;

  return <span className={cx("fw-status", `fw-status--${status}`)}>{labels.status[status]}</span>;
}
