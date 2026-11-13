import type { ReactNode } from "react";
import { join } from "./classes.ts";
import type { Tone } from "./status-mark.tsx";

/** The application window: the command bar, the docked content, the status bar. */
export function AppFrame({
  commandBar,
  statusBar,
  children,
  className,
}: {
  commandBar: ReactNode;
  statusBar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={join("sb-frame", className)}>
      {commandBar}
      <main className="sb-frame-main">{children}</main>
      {statusBar}
    </div>
  );
}

/** The strip at the top of the window: the wordmark, the place, the actions. */
export function CommandBar({ children, label = "Command bar" }: { children: ReactNode; label?: string }) {
  return (
    <header className="sb-command-bar" aria-label={label}>
      {children}
    </header>
  );
}

/** The application's name in Sternbild Display. */
export function Wordmark({ children }: { children: ReactNode }) {
  return <span className="sb-wordmark">{children}</span>;
}

/** A path of places in the command bar, separated by faint slashes. */
export function Trail({ children }: { children: ReactNode[] }) {
  const items = children.filter(Boolean);
  return (
    <nav className="sb-trail" aria-label="Location">
      {items.map((item, index) => (
        <span key={index} className="sb-trail-item">
          {index > 0 && (
            <span className="sb-trail-separator" aria-hidden="true">
              /
            </span>
          )}
          {item}
        </span>
      ))}
    </nav>
  );
}

/** Takes the remaining width of a strip, pushing what follows to the right. */
export function Spacer() {
  return <span className="sb-spacer" />;
}

/**
 * The status strip at the bottom of the window. A `tone` fills it with a state colour (a run going, its outcome),
 * so the state is seen from anywhere in the window.
 */
export function StatusBar({ children, tone }: { children: ReactNode; tone?: Tone }) {
  return (
    <footer className="sb-status-bar" role="status" aria-live="polite" data-tone={tone}>
      {children}
    </footer>
  );
}

/** One status item. Items stand apart with a faint middle dot between them. */
export function StatusItem({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={join("sb-status-item", className)}>{children}</span>;
}

/** A label in the UI face at the small size, in capitals with the UI tracking. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={join("sb-label", className)}>{children}</span>;
}

/**
 * A thumbnail: the icon when there is one, shown as an image exactly as drawn (it carries its own tile), or else
 * the placeholder tile, a square with a 1 px border and nothing inside. The alt is empty: a title always stands
 * beside a thumbnail.
 */
export function Thumbnail({
  size = 64,
  src,
  className,
}: {
  size?: number;
  src?: string | undefined;
  className?: string;
}) {
  if (src)
    return (
      <img
        className={join("sb-icon", className)}
        src={src}
        width={size}
        height={size}
        alt=""
        decoding="async"
        draggable={false}
      />
    );
  // The placeholder tile takes the same place as an icon's own tile, which is drawn inside its square with a margin.
  return (
    <span className={join("sb-thumbnail-slot", className)} style={{ width: size, height: size }} aria-hidden="true">
      <span className="sb-thumbnail" />
    </span>
  );
}

/** The house style for Markdown and other running text. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={join("sb-prose", className)}>{children}</div>;
}

/**
 * Progress as one small square per unit: filled when complete, half filled when started, outlined otherwise.
 * The count in words sits beside it, so nothing depends on the squares alone.
 */
export function Meter({
  complete,
  started = 0,
  total,
  label,
}: {
  complete: number;
  started?: number;
  total: number;
  label: string;
}) {
  const cells = Array.from({ length: total }, (_, index) =>
    index < complete ? "complete" : index < complete + started ? "started" : "empty",
  );
  return (
    <span className="sb-meter" role="img" aria-label={label}>
      {cells.map((state, index) => (
        <span key={index} className="sb-meter-cell" data-state={state} />
      ))}
    </span>
  );
}
