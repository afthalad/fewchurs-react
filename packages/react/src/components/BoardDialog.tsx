"use client";

import { useEffect, useRef } from "react";
import { BoardRoot, type FewchursBoardProps } from "./Board";

export interface FewchursBoardDialogProps extends FewchursBoardProps {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
}

export function FewchursBoardDialog({
  open,
  onClose,
  ariaLabel = "Feature requests",
  ...boardProps
}: FewchursBoardDialogProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Focus goes back where it came from, so a keyboard user is not dropped at the top of the page.
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fw-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="fw-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="fw-dialog__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <BoardRoot {...boardProps} />
      </div>
    </div>
  );
}
