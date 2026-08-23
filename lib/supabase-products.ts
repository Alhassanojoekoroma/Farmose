import { createClient } from "@supabase/supabase-js";
import { env } from "./cloudflare-env";

type SupabaseProduct = Record<string, unknown> & { slug: string; short_name?: string; shortName?: string };

function getSupabaseAdmin() {
  const runtime = env as unknown as Record<string, string | undefined>;
  const url = runtime.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = runtime.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) throw new Error("Supabase product storage is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function saveProductToSupabase(product: SupabaseProduct) {
  const { shortName, ...rest } = product;
  const row = { ...rest, short_name: product.short_name ?? shortName, updated_at: new Date().toISOString() };
  const { error } = await getSupabaseAdmin().from("products").upsert(row, { onConflict: "slug" });
  if (error) throw error;
}

export async function deleteProductFromSupabase(slug: string) {
  const { error } = await getSupabaseAdmin().from("products").delete().eq("slug", slug);
  if (error) throw error;
}
