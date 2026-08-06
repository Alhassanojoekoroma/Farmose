import { v2 as cloudinary } from "cloudinary";

export function getCloudinaryClient() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.");
  }

  return cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadProductImage(file: File, folder = "african-store/products") {
  if (typeof file.arrayBuffer !== "function") {
    throw new Error("The image file is invalid.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const publicId = `${folder}/${crypto.randomUUID()}`;
  const result = await cloudinary.uploader.upload(`data:${file.type};base64,${bytes.toString("base64")}`, {
    folder,
    public_id: publicId,
    resource_type: "image",
    overwrite: false,
    secure: true,
  });
  return { secureUrl: result.secure_url, publicId: result.public_id };
}

export async function deleteProductImage(publicId: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
