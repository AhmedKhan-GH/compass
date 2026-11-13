"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ItemView } from "@compass/schema";
import { draftKey, loadDraft, saveDraft, sameFiles, starterFiles, type Files } from "@/lib/drafts";

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export type DraftState = "starter" | "saved" | "unsaved";

/**
 * The learner's files for the item and revision, kept in local storage as they change. The workspace renders only
 * in the browser, so the draft is read when the state is created.
 */
export function useDraft(courseId: string, item: ItemView) {
  const key = draftKey(courseId, item.id, item.revision);
  const [files, setFiles] = useState<Files>(() => loadDraft(storage(), key, item));
  const [state, setState] = useState<DraftState>(() =>
    sameFiles(loadDraft(storage(), key, item), starterFiles(item)) ? "starter" : "saved",
  );
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(files);

  const persist = useCallback(
    (next: Files) => {
      const ok = saveDraft(storage(), key, next, item, new Date().toISOString());
      setState(!ok ? "unsaved" : sameFiles(next, starterFiles(item)) ? "starter" : "saved");
    },
    [key, item],
  );

  const replace = useCallback(
    (next: Files) => {
      latest.current = next;
      setFiles(next);
      if (pending.current) clearTimeout(pending.current);
      pending.current = setTimeout(() => persist(latest.current), 250);
    },
    [persist],
  );

  const update = useCallback(
    (name: string, content: string) => replace({ ...latest.current, [name]: content }),
    [replace],
  );

  const reset = useCallback(() => {
    const starter = starterFiles(item);
    latest.current = starter;
    setFiles(starter);
    if (pending.current) clearTimeout(pending.current);
    persist(starter);
  }, [item, persist]);

  // Write any pending change when the page goes away.
  useEffect(() => {
    const flush = () => {
      if (!pending.current) return;
      clearTimeout(pending.current);
      pending.current = null;
      saveDraft(storage(), key, latest.current, item, new Date().toISOString());
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [key, item]);

  return { files, state, update, replace, reset };
}
