// middleware.ts (프로젝트 루트)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const loggedIn = req.cookies.get("session")?.value === "1"; // /api/login에서 설정했던 그 쿠키

  // 1) 루트는 항상 /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2) 비로그인 사용자가 워크스페이스 접근 시 로그인으로
  if (!loggedIn && pathname.startsWith("/ws")) {
    const next = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, req.url));
  }

  // 3) 로그인 사용자가 /login 또는 /signup 들어오면 기본 워크스페이스로
  if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/ws/p1", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/ws/:path*"],
};
