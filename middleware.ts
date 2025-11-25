import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/about",
  "/login",
  "/register",
  "/auth/login",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot",
  "/forgot",
  "/auth/reset",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  // No public APIs except NextAuth
  if (pathname.startsWith("/auth/reset")) return true;
  if (pathname.startsWith("/auth/forgot")) return true;
  if (pathname.startsWith("/share/")) return true;
  if (pathname === "/share") return true;
  return false;
}

function isAuthPage(pathname: string): boolean {
  return (
    pathname === "/auth/login" ||
    pathname === "/auth/signin" ||
    pathname === "/auth/signup" ||
    pathname === "/auth/forgot" ||
    pathname.startsWith("/auth/reset") ||
    pathname === "/login" ||
    pathname === "/register"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // No special-casing for public APIs

  const isAuthApi = pathname.startsWith("/api/auth");
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Unauthenticated flow
  if (!token) {
    // API protection (except auth endpoints)
    if (pathname.startsWith("/api") && !isAuthApi) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Public pages allowed, protected pages redirected to login with callback
    if (!isPublicPath(pathname)) {
      const loginPath = "/auth/login"; // aligned with NextAuth pages.signIn
      const loginUrl = new URL(loginPath, req.url);
      const callbackUrl = pathname + (search || "");
      loginUrl.searchParams.set("callbackUrl", callbackUrl);
      return NextResponse.redirect(loginUrl);
    }

    // Public route and unauthenticated: allow
    return NextResponse.next();
  }

  // Authenticated flow: keep users away from public pages (auth pages, home, about)
  if (isAuthPage(pathname) || pathname === "/" || pathname === "/about") {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Apply to all routes except Next.js internals, static assets, and API routes.
export const config = {
  matcher: [
    // All request paths except for static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.\\w+$).*)",
    // Include API routes (middleware will still allow /api/auth/* as public)
    "/api/:path*",
  ],
};
