import { env } from "../../../../lib/cloudflare-env";
import { requireAdminApi } from "../../../admin-auth";

type AssetObject = {
  key: string;
  size: number;
  uploaded?: Date;
  httpMetadata?: { contentType?: string };
};

type AssetBucket = {
  list: (options?: { prefix?: string; limit?: number }) => Promise<{ objects: AssetObject[] }>;
};

function kindFor(asset: AssetObject) {
  if (asset.httpMetadata?.contentType?.startsWith("video/")) return "video";
  return /\.(mp4|webm|mov)$/i.test(asset.key) ? "video" : "image";
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  try {
    const bucket = (env as unknown as { MEDIA?: AssetBucket }).MEDIA;
    if (!bucket) return Response.json({ error: "Media storage is not available." }, { status: 503 });

    const result = await bucket.list({ prefix: "farmose/", limit: 120 });
    const media = result.objects
      .filter((asset) => asset.key.startsWith("farmose/"))
      .sort((left, right) => Number(right.uploaded ?? 0) - Number(left.uploaded ?? 0))
      .map((asset) => ({ key: asset.key, size: asset.size, uploaded: asset.uploaded?.toISOString() ?? "", kind: kindFor(asset), url: `/api/media?key=${encodeURIComponent(asset.key)}` }));
    return Response.json({ media });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "An unknown storage error occurred.";
    console.error("Farmose media library failed", reason);
    return Response.json({ error: `The media library is unavailable: ${message}` }, { status: 500 });
  }
}
