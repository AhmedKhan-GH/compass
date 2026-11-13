/**
 * Finds the cocotb tests in a checks file by reading its text. The file is never run here: the site and the
 * CLI never run pack code. A test is an `async def name` directly under an `@cocotb.test()` decorator at the
 * top level of the module.
 */

export type FoundTest = { name: string; line: number };
export type TestScan = {
  tests: FoundTest[];
  /** Decorators this reader could not pair with a test function. */
  problems: { line: number; message: string }[];
};

const DECORATOR = /^@cocotb\.test\b/;
const ASYNC_DEF = /^async\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;
const PLAIN_DEF = /^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/;

export function findCocotbTests(source: string): TestScan {
  const lines = source.split("\n");
  const tests: FoundTest[] = [];
  const problems: TestScan["problems"] = [];
  const strings = new TripleQuoteTracker();
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const inString = strings.inside;
    strings.step(line);
    if (inString || !DECORATOR.test(line)) continue;
    const decoratorLine = index + 1;
    // A decorator's arguments may span several lines.
    let depth = parenthesisDepth(line);
    while (depth > 0 && index + 1 < lines.length) {
      index++;
      const next = lines[index] ?? "";
      strings.step(next);
      depth += parenthesisDepth(next);
    }
    let next = index + 1;
    while (next < lines.length && isBlankOrComment(lines[next] ?? "")) next++;
    const target = lines[next] ?? "";
    const asyncMatch = ASYNC_DEF.exec(target);
    if (asyncMatch?.[1]) {
      tests.push({ name: asyncMatch[1], line: next + 1 });
      continue;
    }
    const plainMatch = PLAIN_DEF.exec(target);
    problems.push({
      line: decoratorLine,
      message: plainMatch?.[1]
        ? `the test ${plainMatch[1]} on line ${next + 1} must be an async def`
        : `the @cocotb.test() decorator on line ${decoratorLine} is not directly followed by an async def`,
    });
  }
  return { tests, problems };
}

function isBlankOrComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "" || trimmed.startsWith("#");
}

function parenthesisDepth(line: string): number {
  let depth = 0;
  let quote: string | undefined;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (quote) {
      if (char === "\\") index++;
      else if (char === quote) quote = undefined;
      continue;
    }
    if (char === "#") break;
    if (char === '"' || char === "'") quote = char;
    else if (char === "(") depth++;
    else if (char === ")") depth--;
  }
  return depth;
}

/** Whether a line starts inside a triple-quoted string, so decorator-like text in docstrings is skipped. */
class TripleQuoteTracker {
  private open: '"""' | "'''" | undefined;

  get inside(): boolean {
    return this.open !== undefined;
  }

  step(line: string): void {
    let index = 0;
    while (index < line.length) {
      if (this.open) {
        const close = line.indexOf(this.open, index);
        if (close === -1) return;
        index = close + 3;
        this.open = undefined;
        continue;
      }
      const hash = line.indexOf("#", index);
      const double = line.indexOf('"""', index);
      const single = line.indexOf("'''", index);
      const candidates = [double, single].filter((position) => position !== -1);
      if (candidates.length === 0) return;
      const start = Math.min(...candidates);
      if (hash !== -1 && hash < start && !insideQuotes(line.slice(0, hash))) return;
      this.open = start === double ? '"""' : "'''";
      index = start + 3;
    }
  }
}

function insideQuotes(prefix: string): boolean {
  let quote: string | undefined;
  for (let index = 0; index < prefix.length; index++) {
    const char = prefix[index];
    if (quote) {
      if (char === "\\") index++;
      else if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") quote = char;
  }
  return quote !== undefined;
}
