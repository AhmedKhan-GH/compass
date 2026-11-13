"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { followJob, type JobLike, type JobPhase } from "@/lib/job-poll";

/** One job at a time (a run or a circuit), followed to a terminal state. Leaving the page stops the polling. */
export function useJob<T extends JobLike>() {
  const [phase, setPhase] = useState<JobPhase<T>>({ phase: "idle" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const follow = useCallback(
    async (
      start: (signal: AbortSignal) => Promise<T>,
      get: (id: string, waitMs: number, signal: AbortSignal, last: T) => Promise<T>,
    ): Promise<JobPhase<T> | undefined> => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      try {
        return await followJob<T>({
          start: () => start(current.signal),
          get: (id, waitMs, last) => get(id, waitMs, current.signal, last),
          onPhase: setPhase,
          signal: current.signal,
        });
      } catch (error) {
        if (current.signal.aborted) return undefined;
        throw error;
      }
    },
    [],
  );
  const clear = useCallback(() => {
    controller.current?.abort();
    setPhase({ phase: "idle" });
  }, []);
  return { phase, follow, clear };
}
