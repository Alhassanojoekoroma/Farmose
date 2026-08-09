import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the production build contains the Cloudflare worker and runtime bindings", async () => {
  await access(new URL("dist/server/index.js", root));
  await access(new URL("dist/.openai/hosting.json", root));
  const [worker, runtimeEnv] = await Promise.all([
    readFile(new URL("worker/index.ts", root), "utf8"),
    readFile(new URL("lib/cloudflare-env.ts", root), "utf8"),
  ]);
  assert.match(worker, /globalThis.*__cloudflareEnv/s);
  assert.match(runtimeEnv, /new Proxy/);
  assert.match(runtimeEnv, /runtime\.__cloudflareEnv/);
});

test("the Farmose buying journeys are present", async () => {
  const [site, data, checkout, product, wholesale] = await Promise.all([
    readFile(new URL("app/components/FarmoseSite.tsx", root), "utf8"),
    readFile(new URL("app/farmose-data.ts", root), "utf8"),
    readFile(new URL("app/checkout/page.tsx", root), "utf8"),
    readFile(new URL("app/products/[slug]/page.tsx", root), "utf8"),
    readFile(new URL("app/wholesale/page.tsx", root), "utf8"),
  ]);
  assert.match(site, /Order this cart via WhatsApp/);
  assert.match(site, /Orange Money/);
  assert.match(site, /AfriMoney/);
  assert.match(site, /Cash on delivery/);
  assert.match(site, /Start a wholesale order/);
  assert.match(data, /sand-free/i);
  assert.match(checkout, /view="checkout"/);
  assert.match(product, /generateStaticParams/);
  assert.match(wholesale, /view="wholesale"/);
});

test("durable order storage is configured with a migration", async () => {
  const [hosting, route, migration] = await Promise.all([
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("app/api/orders/route.ts", root), "utf8"),
    readFile(new URL("drizzle/0000_lonely_fallen_one.sql", root), "utf8"),
  ]);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(route, /insert\(orders\)/);
  assert.match(migration, /CREATE TABLE `orders`/);
  assert.match(migration, /CREATE UNIQUE INDEX `orders_order_number_unique`/);
});

test("the private admin workspace and managed catalog are configured", async () => {
  const [hosting, adminPage, adminAuth, adminApi, uploadApi, mediaApi, panel, storefront, css, migration, mediaMigration] = await Promise.all([
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
    readFile(new URL("app/admin-auth.ts", root), "utf8"),
    readFile(new URL("app/api/admin/catalog/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/upload/route.ts", root), "utf8"),
    readFile(new URL("app/api/admin/media/route.ts", root), "utf8"),
    readFile(new URL("app/components/AdminPanel.tsx", root), "utf8"),
    readFile(new URL("app/components/FarmoseSite.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("drizzle/0001_exotic_scarecrow.sql", root), "utf8"),
    readFile(new URL("drizzle/0002_lazy_pepper_potts.sql", root), "utf8"),
  ]);
  assert.match(hosting, /"r2": "MEDIA"/);
  assert.match(adminPage, /getChatGPTUser/);
  assert.match(adminPage, /target="_top"/);
  assert.match(adminPage, /getAdminAccess/);
  assert.match(adminAuth, /FARMOSE_ADMIN_EMAILS/);
  assert.match(adminApi, /requireAdminApi/);
  assert.match(uploadApi, /farmose-temp/);
  assert.match(uploadApi, /MAX_CHUNK_BYTES/);
  assert.match(panel, /Save product/);
  assert.match(panel, /Publish appearance/);
  assert.match(panel, /Choose video from device/);
  assert.match(panel, /YOUR MEDIA LIBRARY/);
  assert.match(panel, /multiple/);
  assert.match(panel, /themeImageControl/);
  assert.match(panel, /readApiResponse/);
  assert.match(mediaApi, /bucket\.list/);
  assert.match(storefront, /product-video-block/);
  assert.match(storefront, /FaWhatsapp/);
  assert.match(css, /\.top-navigation \{ position: sticky/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /width: min\(430px/);
  assert.match(migration, /CREATE TABLE `catalog_products`/);
  assert.match(migration, /CREATE TABLE `site_settings`/);
  assert.match(mediaMigration, /ADD `video` text/);
});

test("the disposable starter preview is gone", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);
  const combined = `${page}\n${layout}\n${packageJson}`;
  assert.doesNotMatch(combined, /codex-preview|SkeletonPreview|react-loading-skeleton/);
  assert.match(layout, /Clean Local Food in Freetown/);
});
