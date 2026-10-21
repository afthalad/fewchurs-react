"use client";

import { useFewchursConfig } from "../hooks/useFewchursConfig";
import { useBoard } from "./BoardContext";

export function Branding(): React.JSX.Element | null {
  const { labels, cx } = useBoard();
  const { showBranding } = useFewchursConfig();
  if (!showBranding) return null;

  return (
    <p className={cx("fw-branding")}>
      <a
        className={cx("fw-link")}
        href="https://www.fewchurs.com"
        target="_blank"
        rel="noreferrer noopener"
      >
        {labels.poweredBy}
      </a>
    </p>
  );
}
