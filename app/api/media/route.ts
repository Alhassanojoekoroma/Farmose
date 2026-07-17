import { env } from "cloudflare:workers";

type StoredAsset = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  etag?: string;
  size?: number;
  range?: { offset: number; length: number };
};

type AssetBucket = { get: (key: string, options?: { range?: Headers }) => Promise<StoredAsset | null> };

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key.startsWith("farmose/")) return new Response("Not found", { status: 404 });
  const bucket = (env as unknown as { ASSETS?: AssetBucket }).ASSETS;
  const rangeRequested = request.headers.has("Range");
  const asset = await bucket?.get(key, rangeRequested ? { range: request.headers } : undefined);
  if (!asset) return new Response("Not found", { status: 404 });
  const partial = rangeRequested && asset.range && typeof asset.size === "number";
  return new Response(asset.body, {
    status: partial ? 206 : 200,
    headers: {
      "Content-Type": asset.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Accept-Ranges": "bytes",
      ...(partial ? {
        "Content-Range": `bytes ${asset.range!.offset}-${asset.range!.offset + asset.range!.length - 1}/${asset.size}`,
        "Content-Length": String(asset.range!.length),
      } : {}),
      ...(asset.etag ? { ETag: asset.etag } : {}),
    },
  });
}
