import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import { selectExperienceCatalog } from "../app/experience-catalog.ts";
import { POST as submitLegacyOrder } from "../app/api/orders/route.ts";

const root = new URL("../", import.meta.url);
const design = ["honey", "groundnut-paste", "cayenne-pepper", "keinda", "palm-oil", "benny", "tola", "groundnut-paste-2kg"];

test("the launch catalog contains the eight ZIP products and excludes the former catalog", () => {
  const all = [
    ...design.map((slug) => ({ slug: `pantry-${slug}`, siteVisible: true })),
    { slug: "seafood-bundle", siteVisible: false },
    { slug: "chicken", siteVisible: false },
  ];
  const selected = selectExperienceCatalog(all, design.map((slug) => `pantry-${slug}`));
  assert.deepEqual(selected.products.map((product) => product.slug), design.map((slug) => `pantry-${slug}`));
  assert.deepEqual(selected.hiddenDesignSlugs, []);
});

test("admin visibility changes hide a ZIP product without deleting it", () => {
  const all = design.map((slug) => ({ slug: `pantry-${slug}`, siteVisible: slug !== "honey" }));
  const selected = selectExperienceCatalog(all, design.map((slug) => `pantry-${slug}`));
  assert.equal(selected.products.some((product) => product.slug === "pantry-honey"), false);
  assert.deepEqual(selected.hiddenDesignSlugs, ["honey"]);
  assert.equal(all.some((product) => product.slug === "pantry-honey"), true);
});

test("the supplied product artwork is packaged for every launch product", async () => {
  const images = ["honey", "groundnut-950", "pepper", "keinda", "palm-oil", "benny", "tola", "groundnut-2kg"];
  for (const name of images) {
    const file = await stat(new URL(`public/farmose/img/${name}.webp`, root));
    assert.ok(file.size > 1000, `${name} image is empty`);
  }
});

test("the retired checkout cannot store client-supplied prices", async () => {
  const response = await submitLegacyOrder();
  assert.equal(response.status, 410);
});
