import { eq } from "drizzle-orm";
import { requireAdminApi } from "../../../admin-auth";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";

const statuses = ["new", "confirmed", "preparing", "out-for-delivery", "completed", "cancelled"];

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const payload = (await request.json()) as { id?: number; status?: string };
  if (!payload.id || !payload.status || !statuses.includes(payload.status)) {
    return Response.json({ error: "A valid order and status are required." }, { status: 400 });
  }
  await getDb().update(orders).set({ status: payload.status }).where(eq(orders.id, payload.id));
  return Response.json({ ok: true });
}
