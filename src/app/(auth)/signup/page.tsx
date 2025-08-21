// src/app/(auth)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, password: pw }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j?.message || "회원가입 실패");
        setLoading(false);
        return;
      }
      router.replace("/login");
    } catch {
      setErr("네트워크 오류");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50">
      <div className="w-[360px] rounded-2xl bg-white p-6 shadow">
        <h2 className="text-center text-xl font-semibold mb-4">회원가입</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="비밀번호"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="비밀번호 확인"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <div className="mt-3 text-center text-sm text-neutral-600">
          이미 계정이 있나요? <a href="/login" className="text-blue-600 hover:underline">로그인</a>
        </div>
      </div>
    </div>
  );
}
