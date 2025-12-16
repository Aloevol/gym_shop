import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IUser } from "@/server/models/user/user.interfce";
import { USER_ROLE } from "@/enum/user.enum";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedRoutes = ["/profile"];
  const adminRoutes = ["/dashboard"];

  if (path.startsWith("/_next") || path.startsWith("/icon.png")) {
    return NextResponse.next();
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
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};