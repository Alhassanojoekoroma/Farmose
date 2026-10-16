import { env } from "../../../../lib/cloudflare-env";
import { requireAdminApi } from "../../../admin-auth";

type StoredChunk = { arrayBuffer: () => Promise<ArrayBuffer> };
type AssetBucket = {
  put: (key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
  get: (key: string) => Promise<StoredChunk | null>;
  delete: (keys: string | string[]) => Promise<unknown>;
};

const MAX_CHUNK_BYTES = 600 * 1024;
const IMAGE_LIMIT = 12 * 1024 * 1024;
const VIDEO_LIMIT = 40 * 1024 * 1024;

function uploadError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi("media");
  if (auth instanceof Response) return auth;

  try {

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const index = Number(url.searchParams.get("index"));
  const total = Number(url.searchParams.get("total"));
  const filename = url.searchParams.get("name") ?? "upload";
  const contentType = url.searchParams.get("type") ?? "";
  const declaredSize = Number(url.searchParams.get("size"));

  if (!/^[a-f0-9-]{20,64}$/i.test(uploadId)) return uploadError("The upload identifier is invalid.");
  if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total || total > 100) {
    return uploadError("The upload chunk information is invalid.");
  }
  if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
    return uploadError("Only image and video files can be uploaded here.");
  }
  const fileLimit = contentType.startsWith("image/") ? IMAGE_LIMIT : VIDEO_LIMIT;
  if (!Number.isFinite(declaredSize) || declaredSize < 1 || declaredSize > fileLimit) {
    return uploadError(`${contentType.startsWith("image/") ? "Images" : "Videos"} must be smaller than ${fileLimit / 1024 / 1024} MB.`);
  }

  const chunk = await request.arrayBuffer();
  if (chunk.byteLength < 1 || chunk.byteLength > MAX_CHUNK_BYTES) {
    return uploadError("Each upload part must be smaller than 600 KB.", 413);
  }

  const bucket = (env as unknown as { MEDIA?: AssetBucket }).MEDIA;
  if (!bucket) return uploadError("Media storage is not available.", 503);

  const temporaryPrefix = `farmose-temp/${uploadId}`;
  const chunkKey = `${temporaryPrefix}/${String(index).padStart(3, "0")}`;
  await bucket.put(chunkKey, chunk);

  if (index !== total - 1) {
    return Response.json({ received: index + 1, total }, { status: 202 });
  }

  const chunkKeys = Array.from({ length: total }, (_, chunkIndex) => `${temporaryPrefix}/${String(chunkIndex).padStart(3, "0")}`);
  const parts: Uint8Array[] = [];
  let combinedSize = 0;
  for (const key of chunkKeys) {
    const stored = await bucket.get(key);
    if (!stored) return uploadError("An upload part is missing. Please try the upload again.", 409);
    const part = new Uint8Array(await stored.arrayBuffer());
    combinedSize += part.byteLength;
    if (combinedSize > fileLimit) return uploadError("The uploaded file is too large.", 413);
    parts.push(part);
  }
  if (combinedSize !== declaredSize) return uploadError("The uploaded file was incomplete. Please try again.", 409);

  const combined = new Uint8Array(combinedSize);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.byteLength;
  }

  const extension = filename.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || (contentType.startsWith("video/") ? "mp4" : "jpg");
  const key = `farmose/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, combined, { httpMetadata: { contentType } });
  await bucket.delete(chunkKeys);

    return Response.json({ key, url: `/api/media?key=${encodeURIComponent(key)}`, kind: contentType.startsWith("video/") ? "video" : "image", size: combinedSize }, { status: 201 });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "An unknown storage error occurred.";
    console.error("Farmose media upload failed", reason);
    return uploadError(`The upload could not be stored: ${message}`, 500);
  }
}
