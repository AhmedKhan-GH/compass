import { resetItemRoute, type ItemParams } from "../../../../../../../../server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request, context: { params: Promise<ItemParams> }): Promise<Response> {
  return resetItemRoute(request, context.params);
}
