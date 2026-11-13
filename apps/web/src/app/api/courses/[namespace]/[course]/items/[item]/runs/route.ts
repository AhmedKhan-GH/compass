import { runHistoryRoute, startRunRoute, type ItemParams } from "../../../../../../../../server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request, context: { params: Promise<ItemParams> }): Promise<Response> {
  return runHistoryRoute(request, context.params);
}

export function POST(request: Request, context: { params: Promise<ItemParams> }): Promise<Response> {
  return startRunRoute(request, context.params);
}
