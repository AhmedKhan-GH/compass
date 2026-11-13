import { readCircuitRoute, type IdParams } from "../../../../server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request, context: { params: Promise<IdParams> }): Promise<Response> {
  return readCircuitRoute(request, context.params);
}
