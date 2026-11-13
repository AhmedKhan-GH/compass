import type { JobError, JobErrorKind } from "@compass/schema";

/** A run that could not produce a result. The queue turns it into `job.error`. */
export class JobFailure extends Error {
  constructor(
    public readonly kind: JobErrorKind,
    message: string,
    public readonly diagnostics?: string,
  ) {
    super(message);
    this.name = "JobFailure";
  }

  toJobError(): JobError {
    return {
      kind: this.kind,
      message: this.message,
      ...(this.diagnostics ? { diagnostics: this.diagnostics } : {}),
    };
  }
}
