import { runnerHealthRoute } from "../../../server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return runnerHealthRoute(request);
}
