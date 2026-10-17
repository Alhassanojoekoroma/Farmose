import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { hasAdminPermission, requireAdminApi } from "../../../admin-auth";
import { MEDIA_BUCKET, mediaStorage, publicMediaUrl } from "../../../../lib/media-storage";
import { query } from "../../../../lib/postgres";

const MAX_CHUNK_BYTES = 600 * 1024;
const IMAGE_LIMIT = 12 * 1024 * 1024;
const VIDEO_LIMIT = 40 * 1024 * 1024;
const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm",
};

function uploadError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(undefined, request);
  if (auth instanceof Response) return auth;
  try {
    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId") ?? "";
    const index = Number(url.searchParams.get("index"));
    const total = Number(url.searchParams.get("total"));
    const contentType = url.searchParams.get("type") ?? "";
    const declaredSize = Number(url.searchParams.get("size"));
    const extension = mimeExtensions[contentType];
    if (!/^[a-f0-9-]{20,64}$/i.test(uploadId)) return uploadError("The upload identifier is invalid.");
    if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total || total > 100) {
      return uploadError("The upload chunk information is invalid.");
    }
    if (!extension) return uploadError("Use a JPEG, PNG, WebP, AVIF, MP4 or WebM file.");
    const kind = contentType.startsWith("image/") ? "image" : "video";
    if (!hasAdminPermission(auth, "media") && !(kind === "image" && hasAdminPermission(auth, "updates"))) {
      return uploadError("Media or news access is required for this upload.", 403);
    }
    const fileLimit = kind === "image" ? IMAGE_LIMIT : VIDEO_LIMIT;
    if (!Number.isFinite(declaredSize) || declaredSize < 1 || declaredSize > fileLimit) {
      return uploadError(`${kind === "image" ? "Images" : "Videos"} must be smaller than ${fileLimit / 1024 / 1024} MB.`);
    }
    if (total !== Math.ceil(declaredSize / (512 * 1024))) {
      return uploadError("The upload part count does not match the file size.");
    }
    const chunk = new Uint8Array(await request.arrayBuffer());
    if (chunk.byteLength < 1 || chunk.byteLength > MAX_CHUNK_BYTES) return uploadError("Each upload part must be smaller than 600 KB.", 413);
    const storage = mediaStorage();
    const prefix = `farmose-temp/${uploadId}/`;
    const chunkKey = `${prefix}${String(index).padStart(3, "0")}`;
    await storage.send(new PutObjectCommand({ Bucket: MEDIA_BUCKET, Key: chunkKey, Body: chunk }));
    if (index !== total - 1) return Response.json({ received: index + 1, total }, { status: 202 });

    const chunkKeys = Array.from({ length: total }, (_, part) => `${prefix}${String(part).padStart(3, "0")}`);
    const parts: Uint8Array[] = [];
    let combinedSize = 0;
    for (const key of chunkKeys) {
      const stored = await storage.send(new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }));
      if (!stored.Body) return uploadError("An upload part is missing. Please retry.", 409);
      const bytes = await stored.Body.transformToByteArray();
      combinedSize += bytes.byteLength;
      if (combinedSize > fileLimit) return uploadError("The uploaded file is too large.", 413);
      parts.push(bytes);
    }
    if (combinedSize !== declaredSize) return uploadError("The uploaded file was incomplete. Please retry.", 409);
    const complete = new Uint8Array(combinedSize);
    let offset = 0;
    for (const part of parts) { complete.set(part, offset); offset += part.byteLength; }
    const key = `farmose/${crypto.randomUUID()}.${extension}`;
    await storage.send(new PutObjectCommand({
      Bucket: MEDIA_BUCKET, Key: key, Body: complete, ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
    const assetUrl = publicMediaUrl(key);
    await query("INSERT INTO media_assets (key, url, kind, size_bytes) VALUES ($1,$2,$3,$4)", [key, assetUrl, kind, combinedSize]);
    await storage.send(new DeleteObjectsCommand({ Bucket: MEDIA_BUCKET, Delete: { Objects: chunkKeys.map((Key) => ({ Key })) } }));
    return Response.json({ key, url: assetUrl, kind, size: combinedSize }, { status: 201 });
  } catch (error) {
    console.error("Farmose media upload failed", error);
    return uploadError("The upload could not be stored. Please retry.", 503);
  }
}
