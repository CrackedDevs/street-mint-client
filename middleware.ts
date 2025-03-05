import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if the path starts with /admin
  if (path.startsWith("/admin")) {
    // Exclude the login page from protection
    if (path === "/admin") {
      return NextResponse.next();
    }

    // Check if the user has an admin auth cookie
    const adminAuth = request.cookies.get("admin-auth");

    if (!adminAuth || !adminAuth.value) {
      // Redirect to the admin login page if no auth cookie exists
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only on admin routes
export const config = {
  matcher: "/admin/:path*",
};
