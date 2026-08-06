import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  address: text("address").notNull(),
  area: text("area").notNull(),
  notes: text("notes").notNull().default(""),
  paymentMethod: text("payment_method").notNull(),
  itemsJson: text("items_json").notNull(),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogProducts = sqliteTable("catalog_products", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  category: text("category").notNull(),
  tag: text("tag").notNull(),
  price: real("price").notNull(),
  unit: text("unit").notNull(),
  image: text("image").notNull(),
  imageUrl: text("image_url"),
  imagePublicId: text("image_public_id"),
  additionalImagesJson: text("additional_images_json").notNull().default("[]"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  video: text("video").notNull().default(""),
  imagePosition: text("image_position").notNull().default("center"),
  color: text("color").notNull(),
  rating: real("rating").notNull().default(5),
  reviews: integer("reviews").notNull().default(0),
  description: text("description").notNull(),
  details: text("details").notNull(),
  featuresJson: text("features_json").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
