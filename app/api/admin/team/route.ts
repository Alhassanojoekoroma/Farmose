import { asc, eq } from "drizzle-orm";
import { requireAdminApi } from "../../../admin-auth";
import { getDb } from "../../../../db";
import { adminUsers } from "../../../../db/schema";

const roles = ["editor", "orders"] as const;

function databaseUnavailable(error: unknown) {
  console.error("Staff access database operation failed", error);
  return Response.json({ error: "The staff access database is temporarily unavailable." }, { status: 503 });
}

export async function GET() {
  const auth = await requireAdminApi("team");
  if (auth instanceof Response) return auth;
  try {
    const users = await getDb().select().from(adminUsers).orderBy(asc(adminUsers.displayName));
    return Response.json({ users });
  } catch (error) {
    return databaseUnavailable(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi("team");
  if (auth instanceof Response) return auth;
  const payload = (await request.json()) as { email?: string; displayName?: string; role?: string; active?: boolean };
  const email = payload.email?.trim().toLowerCase() ?? "";
  const displayName = payload.displayName?.trim() ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email) || !displayName || !roles.includes(payload.role as (typeof roles)[number])) {
    return Response.json({ error: "Enter a valid email, staff name and role." }, { status: 400 });
  }
  try {
    await getDb().insert(adminUsers).values({ email, displayName, role: payload.role!, active: payload.active !== false, updatedAt: new Date().toISOString() }).onConflictDoUpdate({
      target: adminUsers.email,
      set: { displayName, role: payload.role!, active: payload.active !== false, updatedAt: new Date().toISOString() },
    });
    return Response.json({ ok: true });
  } catch (error) {
    return databaseUnavailable(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi("team");
  if (auth instanceof Response) return auth;
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) return Response.json({ error: "A staff email is required." }, { status: 400 });
  try {
    await getDb().delete(adminUsers).where(eq(adminUsers.email, email));
    return Response.json({ ok: true });
  } catch (error) {
    return databaseUnavailable(error);
  }
}
