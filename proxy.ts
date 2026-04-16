import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IUser } from "@/server/models/user/user.interfce";
import { USER_ROLE } from "@/enum/user.enum";
import { isAllowedStorefrontPath } from "@/lib/storefront";

const INTERNAL_PREFIXES = ["/api", "/auth", "/dashboard", "/profile"];
const STATIC_FILE_REGEX = /\.[^/]+$/;

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedRoutes = ["/profile"];
  const adminRoutes = ["/dashboard"];

  if (path.startsWith("/_next") || path === "/icon.png" || STATIC_FILE_REGEX.test(path)) {
    return NextResponse.next();
  }

  const isInternalRoute = INTERNAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  const isAllowedStorefrontRoute = isAllowedStorefrontPath(path);

  if (!isInternalRoute && !isAllowedStorefrontRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const token = request.cookies.get("user")?.value || null;
  if ((!token || token === "undefined" || token === "null") && (protectedRoutes.includes(path) || adminRoutes.includes(path))) {
    const loginUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(loginUrl);
  }
  if (!token) return NextResponse.next();

  let user: IUser | null = null;
  try {
    user = JSON.parse(token);
  } catch (err) {
    console.error("Invalid token JSON:", err);
    const loginUrl = new URL("/auth/signin", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  if (user?.role !== USER_ROLE.ADMIN && adminRoutes.includes(path)) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
