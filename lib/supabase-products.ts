import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "./supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SupabaseProductRecord = {
  id?: string;
  slug: string;
  name: string;
  short_name?: string;
  shortName?: string;
  category: string;
  tag: string;
  price: number;
  unit: string;
  image_url?: string | null;
  image_public_id?: string | null;
  additional_images?: Array<{ url: string; publicId: string }> | null;
  stock_quantity?: number | null;
  description: string;
  details: string;
  features?: string[] | null;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

export function getSupabaseBrowserProductClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function saveProductToSupabase(product: SupabaseProductRecord) {
  const client = getSupabaseAdminClient();
  const payload = {
    slug: product.slug,
    name: product.name,
    short_name: product.short_name || product.shortName || "",
    category: product.category,
    tag: product.tag,
    price: product.price,
    unit: product.unit,
    image_url: product.image_url ?? null,
    image_public_id: product.image_public_id ?? null,
    additional_images: product.additional_images ?? [],
    stock_quantity: product.stock_quantity ?? 0,
    description: product.description,
    details: product.details,
    features: product.features ?? [],
    active: product.active ?? true,
    sort_order: product.sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client.from("products").upsert(payload, { onConflict: "slug" }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProductFromSupabase(slug: string) {
  const client = getSupabaseAdminClient();
  const { error } = await client.from("products").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function getProductsFromSupabase() {
  const client = getSupabaseAdminClient();
  const { data, error } = await client.from("products").select("*").order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
