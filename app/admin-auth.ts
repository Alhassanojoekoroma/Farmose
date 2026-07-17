import { env } from "cloudflare:workers";
import { getChatGPTUser, ChatGPTUser } from "./chatgpt-auth";

function configuredAdminEmails() {
  const value =
    (env as unknown as Record<string, string | undefined>).FARMOSE_ADMIN_EMAILS ??
    process.env.FARMOSE_ADMIN_EMAILS ??
    "";
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export async function getAdminUser(): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function requireAdminApi() {
  const user = await getAdminUser();
  if (!user) {
    return Response.json({ error: "Administrator access is required." }, { status: 403 });
  }
  return user;
}
