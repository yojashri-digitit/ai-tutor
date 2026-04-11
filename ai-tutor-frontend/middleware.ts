// middleware.ts (ROOT of project)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken"); // ✅ FIXED

  const { pathname } = req.nextUrl;

  ////////////////////////////////////////////
  // 🔐 PROTECTED ROUTES
  ////////////////////////////////////////////
  const protectedRoutes = ["/home", "/notes", "/ppt", "/chat"];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  ////////////////////////////////////////////
  // 🚫 PREVENT ACCESS TO LOGIN IF ALREADY LOGGED IN
  ////////////////////////////////////////////
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

//////////////////////////////////////////////////////
// 🔥 VERY IMPORTANT (MATCHER)
//////////////////////////////////////////////////////

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};