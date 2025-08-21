import { NextResponse } from "next/server";

export async function POST() {
  // 실제로는 DB 저장/중복체크 필요
  return NextResponse.json({ ok: true });
}
