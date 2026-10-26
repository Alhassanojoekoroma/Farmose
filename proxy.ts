import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "./lib/auth/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.replace(/\/$/, "") === "/admin/login") {
    return NextResponse.next();
  }
  // Refresh session cookies before rendering. API routes still enforce every role and permission.
  return getAuth().middleware({ loginUrl: "/admin/login" })(request);
}

export const config = { matcher: ["/admin/:path*"] };
