import { isOwnerEmail, requireAdminApi, type AdminRole } from "../../../admin-auth";
import { resolveAdminRole } from "../../../../lib/permissions";
import { query } from "../../../../lib/postgres";

function databaseUnavailable(error: unknown) {
  console.error("Staff access database operation failed", error);
  return Response.json({ error: "The staff access database is temporarily unavailable." }, { status: 503 });
}

export async function GET() {
  const auth = await requireAdminApi("team");
  if (auth instanceof Response) return auth;
  try {
    const users = await query<{ email: string; display_name: string; role: AdminRole; permissions: string[]; active: boolean }>(
      "SELECT email, display_name, role, permissions, active FROM admin_users ORDER BY display_name, email",
    );
    return Response.json({ users: users.map((user) => ({
      email: user.email, displayName: user.display_name, role: user.role,
      permissions: resolveAdminRole(user.role, user.permissions)?.permissions ?? [], active: user.active,
    })) });
  } catch (error) {
    return databaseUnavailable(error);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi("team", request);
  if (auth instanceof Response) return auth;
  let payload: { email?: string; displayName?: string; role?: AdminRole; permissions?: unknown; active?: boolean };
  try { payload = await request.json(); } catch { return Response.json({ error: "Valid staff details are required." }, { status: 400 }); }
  const email = payload.email?.trim().toLowerCase() ?? "";
  const displayName = payload.displayName?.trim() ?? "";
  const assignment = resolveAdminRole(payload.role, payload.permissions);
  if (email === auth.email) {
    return Response.json({ error: "Ask another business owner to change your account access." }, { status: 409 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email) || isOwnerEmail(email) || !displayName || displayName.length > 100 ||
    !assignment) {
    return Response.json({ error: "Enter an account email, name, role and allowed permissions." }, { status: 400 });
  }
  const { role, permissions } = assignment;
  try {
    await query(`INSERT INTO admin_users (email, display_name, role, permissions, active, updated_at)
      VALUES ($1,$2,$3,$4,$5,now())
      ON CONFLICT (email) DO UPDATE SET display_name=EXCLUDED.display_name, role=EXCLUDED.role,
      permissions=EXCLUDED.permissions, active=EXCLUDED.active, updated_at=now()`,
    [email, displayName, role, permissions, payload.active !== false]);
    return Response.json({ ok: true });
  } catch (error) {
    return databaseUnavailable(error);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi("team", request);
  if (auth instanceof Response) return auth;
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (email === auth.email) {
    return Response.json({ error: "Ask another business owner to remove your account access." }, { status: 409 });
  }
  if (!email || isOwnerEmail(email)) return Response.json({ error: "A valid staff email is required." }, { status: 400 });
  try {
    await query("DELETE FROM admin_users WHERE email = $1", [email]);
    return Response.json({ ok: true });
  } catch (error) {
    return databaseUnavailable(error);
  }
}
