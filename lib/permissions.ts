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

export function canAdminPerform(
  user: { role: AdminRole; permissions: AdminPermission[] },
  permission: AdminPermission,
) {
  return (permission !== "team" || user.role === "owner") && user.permissions.includes(permission);
}
