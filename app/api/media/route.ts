import { publicMediaUrl } from "../../../lib/media-storage";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!/^farmose\/[a-zA-Z0-9._/-]+$/.test(key)) return new Response("Not found", { status: 404 });
  try {
    return Response.redirect(publicMediaUrl(key), 307);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
