import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const input = await new Promise((resolve, reject) => {
  let value = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (part) => { value += part; });
  process.stdin.on("end", () => {
    try { resolve(JSON.parse(value)); } catch (error) { reject(error); }
  });
});
const { databaseUrl, storageEndpoint, storageRegion, storageAccessKeyId, storageSecretAccessKey } = input;
if (![databaseUrl, storageEndpoint, storageRegion, storageAccessKeyId, storageSecretAccessKey].every(Boolean)) {
  throw new Error("Database and media storage credentials are required on stdin.");
}
const exportData = JSON.parse(await readFile(join(root, "work", "d1-export.json"), "utf8"));
const db = new Client({ connectionString: databaseUrl });
const s3 = new S3Client({
  endpoint: storageEndpoint,
  region: storageRegion,
  forcePathStyle: true,
  credentials: { accessKeyId: storageAccessKeyId, secretAccessKey: storageSecretAccessKey },
});
const bucket = "farmose-media";
const mediaUrls = new Map();

function mediaKey(url) {
  if (typeof url !== "string" || !url.startsWith("/api/media?")) return null;
  const key = new URL(url, "https://farmose.com").searchParams.get("key");
  return key && /^farmose\/[a-zA-Z0-9._/-]+$/.test(key) ? key : null;
}

function publicUrl(key) {
  return `${storageEndpoint.replace(/\/$/, "")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function migrateMedia(url) {
  const key = mediaKey(url);
  if (!key) return url;
  if (mediaUrls.has(key)) return mediaUrls.get(key);
  let contentType = "application/octet-stream";
  let length = 0;
  try {
    const existing = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    contentType = existing.ContentType || contentType;
    length = Number(existing.ContentLength || 0);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 404 && error?.name !== "NotFound") throw error;
    const response = await fetch(`https://farmose.com${url}`);
    if (!response.ok) throw new Error(`Former Farmose media returned HTTP ${response.status}.`);
    contentType = response.headers.get("content-type") || contentType;
    const bytes = new Uint8Array(await response.arrayBuffer());
    length = bytes.byteLength;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, Body: bytes }));
  }
  const migrated = publicUrl(key);
  mediaUrls.set(key, migrated);
  await db.query(
    "INSERT INTO media_assets (key, url, kind, size_bytes) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING",
    [key, migrated, contentType.startsWith("video/") ? "video" : "image", length],
  );
  return migrated;
}

try {
  await db.connect();
  await db.query(await readFile(join(here, "migrations", "001_vercel.sql"), "utf8"));
  console.log("Farmose schema ready.");

  // Copy the public files before rewriting their catalog URLs. If a copy fails,
  // no database row will point to missing storage.
  for (const product of exportData.catalog_products) {
    await migrateMedia(product.image);
    await migrateMedia(product.image_url);
    await migrateMedia(product.video);
    for (const value of JSON.parse(product.additional_images_json || "[]")) await migrateMedia(value);
  }
  for (const setting of exportData.site_settings) await migrateMedia(setting.value);
  console.log(`Media ready: ${mediaUrls.size} files.`);

  await db.query("BEGIN");
  for (const item of exportData.catalog_products) {
    const values = [
      item.slug, item.name, item.short_name, item.category, item.tag,
      item.price, item.unit, await migrateMedia(item.image), await migrateMedia(item.image_url),
      item.image_public_id ?? null,
      JSON.stringify(await Promise.all(JSON.parse(item.additional_images_json || "[]").map(migrateMedia))),
      item.stock_quantity || 0, await migrateMedia(item.video || ""), item.image_position || "center",
      item.color, item.rating, item.reviews, item.description, item.details,
      item.features_json || "[]", Boolean(item.active), Boolean(item.site_visible),
      item.sort_order, item.updated_at,
    ];
    await db.query(`INSERT INTO catalog_products (
      slug,name,short_name,category,tag,price,unit,image,image_url,image_public_id,
      additional_images_json,stock_quantity,video,image_position,color,rating,reviews,
      description,details,features_json,active,site_visible,sort_order,updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21,$22,$23,$24)
    ON CONFLICT (slug) DO NOTHING`, values);
  }
  for (const item of exportData.site_settings) {
    await db.query("INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,$3) ON CONFLICT (key) DO NOTHING",
      [item.key, await migrateMedia(item.value), item.updated_at]);
  }
  // Retain historical order records for the owner. The public order endpoint
  // remains retired and cannot create new orders.
  for (const item of exportData.orders) {
    await db.query(`INSERT INTO orders (
      id,order_number,customer_name,phone,email,address,area,notes,payment_method,
      items_json,subtotal,delivery_fee,total,status,created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::text,$10::jsonb,$11,$12,$13,$14,$15)
    ON CONFLICT (id) DO NOTHING`, [
      item.id,item.order_number,item.customer_name,item.phone,item.email,item.address,
      item.area,item.notes,item.payment_method,item.items_json,item.subtotal,
      item.delivery_fee,item.total,item.status,item.created_at,
    ]);
  }
  await db.query("COMMIT");
  const counts = await db.query(`SELECT
    (SELECT count(*) FROM catalog_products) AS products,
    (SELECT count(*) FROM site_settings) AS settings,
    (SELECT count(*) FROM orders) AS orders,
    (SELECT count(*) FROM media_assets) AS media`);
  console.log(`Imported counts: ${JSON.stringify(counts.rows[0])}`);
} catch (error) {
  try { await db.query("ROLLBACK"); } catch { /* no open transaction */ }
  throw error;
} finally {
  await s3.destroy();
  await db.end();
}
