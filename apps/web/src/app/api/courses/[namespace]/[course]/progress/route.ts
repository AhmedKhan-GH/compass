import { courseProgressRoute, type CourseParams } from "../../../../../../server/api.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request, context: { params: Promise<CourseParams> }): Promise<Response> {
  return courseProgressRoute(request, context.params);
}
