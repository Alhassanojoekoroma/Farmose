import { requireAdminApi } from "../../../admin-auth";
import { query } from "../../../../lib/postgres";

export async function GET() {
  const auth = await requireAdminApi("media");
  if (auth instanceof Response) return auth;
  try {
    const rows = await query<{ key: string; url: string; kind: "image" | "video"; size_bytes: string; uploaded_at: Date }>(
      "SELECT key, url, kind, size_bytes, uploaded_at FROM media_assets ORDER BY uploaded_at DESC LIMIT 120",
    );
    return Response.json({ media: rows.map((row) => ({
      key: row.key, url: row.url, kind: row.kind, size: Number(row.size_bytes),
      uploaded: row.uploaded_at.toISOString(),
    })) });
  } catch (error) {
    console.error("Farmose media listing failed", error);
    return Response.json({ error: "The media library is temporarily unavailable." }, { status: 503 });
  }
}
