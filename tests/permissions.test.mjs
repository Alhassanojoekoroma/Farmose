import assert from "node:assert/strict";
import test from "node:test";
import { adminPermissions, canAdminPerform, rolePermissions } from "../lib/permissions.ts";

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
