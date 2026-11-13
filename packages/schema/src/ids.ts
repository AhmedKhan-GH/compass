import { z } from "zod";

/** A lower-case slug: letters, digits and single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A course id: `namespace/name`, both slugs. */
export const COURSE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A versioned kind such as `iverilog-cocotb@1`. */
export const KIND_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*@[1-9][0-9]*$/;
export const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** A file name inside an item folder: one path segment, no leading dot. */
export const FILE_NAME_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/;
/** A Verilog module identifier or a Python test function name. */
export const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

export const Slug = z.string().regex(SLUG_PATTERN);
export const CourseId = z.string().regex(COURSE_ID_PATTERN);
export const Kind = z.string().regex(KIND_PATTERN);
export const Semver = z.string().regex(SEMVER_PATTERN);
export const Uuid = z.string().regex(UUID_PATTERN);
/** `__proto__` matches the pattern but cannot be a key of a plain record. */
export const FileName = z
  .string()
  .regex(FILE_NAME_PATTERN)
  .refine((name) => name !== "__proto__", "Reserved name.");
export const Identifier = z.string().regex(IDENTIFIER_PATTERN);

export function splitCourseId(id: string): { namespace: string; name: string } {
  const [namespace, name] = id.split("/");
  if (!namespace || !name || !COURSE_ID_PATTERN.test(id))
    throw new Error(`Not a course id: ${id}`);
  return { namespace, name };
}
