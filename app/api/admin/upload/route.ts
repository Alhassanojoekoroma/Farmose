import { env } from "cloudflare:workers";
import { requireAdminApi } from "../../../admin-auth";

type AssetBucket = {
  put: (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => Promise<unknown>;
};

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image files can be uploaded here." }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "Images must be smaller than 8 MB." }, { status: 400 });
  }

  const bucket = (env as unknown as { ASSETS?: AssetBucket }).ASSETS;
  if (!bucket) return Response.json({ error: "Image storage is not available." }, { status: 503 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const key = `farmose/${crypto.randomUUID()}.${extension}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ url: `/api/media?key=${encodeURIComponent(key)}` }, { status: 201 });
}
