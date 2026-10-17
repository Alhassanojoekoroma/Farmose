import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const config = await new Promise((resolve, reject) => {
  let data = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (part) => { data += part; });
  process.stdin.on("end", () => {
    try { resolve(JSON.parse(data)); } catch (error) { reject(error); }
  });
});
const storage = new S3Client({
  endpoint: config.endpoint,
  region: config.region,
  forcePathStyle: true,
  credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
});
const key = `farmose-temp/qa-${randomUUID()}/000`;
const bucket = "farmose-media";
try {
  const bytes = new TextEncoder().encode("Farmose media storage verification");
  await storage.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes }));
  const stored = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  assert.deepEqual(await stored.Body.transformToByteArray(), bytes);
  console.log("Media storage put and get verified.");
} finally {
  await storage.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: [{ Key: key }] } }));
  storage.destroy();
  console.log("Temporary verification object removed.");
}
