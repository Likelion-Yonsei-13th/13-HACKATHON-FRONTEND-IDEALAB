// src/app/(auth)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ENDPOINTS } from "@/lib/endpoints";

export default function SignupPage() {
  const router = useRouter();

  // 상태값
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
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
      const r = await fetch(ENDPOINTS.auth.signup, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // 세션/쿠키 인증이라면 아래 주석 해제
        // credentials: "include",
        body: JSON.stringify({
          name,
          nickname,
          email,
          password: pw,
        }),
      });

      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j?.message || `회원가입 실패 (HTTP ${r.status})`);
        setLoading(false);
        return;
      }

      router.replace("/login"); // 가입 후 로그인 페이지로 이동
    } catch {
      setErr("네트워크 오류");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-[420px] rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="text-center text-2xl font-semibold mb-6">회원가입</h2>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <input
              className="w-1/2 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-1/2 rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="별명"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>

          <input
            type="email"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="이메일 (you@example.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="비밀번호 확인"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
            minLength={6}
          />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <label className="flex items-center text-sm text-neutral-700">
            <input type="checkbox" required className="mr-2" /> 개인정보 수집 및 이용에 동의합니다.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "처리 중..." : "가입 완료"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-neutral-600">
          이미 계정이 있나요?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            로그인
          </a>
        </div>
      </div>
    </div>
  );
}
