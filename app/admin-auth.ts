import { query } from "../lib/postgres";
import { getAuth } from "../lib/auth/server";
import { adminPermissions, canAdminPerform, resolveAdminRole, rolePermissions, validPermissions, type AdminPermission, type AdminRole } from "../lib/permissions";

export { adminPermissions, rolePermissions, validPermissions };
export type { AdminPermission, AdminRole };
export type AdminSession = {
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

function ownerEmails() {
  return (process.env.FARMOSE_OWNER_EMAILS || "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isOwnerEmail(email: string) {
  return ownerEmails().includes(email.trim().toLowerCase());
}

export function hasAdminPermission(user: AdminSession, permission: AdminPermission) {
  return canAdminPerform(user, permission);
}

export async function canRegisterAdmin(email: string) {
  const normalized = email.trim().toLowerCase();
  if (isOwnerEmail(normalized)) return true;
  const rows = await query<{ active: boolean }>("SELECT active FROM admin_users WHERE email = $1", [normalized]);
  return rows[0]?.active === true;
}

export async function getAdminAccess(user: { email: string; name?: string | null; emailVerified?: boolean }): Promise<AdminSession | null> {
  const normalized = user.email.trim().toLowerCase();
  if (!user.emailVerified) return null;
  if (isOwnerEmail(normalized)) {
    return { email: normalized, displayName: user.name || normalized, role: "owner", permissions: [...adminPermissions] };
  }
  const rows = await query<{ display_name: string; role: string; permissions: string[]; active: boolean }>(
    "SELECT display_name, role, permissions, active FROM admin_users WHERE email = $1",
    [normalized],
  );
  const record = rows[0];
  if (!record?.active) return null;
  const access = resolveAdminRole(record.role, record.permissions);
  if (!access) return null;
  return { email: normalized, displayName: record.display_name || user.name || normalized, ...access };
}

export async function getAdminUser(): Promise<AdminSession | null> {
  const { data } = await getAuth().getSession();
  return data?.user ? getAdminAccess(data.user) : null;
}

export async function requireAdminApi(permission?: AdminPermission, request?: Request): Promise<AdminSession | Response> {
  if (request && !["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: "A same-origin request is required." }, { status: 403 });
    }
  }
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Administrator access is required." }, { status: 401 });
  if (permission && !hasAdminPermission(user, permission)) {
    return Response.json({ error: "Your staff permissions do not allow this action." }, { status: 403 });
  }
  return user;
}
