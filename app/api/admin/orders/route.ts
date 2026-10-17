import { requireAdminApi } from "../../../admin-auth";
import { query } from "../../../../lib/postgres";

const statuses = ["new", "confirmed", "preparing", "out-for-delivery", "completed", "cancelled"];

export async function PATCH(request: Request) {
  const auth = await requireAdminApi("orders", request);
  if (auth instanceof Response) return auth;
  let payload: { id?: number; status?: string };
  try { payload = await request.json(); } catch { return Response.json({ error: "A valid order update is required." }, { status: 400 }); }
  if (!Number.isInteger(payload.id) || !payload.id || !payload.status || !statuses.includes(payload.status)) {
    return Response.json({ error: "A valid order and status are required." }, { status: 400 });
  }
  const updated = await query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING id", [payload.status, payload.id]);
  if (!updated.length) return Response.json({ error: "Order not found." }, { status: 404 });
  return Response.json({ ok: true });
}
