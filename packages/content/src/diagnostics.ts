/** Errors and warnings, each with the place in a pack it refers to. They are collected, never thrown. */

export type Severity = "error" | "warning";

/** The rule that produced a diagnostic. The static rules are listed in docs/ARCHITECTURE.md. */
export type Rule =
  | "config"
  | "source"
  | "manifest"
  | "files"
  | "ids"
  | "kinds"
  | "plan"
  | "design"
  | "concepts"
  | "prerequisites"
  | "tasks"
  | "links"
  | "icons"
  | "runner"
  | "reference"
  | "wrong"
  | "stage";

export type Location = {
  /** The pack's directory as shown to the user, for example `content/verilog`. */
  pack: string;
  /** The item's slug. */
  item?: string;
  /** A path relative to the pack directory, for example `items/drive-high/item.toml`. */
  file?: string;
};

export type Diagnostic = Location & { severity: Severity; rule: Rule; message: string };

export type Place = { item?: string; file?: string };

/** Collects the diagnostics of one pack. */
export class DiagnosticList {
  readonly items: Diagnostic[] = [];
  constructor(readonly pack: string) {}

  error(rule: Rule, message: string, place: Place = {}): void {
    this.add("error", rule, message, place);
  }

  warning(rule: Rule, message: string, place: Place = {}): void {
    this.add("warning", rule, message, place);
  }

  add(severity: Severity, rule: Rule, message: string, place: Place = {}): void {
    const diagnostic: Diagnostic = { severity, rule, message, pack: this.pack };
    if (place.item !== undefined) diagnostic.item = place.item;
    if (place.file !== undefined) diagnostic.file = place.file;
    this.items.push(diagnostic);
  }
}

export function countBySeverity(diagnostics: readonly Diagnostic[]): { errors: number; warnings: number } {
  let errors = 0;
  let warnings = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === "error") errors++;
    else warnings++;
  }
  return { errors, warnings };
}

export function hasErrors(diagnostics: readonly Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

/** The place a diagnostic refers to, as a path: `content/verilog/items/drive-high/item.toml`. */
export function locationText(diagnostic: Location): string {
  if (diagnostic.file !== undefined) return joinDisplay(diagnostic.pack, diagnostic.file);
  if (diagnostic.item !== undefined) return joinDisplay(diagnostic.pack, `items/${diagnostic.item}`);
  return diagnostic.pack;
}

function joinDisplay(base: string, relative: string): string {
  return base === "." || base === "" ? relative : `${base.replace(/\/+$/, "")}/${relative}`;
}

/** The shape of a zod error, without depending on zod directly. */
export type SchemaIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
  readonly code?: string;
  readonly pattern?: string;
};

const PATTERN_WORDING: Record<string, string> = {
  "/^[a-z0-9]+(?:-[a-z0-9]+)*$/": "must be a lower-case slug (letters, digits and single hyphens)",
  "/^[a-z0-9]+(?:-[a-z0-9]+)*\\/[a-z0-9]+(?:-[a-z0-9]+)*$/":
    "must be namespace/name, both lower-case slugs",
  "/^[a-z0-9]+(?:-[a-z0-9]+)*@[1-9][0-9]*$/": "must be a versioned kind such as iverilog-cocotb@1",
  "/^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$/": "must be a version such as 0.1.0",
  "/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/": "must be a lower-case UUID",
  "/^[A-Za-z0-9_][A-Za-z0-9_.-]{0,63}$/":
    "must be a plain file name in its folder (no slashes, no leading dot, at most 64 characters)",
  "/^[A-Za-z_][A-Za-z0-9_]{0,127}$/": "must be an identifier (letters, digits and underscores)",
};

/** A schema issue as one plain sentence, prefixed with the field it concerns. */
export function issueText(issue: SchemaIssue): string {
  const field = issue.path.map((part) => (typeof part === "number" ? `[${part}]` : String(part))).join(".");
  const where = field.replace(/\.\[/g, "[");
  const wording =
    issue.code === "invalid_format" && issue.pattern !== undefined
      ? (PATTERN_WORDING[issue.pattern] ?? issue.message)
      : issue.message;
  return where ? `${where}: ${wording}` : wording;
}
