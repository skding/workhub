import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "workhub_pnc_secret_key_engineering_daily_ops_2026"
);

const COOKIE_NAME = "workhub_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Immediately pass through any WebSocket / Upgrade requests (Turbopack HMR / Fast Refresh)
  if (
    request.headers.get("upgrade")?.toLowerCase() === "websocket" ||
    request.headers.get("connection")?.toLowerCase().includes("upgrade")
  ) {
    return NextResponse.next();
  }

  // 2. Pass through internal Next.js paths, Turbopack, static files, and login API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 3. Read session token from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload && payload.userId) {
        isAuthenticated = true;
      }
    } catch (err) {
      // Invalid or expired token
      isAuthenticated = false;
    }
  }

  // 4. Handle /login route
  if (pathname === "/login") {
    // If already logged in, redirect to dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 5. If not authenticated:
  if (!isAuthenticated) {
    // For API requests, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to access this resource." },
        { status: 401 }
      );
    }

    // For web page requests, redirect to /login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Support both proxy (Next 16) and middleware (backward compatibility)
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (Next.js internals, Turbopack HMR, chunks)
     * - static files with extensions (.ico, .png, .jpg, .svg, .css, .js)
     */
    "/((?!_next|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
