// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get("session")?.value;

  // 보호 구간: /ws, /p 등 앱 그룹
  if (pathname.startsWith("/ws")) {
    if (!hasSession) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 인증 페이지: 세션 있으면 앱으로 보냄
  if (pathname === "/login" || pathname === "/signup") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/ws/p1", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/ws/:path*", "/login", "/signup"],
};
