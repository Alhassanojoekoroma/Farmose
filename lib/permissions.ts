export const adminPermissions = ["products", "content", "media", "orders", "team", "updates"] as const;
export type AdminPermission = (typeof adminPermissions)[number];
export type AdminRole = "owner" | "editor" | "orders" | "content" | "media" | "updates" | "custom";

export const rolePermissions: Record<Exclude<AdminRole, "custom">, AdminPermission[]> = {
  owner: [...adminPermissions],
  editor: ["products", "content", "media", "updates"],
  orders: ["orders"],
  content: ["content", "updates"],
  media: ["media"],
  updates: ["updates"],
};

export function validPermissions(value: unknown): AdminPermission[] | null {
  if (!Array.isArray(value) || value.some((item) => !adminPermissions.includes(item))) return null;
  return [...new Set(value)] as AdminPermission[];
}

export function resolveAdminRole(role: unknown, value: unknown): { role: AdminRole; permissions: AdminPermission[] } | null {
  if (role === "owner") return { role, permissions: [...rolePermissions.owner] };
  if (typeof role !== "string" || !["editor", "orders", "content", "media", "updates", "custom"].includes(role)) return null;
  const permissions = validPermissions(value);
  if (!permissions?.length || permissions.includes("team")) return null;
  const preset = role !== "custom" ? rolePermissions[role as Exclude<AdminRole, "owner" | "custom">] : null;
  const matchesPreset = preset && preset.length === permissions.length && preset.every((item) => permissions.includes(item));
  return { role: matchesPreset ? role as AdminRole : "custom", permissions };
}

export function canAdminPerform(
  user: { role: AdminRole; permissions: AdminPermission[] },
  permission: AdminPermission,
) {
  return (permission !== "team" || user.role === "owner") && user.permissions.includes(permission);
}
