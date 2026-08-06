import assert from "node:assert/strict";
import test from "node:test";
import { validateProductImageFile } from "../lib/image-validation.ts";

test("accepts supported image files within the size limit", () => {
  const file = new File([new Uint8Array(1024)], "product.jpg", { type: "image/jpeg" });
  assert.equal(validateProductImageFile(file), null);
});

test("rejects unsupported image formats", () => {
  const file = new File([new Uint8Array(1024)], "product.gif", { type: "image/gif" });
  assert.match(validateProductImageFile(file), /JPEG, PNG, WebP, or AVIF/);
});

test("rejects oversized images", () => {
  const largeBytes = new Uint8Array(6 * 1024 * 1024);
  const file = new File([largeBytes], "product.png", { type: "image/png" });
  assert.match(validateProductImageFile(file), /5 MB/);
});
