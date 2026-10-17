import Link from "next/link";
import { getAuth } from "../../lib/auth/server";
import { getAdminAccess } from "../admin-auth";
import { AdminPanel } from "../components/AdminPanel";
import { AdminLogin, SignOutButton } from "../components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data } = await getAuth().getSession();
  const user = data?.user;
  if (!user) return <AdminLogin />;

  if (!user.emailVerified) {
    return <AdminLogin initialEmail={user.email} verificationRequired />;
  }

  const admin = await getAdminAccess(user);
  if (!admin) {
    return (
      <main className="admin-denied">
        <div>
          <p>PRIVATE FARMOSE WORKSPACE</p>
          <h1>This account is not approved for Farmose administration.</h1>
          <p>Ask the owner to add your email to the staff list.</p>
          <SignOutButton />
          <Link href="/">Return to the storefront</Link>
        </div>
      </main>
    );
  }
  return <AdminPanel adminName={admin.displayName} adminRole={admin.role} permissions={admin.permissions} />;
}
