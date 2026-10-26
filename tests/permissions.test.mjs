import assert from "node:assert/strict";
import test from "node:test";
import { adminPermissions, canAdminPerform, resolveAdminRole, rolePermissions } from "../lib/permissions.ts";

test("only the owner can grant and revoke staff access", () => {
  assert.equal(canAdminPerform({ role: "owner", permissions: rolePermissions.owner }, "team"), true);
  for (const role of ["editor", "orders", "content", "media", "updates", "custom"]) {
    assert.equal(canAdminPerform({ role, permissions: [...adminPermissions] }, "team"), false);
  }
});

test("preset staff roles only reach their assigned business areas", () => {
  for (const role of ["editor", "orders", "content", "media", "updates"]) {
    for (const permission of adminPermissions) {
      assert.equal(canAdminPerform({ role, permissions: rolePermissions[role] }, permission),
        rolePermissions[role].includes(permission), `${role} / ${permission}`);
    }
  }
});

test("a trusted business owner receives full control without relying on a developer email", () => {
  const owner = resolveAdminRole("owner", []);
  assert.deepEqual(owner, { role: "owner", permissions: [...adminPermissions] });
  assert.equal(canAdminPerform(owner, "team"), true);
});

test("staff cannot acquire team management through a forged permission list", () => {
  for (const role of ["editor", "orders", "content", "media", "updates", "custom"]) {
    assert.equal(resolveAdminRole(role, ["products", "team"]), null);
  }
  assert.equal(resolveAdminRole("administrator", [...adminPermissions]), null);
});

test("custom permissions remain limited to selected business areas", () => {
  assert.deepEqual(resolveAdminRole("editor", ["products"]), { role: "custom", permissions: ["products"] });
  assert.deepEqual(resolveAdminRole("updates", ["updates"]), { role: "updates", permissions: ["updates"] });
  assert.equal(resolveAdminRole("custom", []), null);
  assert.equal(resolveAdminRole("custom", ["unknown"]), null);
});
