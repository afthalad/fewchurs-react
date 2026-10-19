"use client";

import { useBoard } from "./BoardContext";
import type { Feature } from "../types";

interface VoteButtonProps {
  feature: Feature;
  isPending: boolean;
  onToggle: () => void;
}

export function VoteButton({ feature, isPending, onToggle }: VoteButtonProps): React.JSX.Element {
  const { labels, hideVoteCounts, cx } = useBoard();

  return (
    <button
      type="button"
      className={cx("fw-vote")}
      aria-pressed={feature.hasVoted}
      aria-label={`${labels.upvote} ${feature.title}`}
      disabled={isPending}
      onClick={onToggle}
    >
      <span className={cx("fw-vote__arrow")} aria-hidden="true">
        ▲
      </span>
      {!hideVoteCounts && <span className={cx("fw-vote__count")}>{feature.upvoteCount}</span>}
    </button>
  );
}
