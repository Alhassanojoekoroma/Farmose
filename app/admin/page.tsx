import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";
import { getAdminAccess } from "../admin-auth";
import { AdminPanel } from "../components/AdminPanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) {
    return (
      <main className="admin-denied">
        <div>
          <p>PRIVATE FARMOSE WORKSPACE</p>
          <h1>Sign in to manage Farmose.</h1>
          <p>This area is only for approved Farmose owners and staff. Customers do not need an account to shop.</p>
          <a href={chatGPTSignInPath("/admin")} target="_top">Continue to secure staff sign-in</a>
          <Link href="/">Return to the storefront</Link>
        </div>
      </main>
    );
  }
  const admin = await getAdminAccess(user.email, user.displayName);
  if (!admin) {
    return (
      <main className="admin-denied">
        <div>
          <p>PRIVATE FARMOSE WORKSPACE</p>
          <h1>This account does not have administrator access.</h1>
          <p>Sign out, then use the approved Farmose administrator account.</p>
          <a href={chatGPTSignOutPath("/")}>Sign out</a>
          <Link href="/">Return to the storefront</Link>
        </div>
      </main>
    );
  }

  return <AdminPanel adminName={admin.displayName} adminRole={admin.role} signOutPath={chatGPTSignOutPath("/")} />;
}
