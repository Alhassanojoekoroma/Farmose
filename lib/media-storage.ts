import { S3Client } from "@aws-sdk/client-s3";

export const MEDIA_BUCKET = "farmose-media";

let client: S3Client | undefined;

export function mediaStorage() {
  if (!process.env.AWS_ENDPOINT_URL_S3 || !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Farmose media storage is not configured.");
  }
  if (!client) {
    client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      region: process.env.AWS_REGION,
      forcePathStyle: true,
    });
  }
  return client;
}

export function publicMediaUrl(key: string) {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!endpoint || !/^farmose\/[a-zA-Z0-9._/-]+$/.test(key)) throw new Error("Invalid media key.");
  return `${endpoint.replace(/\/$/, "")}/${MEDIA_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
