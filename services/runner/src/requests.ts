/**
 * Checks on a schema-valid job request that the schema cannot express. The HTTP API answers 400 when one fails,
 * and the launchers repeat them before they start a container.
 */
import type { JobRequest, TestJobRequest } from "@compass/schema";

export const TASK_SELECTION_MESSAGE = "Select a positive task ID declared by this exercise.";

/** Whether `taskId` names a task of the request: a mapped task, or the implicit task 1 of a concept item. */
export function isDeclaredTask(request: Pick<TestJobRequest, "tasks" | "taskId" | "itemKind">): boolean {
  const { taskId, tasks } = request;
  if (taskId === undefined) return true;
  if (!Number.isSafeInteger(taskId) || taskId < 1) return false;
  return tasks ? tasks.some((task) => task.id === taskId) : request.itemKind === "concept" && taskId === 1;
}

/** Returns a message describing why the request cannot run, or undefined when it can. */
export function checkJobRequest(request: JobRequest): string | undefined {
  // hasOwn, because a name such as __proto__ would otherwise read the prototype.
  const solution = Object.hasOwn(request.files, request.solution) ? request.files[request.solution] : undefined;
  if (typeof solution !== "string") return `The solution file ${request.solution} is not among the files.`;
  if (!solution.trim()) return "The solution file is empty.";
  const names = Object.keys(request.files);
  if (request.runner === "iverilog-cocotb@1") names.push(request.checks.name);
  // The files are written to one directory, which may be on a case-insensitive file system.
  const seen = new Set<string>();
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) return `Two files are named ${name} when case is ignored.`;
    seen.add(key);
  }
  if (request.runner === "iverilog-cocotb@1" && !isDeclaredTask(request)) return TASK_SELECTION_MESSAGE;
  return undefined;
}
