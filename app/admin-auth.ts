import { eq } from "drizzle-orm";
import { env } from "../lib/cloudflare-env";
import { getDb } from "../db";
import { adminUsers } from "../db/schema";
import { getChatGPTUser, ChatGPTUser } from "./chatgpt-auth";

export type AdminRole = "owner" | "editor" | "orders";
export type AdminPermission = "products" | "content" | "media" | "orders" | "team";
export type AdminSession = ChatGPTUser & { role: AdminRole };

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["products", "content", "media", "orders", "team"],
  editor: ["products", "content", "media"],
  orders: ["orders"],
};

function configuredAdminEmails() {
  const value =
    (env as unknown as Record<string, string | undefined>).FARMOSE_ADMIN_EMAILS ??
    process.env.FARMOSE_ADMIN_EMAILS ??
    "";
  return value.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

async function ensureAdminUsersTable() {
  const d1 = env.DB;
  if (!d1) return;
  await d1.prepare(`CREATE TABLE IF NOT EXISTS admin_users (
    email text PRIMARY KEY NOT NULL,
    display_name text NOT NULL,
    role text DEFAULT 'editor' NOT NULL,
    active integer DEFAULT true NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`).run();
}

export function isAdminEmail(email: string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  return rolePermissions[role].includes(permission);
}

export async function getAdminAccess(email: string, fallbackName = email): Promise<AdminSession | null> {
  const normalized = email.trim().toLowerCase();
  try { await ensureAdminUsersTable(); } catch { /* The configured owner can still sign in during a database outage. */ }
  if (isAdminEmail(normalized)) {
    return { email: normalized, displayName: fallbackName, fullName: fallbackName, role: "owner" };
  }
  try {
    const rows = await getDb().select().from(adminUsers).where(eq(adminUsers.email, normalized)).limit(1);
    const record = rows[0];
    if (!record?.active || !["editor", "orders"].includes(record.role)) return null;
    return {
      email: normalized,
      displayName: record.displayName || fallbackName,
      fullName: record.displayName || null,
      role: record.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<AdminSession | null> {
  const user = await getChatGPTUser();
  return user ? getAdminAccess(user.email, user.displayName) : null;
}

export async function requireAdminApi(permission?: AdminPermission) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Administrator access is required." }, { status: 403 });
  if (permission && !hasAdminPermission(user.role, permission)) {
    return Response.json({ error: "Your staff role does not allow this action." }, { status: 403 });
  }
  return user;
}
