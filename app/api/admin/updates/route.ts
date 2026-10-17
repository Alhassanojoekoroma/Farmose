import { requireAdminApi } from "../../../admin-auth";
import { query } from "../../../../lib/postgres";
import { readAllUpdates, type PublicUpdate } from "../../../../lib/updates";

const kinds = ["promotion", "news", "visit", "program"];

function safeUrl(value: unknown, image = false): string | null {
  if (value === "" || value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > 1000) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && (!image || !url.username && !url.password)) return url.toString();
  } catch { /* Invalid URL. */ }
  return null;
}

export async function GET() {
  const auth = await requireAdminApi("updates");
  if (auth instanceof Response) return auth;
  try { return Response.json({ updates: await readAllUpdates() }); }
  catch (error) {
    console.error("Update listing failed", error);
    return Response.json({ error: "Updates are temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi("updates", request);
  if (auth instanceof Response) return auth;
  let payload: Partial<PublicUpdate>;
  try { payload = await request.json(); }
  catch { return Response.json({ error: "A valid update is required." }, { status: 400 }); }
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const imageUrl = safeUrl(payload.imageUrl, true);
  const linkUrl = safeUrl(payload.linkUrl);
  const startsAt = new Date(payload.startsAt || "");
  const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;
  if (!kinds.includes(payload.kind || "") || !title || title.length > 160 || summary.length > 350 ||
    body.length > 6000 || imageUrl === null || linkUrl === null || !Number.isFinite(startsAt.getTime()) ||
    (endsAt && (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt))) {
    return Response.json({ error: "Check the title, dates, text and links. The end must follow the start." }, { status: 400 });
  }
  const id = payload.id && /^[0-9a-f-]{36}$/i.test(payload.id) ? payload.id : crypto.randomUUID();
  try {
    await query(`INSERT INTO public_updates
      (id, kind, title, summary, body, image_url, link_url, starts_at, ends_at, published, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now())
      ON CONFLICT (id) DO UPDATE SET kind=EXCLUDED.kind, title=EXCLUDED.title,
      summary=EXCLUDED.summary, body=EXCLUDED.body, image_url=EXCLUDED.image_url,
      link_url=EXCLUDED.link_url, starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at,
      published=EXCLUDED.published, updated_at=now()`,
      [id, payload.kind, title, summary, body, imageUrl, linkUrl, startsAt.toISOString(),
        endsAt?.toISOString() ?? null, payload.published === true]);
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("Update save failed", error);
    return Response.json({ error: "The update could not be saved." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi("updates", request);
  if (auth instanceof Response) return auth;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "A valid update is required." }, { status: 400 });
  await query("DELETE FROM public_updates WHERE id = $1", [id]);
  return Response.json({ ok: true });
}
