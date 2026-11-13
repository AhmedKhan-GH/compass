"use client";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/runs";

/** Time since `since` (milliseconds since the epoch), "3.4 s", ticking while `since` is set. */
export function useElapsed(since: number | undefined): string | undefined {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === undefined) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [since]);
  return since === undefined ? undefined : formatDuration(Math.max(0, now - since));
}
