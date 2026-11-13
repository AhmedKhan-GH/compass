/**
 * Reading files inside a pack: no symlinks anywhere on the path, no path that leaves the pack, bounded sizes,
 * strict UTF-8. Text is returned with a byte-order mark removed and CRLF line ends turned into LF, so the same
 * pack gives the same index on every platform.
 */
import { constants } from "node:fs";
import { lstat, open, readdir } from "node:fs/promises";
import path from "node:path";
import { SOURCE_LIMITS } from "@compass/schema";

export const LIMITS = {
  /** course.toml and item.toml. */
  manifestBytes: 64 * 1024,
  /** Every Markdown file. */
  markdownBytes: 256 * 1024,
  /** Starter, reference, wrong and stage files: what a job may carry per file. */
  sourceBytes: SOURCE_LIMITS.fileBytes,
  /** The checks file. */
  checksBytes: SOURCE_LIMITS.checksBytes,
  /** Every file read from one pack together. */
  packBytes: 32 * 1024 * 1024,
} as const;

export type ReadFailure = "invalid-path" | "missing" | "symlink" | "not-a-file" | "too-large" | "encoding" | "unreadable";

export type ReadResult =
  | { ok: true; content: string; bytes: number }
  | { ok: false; failure: ReadFailure; message: string };

/** A relative path inside a pack: forward slashes, no empty, `.` or `..` segments. */
export function isPackPath(relative: string): boolean {
  if (relative === "" || relative.includes("\\") || relative.includes("\0") || path.posix.isAbsolute(relative))
    return false;
  return relative.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

type Walk =
  | { ok: true; absolute: string }
  | { ok: false; failure: ReadFailure; message: string };

/** Checks every directory on the way to `relative`: each must exist and none may be a symlink. */
async function walk(root: string, relative: string): Promise<Walk> {
  if (!isPackPath(relative))
    return { ok: false, failure: "invalid-path", message: `${relative} is not a plain relative path inside the pack` };
  const segments = relative.split("/");
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const shown = segments.slice(0, index + 1).join("/");
    let info;
    try {
      info = await lstat(current);
    } catch (error) {
      if (errorCode(error) === "ENOENT" || errorCode(error) === "ENOTDIR")
        return { ok: false, failure: "missing", message: `${relative} does not exist` };
      return { ok: false, failure: "unreadable", message: `${shown} could not be read (${errorCode(error) ?? "error"})` };
    }
    if (info.isSymbolicLink())
      return { ok: false, failure: "symlink", message: `${shown} is a symbolic link; packs may not contain links` };
    if (index < segments.length - 1 && !info.isDirectory())
      return { ok: false, failure: "missing", message: `${relative} does not exist (${shown} is not a folder)` };
  }
  return { ok: true, absolute: current };
}

const decoder = new TextDecoder("utf-8", { fatal: true });

export function normalizeText(text: string): string {
  return (text.startsWith("﻿") ? text.slice(1) : text).replace(/\r\n?/g, "\n");
}

/** Reads a text file inside the pack directory `root`. */
export async function readPackFile(root: string, relative: string, maxBytes: number): Promise<ReadResult> {
  const walked = await walk(root, relative);
  if (!walked.ok) return walked;
  let handle;
  try {
    handle = await open(walked.absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (errorCode(error) === "ELOOP")
      return { ok: false, failure: "symlink", message: `${relative} is a symbolic link; packs may not contain links` };
    if (errorCode(error) === "ENOENT") return { ok: false, failure: "missing", message: `${relative} does not exist` };
    return { ok: false, failure: "unreadable", message: `${relative} could not be read (${errorCode(error) ?? "error"})` };
  }
  try {
    const info = await handle.stat();
    if (!info.isFile()) return { ok: false, failure: "not-a-file", message: `${relative} is not a file` };
    if (info.size > maxBytes) return tooLarge(relative, info.size, maxBytes);
    const buffer = Buffer.alloc(maxBytes + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > maxBytes) return tooLarge(relative, length, maxBytes);
    let text: string;
    try {
      text = decoder.decode(buffer.subarray(0, length));
    } catch {
      return { ok: false, failure: "encoding", message: `${relative} is not valid UTF-8 text` };
    }
    return { ok: true, content: normalizeText(text), bytes: length };
  } catch (error) {
    return { ok: false, failure: "unreadable", message: `${relative} could not be read (${errorCode(error) ?? "error"})` };
  } finally {
    await handle.close();
  }
}

function tooLarge(relative: string, size: number, maxBytes: number): ReadResult {
  return {
    ok: false,
    failure: "too-large",
    message: `${relative} is ${size} bytes, over the limit of ${formatBytes(maxBytes)} for this file`,
  };
}

export type EntryKind = "file" | "directory" | "symlink" | "other";
export type Entry = { name: string; kind: EntryKind };

/**
 * Lists a folder inside the pack, sorted by name. Resolves to undefined when the folder does not exist;
 * a folder reached through a symlink is reported as a failure.
 */
export async function listPackDirectory(
  root: string,
  relative: string,
): Promise<{ ok: true; entries: Entry[] | undefined } | { ok: false; message: string }> {
  let absolute = root;
  if (relative !== "") {
    const walked = await walk(root, relative);
    if (!walked.ok) {
      if (walked.failure === "missing") return { ok: true, entries: undefined };
      return { ok: false, message: walked.message };
    }
    absolute = walked.absolute;
  }
  try {
    const info = await lstat(absolute);
    if (!info.isDirectory()) return { ok: false, message: `${relative} is not a folder` };
    const dirents = await readdir(absolute, { withFileTypes: true });
    const entries = dirents
      .map((dirent): Entry => ({
        name: dirent.name,
        kind: dirent.isSymbolicLink()
          ? "symlink"
          : dirent.isDirectory()
            ? "directory"
            : dirent.isFile()
              ? "file"
              : "other",
      }))
      .sort((a, b) => compareText(a.name, b.name));
    return { ok: true, entries };
  } catch (error) {
    return { ok: false, message: `${relative || "the pack folder"} could not be listed (${errorCode(error) ?? "error"})` };
  }
}

/** What is at a path inside the pack, without following links. */
export async function packEntryKind(root: string, relative: string): Promise<EntryKind | "missing" | "invalid"> {
  const walked = await walk(root, relative);
  if (!walked.ok) {
    if (walked.failure === "symlink") return "symlink";
    if (walked.failure === "missing") return "missing";
    return "invalid";
  }
  const info = await lstat(walked.absolute);
  return info.isDirectory() ? "directory" : info.isFile() ? "file" : "other";
}

/** Code-point order, independent of the locale, for stable output. */
export function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round((bytes / 1024) * 10) / 10} KiB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MiB`;
}

export function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string")
    return error.code;
  return undefined;
}
