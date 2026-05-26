import { auth } from "@/lib/auth";

export default auth((req) => {
  const isAuth = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. Allow access to login page for non-authenticated users
  if (pathname === "/login") {
    if (isAuth) {
      return Response.redirect(new URL("/dashboard", req.nextUrl));
    }
    return null;
  }

  // 2. Protect all other routes
  if (!isAuth) {
    let callbackUrl = pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl));
  }

  return null;
});

// Optimized matcher to exclude static assets, public files, and NextAuth APIs
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.jpeg|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp|.*\\.ico).*)",
  ],
};
