export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function validateProductImageFile(file: File | null | undefined) {
  if (!file) return "Please choose an image file.";
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Unsupported file type. Use JPEG, PNG, WebP, or AVIF.";
  }
  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return "The selected image is too large. Please use a file smaller than 5 MB.";
  }
  return null;
}

export function buildCloudinaryUrl(publicId: string, options: { width?: number; height?: number; crop?: string; quality?: string; format?: string } = {}) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return "";
  const params = ["f_auto", "q_auto"];
  if (options.width) params.push(`w_${options.width}`);
  if (options.height) params.push(`h_${options.height}`);
  if (options.crop) params.push(`c_${options.crop}`);
  if (options.quality) params.push(`q_${options.quality}`);
  if (options.format) params.push(`f_${options.format}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(",")}/${publicId}`;
}
