import { query } from "./postgres";

export type PublicUpdate = {
  id: string;
  kind: "promotion" | "news" | "visit" | "program";
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  startsAt: string;
  endsAt: string | null;
  published: boolean;
};

type UpdateRow = {
  id: string; kind: PublicUpdate["kind"]; title: string; summary: string; body: string;
  image_url: string; link_url: string; starts_at: Date; ends_at: Date | null; published: boolean;
};

function mapUpdate(row: UpdateRow): PublicUpdate {
  return {
    id: row.id, kind: row.kind, title: row.title, summary: row.summary,
    body: row.body, imageUrl: row.image_url, linkUrl: row.link_url,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at?.toISOString() ?? null,
    published: row.published,
  };
}

export async function readPublicUpdates(): Promise<PublicUpdate[]> {
  const rows = await query<UpdateRow>(`SELECT id, kind, title, summary, body, image_url, link_url, starts_at, ends_at, published
    FROM public_updates
    WHERE published = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now())
    ORDER BY starts_at DESC, created_at DESC LIMIT 30`);
  return rows.map(mapUpdate);
}

export async function readAllUpdates(): Promise<PublicUpdate[]> {
  const rows = await query<UpdateRow>(`SELECT id, kind, title, summary, body, image_url, link_url, starts_at, ends_at, published
    FROM public_updates ORDER BY starts_at DESC, created_at DESC LIMIT 100`);
  return rows.map(mapUpdate);
}
