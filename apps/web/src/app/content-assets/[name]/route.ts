import { readContentAsset } from "../../../server/content.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves an icon from the content index's assets. The name is the hash of the bytes, so it never changes. */
export async function GET(_request: Request, context: { params: Promise<{ name: string }> }): Promise<Response> {
  const { name } = await context.params;
  const bytes = readContentAsset(name);
  if (!bytes) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
