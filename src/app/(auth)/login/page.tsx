// src/app/(auth)/login/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/ws/p1";

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, password: pw }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j?.message || "로그인 실패");
        setLoading(false);
        return;
      }
      router.replace(next);
    } catch {
      setErr("네트워크 오류");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50">
      <div className="w-[360px] rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-center mb-6">
          <img src="/logos/IDEAL.png" className="h-7" alt="IDEA" />
          <img src="/logos/Lab.png" className="h-7 -ml-4 relative z-10" alt="Lab" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="아이디"
            autoComplete="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-3 text-center text-sm text-neutral-600">
          계정이 없나요? <a href="/signup" className="text-blue-600 hover:underline">회원가입</a>
        </div>
      </div>
    </div>
  );
}
