import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // 즉시 만료
  res.headers.append(
    "Set-Cookie",
    `auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return res;
}
