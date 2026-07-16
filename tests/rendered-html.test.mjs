import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("the production build contains the Cloudflare worker", async () => {
  await access(new URL("dist/server/index.js", root));
  await access(new URL("dist/.openai/hosting.json", root));
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
