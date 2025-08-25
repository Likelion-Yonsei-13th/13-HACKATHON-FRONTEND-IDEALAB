// src/app/(auth)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ENDPOINTS } from "@/lib/endpoints";

type MaybeError = {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  non_field_errors?: string[];
};

function pickErrorMessage(j: any & MaybeError, fallback: string) {
  // 다양한 백엔드 에러 포맷을 최대한 커버
  if (j?.message) return j.message;
  if (j?.detail) return j.detail;
  if (Array.isArray(j?.non_field_errors) && j.non_field_errors[0]) return j.non_field_errors[0];
  if (j?.errors) {
    const firstKey = Object.keys(j.errors)[0];
    if (firstKey && Array.isArray(j.errors[firstKey]) && j.errors[firstKey][0]) {
      return `${firstKey}: ${j.errors[firstKey][0]}`;
    }
  }
  return fallback;
}

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 최소 유효성 검사 (클라이언트)
  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const pwStrong = useMemo(() => pw.length >= 6, [pw]);
  const canSubmit = emailValid && pwStrong && pw === pw2 && !!name && !!nickname && !loading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (pw !== pw2) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      // 다양한 백엔드 호환을 위해 몇 개 필드를 함께 전송
      // - password_confirm: 일부 서버 필수
      // - username: Django류에서 username 필드가 필요한 경우 nickname으로 대체
      // - name/full_name: 네가 쓰는 'name' 그대로 + 보조 키도 같이 보냄
      const payload = {
        name,
        full_name: name,
        nickname,
        username: nickname,
        email,
        password: pw,
        password_confirm: pw2,
      };

      const r = await fetch(ENDPOINTS.auth.signup, {
        method: "POST",
        headers: { "content-type": "application/json" },
        // 세션/쿠키 인증이라면 ↓ 주석 해제 + 서버 CORS 설정 필요
        // credentials: "include",
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({} as any));

      if (!r.ok) {
        const msg = pickErrorMessage(j, `회원가입 실패 (HTTP ${r.status})`);
        setErr(msg);
        return;
      }

      // 서버가 바로 토큰을 내려주는 경우 저장 (키 이름에 맞춰서)
      const access = j?.access || j?.token;
      if (access) localStorage.setItem("access_token", access);

      // 일반적으로는 가입 후 로그인 페이지로
      router.replace("/login");
    } catch {
      setErr("네트워크 오류");
    } finally {
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
            placeholder="비밀번호 (6자 이상)"
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
            disabled={!canSubmit}
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
