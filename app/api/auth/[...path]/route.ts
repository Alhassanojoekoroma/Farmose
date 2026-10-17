import type { NextRequest } from "next/server";
import { canRegisterAdmin } from "../../../admin-auth";
import { getAuth } from "../../../../lib/auth/server";

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return getAuth().handler().GET(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  if (new URL(request.url).pathname.endsWith("/sign-up/email")) {
    let email = "";
    try {
      const payload = await request.clone().json();
      email = typeof payload?.email === "string" ? payload.email : "";
    } catch {
      return Response.json({ error: "A valid sign-up request is required." }, { status: 400 });
    }
    if (!email || !await canRegisterAdmin(email)) {
      return Response.json({ error: "This email has not been approved for Farmose staff access." }, { status: 403 });
    }
  }
  return getAuth().handler().POST(request, context);
}

export async function PUT(request: NextRequest, context: Context) {
  return getAuth().handler().PUT(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return getAuth().handler().PATCH(request, context);
}

export async function DELETE(request: NextRequest, context: Context) {
  return getAuth().handler().DELETE(request, context);
}
