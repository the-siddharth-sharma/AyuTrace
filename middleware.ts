import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

// All web UI routes that require an authenticated healthcare session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inventory",
  "/scanner",
  "/expiry",
  "/facilities",
  "/transfers",
  "/settings",
  "/analytics",
];

// Routes only accessible to unauthenticated guests
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasValidCookie = Boolean(sessionCookie && sessionCookie.trim().length >= 32);

  // 1. Guard Clinical API Endpoints (Reject unauthenticated callers with 401 JSON)
  if (pathname.startsWith("/api/")) {
    const isPublicApi =
      pathname.startsWith("/api/auth/login") ||
      pathname.startsWith("/api/auth/register") ||
      pathname.startsWith("/api/auth/forgot-password") ||
      pathname.startsWith("/api/auth/logout") ||
      (pathname === "/api/facilities" && request.method === "GET");

    if (!isPublicApi && !hasValidCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Active clinical authentication session required.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 2. Guard protected portal pages
  if (isProtectedRoute) {
    if (!hasValidCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Prevent caching of protected route redirects
      redirectResponse.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );
      redirectResponse.headers.set("Pragma", "no-cache");
      redirectResponse.headers.set("Expires", "0");
      return redirectResponse;
    }

    // Set aggressive anti-caching headers on all protected HTML pages to prevent bfcache leaks
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // 3. Redirect authenticated users away from /login and /register to /dashboard
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAuthRoute && hasValidCookie) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all application and API paths except for static bundles & images:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png, *.svg, *.png, *.jpg, *.jpeg
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
