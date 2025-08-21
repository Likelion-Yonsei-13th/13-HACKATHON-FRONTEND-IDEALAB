import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 데모: 아이디/비번 무조건 통과
  const res = NextResponse.json({ ok: true });
  res.headers.append(
    "Set-Cookie",
    `auth=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
  );
  return res;
}
