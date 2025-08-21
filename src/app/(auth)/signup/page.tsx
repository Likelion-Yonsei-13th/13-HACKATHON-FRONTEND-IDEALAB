"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (pw !== pw2) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      // 데모: 서버 검증/저장 없이 200만 응답하는 API
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
      // 가입 완료 → 로그인으로
      router.replace("/login");
    } catch {
      setErr("네트워크 오류");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-neutral-50">
      <div className="w-[360px] rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-center mb-4">회원가입</h1>

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

          <div className="text-center text-sm">
            이미 계정이 있나요?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              로그인
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
