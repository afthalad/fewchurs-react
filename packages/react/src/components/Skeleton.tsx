"use client";

import { ROADMAP_STATUSES } from "../client/constants";
import { useBoard } from "./BoardContext";

/** Enough rows to fill the fold without pushing the real list down when it arrives. */
const ROW_COUNT = 3;
const ROADMAP_ROW_COUNT = 2;

/**
 * Placeholder rows shaped like `FeatureCard`, so the board does not collapse to one line of
 * text and then jump when the first page lands. `labels.loading` is still announced, since
 * the bars themselves are decorative.
 */
export function FeatureListSkeleton({
  roadmap = false,
  rows = ROW_COUNT,
}: {
  roadmap?: boolean;
  /** One row while a single deep-linked request loads, a full board otherwise. */
  rows?: number;
}): React.JSX.Element {
  const { labels, cx } = useBoard();

  return (
    <div className={cx("fw-skeleton")} role="status" aria-busy="true">
      <span className={cx("fw-sr-only")}>{labels.loading}</span>

      {roadmap ? (
        <div className={cx("fw-roadmap")} aria-hidden="true">
          {ROADMAP_STATUSES.map((status) => (
            <div key={status} className={cx("fw-roadmap__column")}>
              <Bar width="40%" />
              <Rows count={ROADMAP_ROW_COUNT} />
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true">
          <Rows count={rows} />
        </div>
      )}
    </div>
  );
}

function Rows({ count }: { count: number }): React.JSX.Element {
  const { cx } = useBoard();

  return (
    <div className={cx("fw-list")}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cx("fw-card", "fw-skeleton__card")}>
          <div className={cx("fw-skeleton__vote")} />
          <div className={cx("fw-card__body")}>
            <Bar width="62%" />
            <Bar width="88%" height="0.6rem" />
            <Bar width="34%" height="0.6rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Bar({ width, height }: { width: string; height?: string }): React.JSX.Element {
  const { cx } = useBoard();
  return <div className={cx("fw-skeleton__bar")} style={{ width, height }} />;
}
