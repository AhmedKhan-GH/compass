"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A small square modal dialog. Opening it moves focus to its default action (the element marked
 * `data-dialog-default`), so Enter confirms; Escape cancels; closing returns focus to where it was. The page's key
 * bindings pause while it is open.
 */
export function Dialog({
  open,
  title,
  children,
  actions,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      element.querySelector<HTMLElement>("[data-dialog-default]")?.focus();
    } else if (!open && element.open) {
      element.close();
      previous.current?.focus();
    }
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="sb-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      {open && (
        <>
          <h2 className="sb-dialog-title" id={titleId}>
            {title}
          </h2>
          <div className="sb-dialog-body">{children}</div>
          <div className="sb-dialog-actions">{actions}</div>
        </>
      )}
    </dialog>
  );
}
