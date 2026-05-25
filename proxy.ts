import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/chat", "/partner-chat"];
const publicRoutes = ["/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  // Allow API routes, static files, and _next
  if (
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.startsWith("/static") ||
    path === "/" ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({
    req,
    secret,
  });

  // Redirect unauthenticated users to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$).*)"],
};
