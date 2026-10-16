import { requireAdminApi } from "../../../admin-auth";

/** The admin panel now saves and deletes D1 products through /api/admin/catalog. */
async function retiredProductRoute() {
  const auth = await requireAdminApi("products");
  if (auth instanceof Response) return auth;
  return Response.json({ error: "Use the current catalog editor." }, { status: 410 });
}

export const POST = retiredProductRoute;
export const DELETE = retiredProductRoute;
