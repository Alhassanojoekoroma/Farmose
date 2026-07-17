import { env } from "cloudflare:workers";

type StoredAsset = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  etag?: string;
};

type AssetBucket = { get: (key: string) => Promise<StoredAsset | null> };

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!key.startsWith("farmose/")) return new Response("Not found", { status: 404 });
  const bucket = (env as unknown as { ASSETS?: AssetBucket }).ASSETS;
  const asset = await bucket?.get(key);
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(asset.body, {
    headers: {
      "Content-Type": asset.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(asset.etag ? { ETag: asset.etag } : {}),
    },
  });
}
