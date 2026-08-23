import { v2 as cloudinary } from "cloudinary";
import { env } from "./cloudflare-env";

function configuredValue(name: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET") {
  return (env as unknown as Record<string, string | undefined>)[name] ?? process.env[name] ?? "";
}

export function getCloudinaryClient() {
  const cloudName = configuredValue("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = configuredValue("CLOUDINARY_API_KEY");
  const apiSecret = configuredValue("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured.");
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export async function uploadProductImage(file: File) {
  const client = getCloudinaryClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;
  const result = await client.uploader.upload(dataUri, { folder: "farmose/products", resource_type: "image", overwrite: false });
  return { secureUrl: result.secure_url, publicId: result.public_id };
}

export async function deleteProductImage(publicId: string) {
  if (!publicId) return;
  await getCloudinaryClient().uploader.destroy(publicId, { resource_type: "image", invalidate: true });
}
