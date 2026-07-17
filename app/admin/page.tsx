import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { isAdminEmail } from "../admin-auth";
import { AdminPanel } from "../components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="admin-denied">
        <div>
          <p>PRIVATE FARMOSE WORKSPACE</p>
          <h1>This account does not have administrator access.</h1>
          <a href={chatGPTSignOutPath("/")}>Return to the storefront</a>
        </div>
      </main>
    );
  }

  return <AdminPanel adminName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
