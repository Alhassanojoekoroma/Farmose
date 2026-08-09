import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { getAdminAccess } from "../admin-auth";
import { AdminPanel } from "../components/AdminPanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
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
