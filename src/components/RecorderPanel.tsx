// File: src/components/RecorderPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ENDPOINTS } from "@/lib/endpoints";

const RightTabEmbed = dynamic(() => import("@/components/RightTabEmbed"), { ssr: false });

export type RecorderResult = {
  audioUrl: string;
  transcript: string;
  summary: string;
};

type RecStatus = "rec" | "pause" | "processing";

// ✅ 브라우저 전역 선언 (Chrome 계열)
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

/* -------------------------------------------------------
 * 유틸: 백엔드 응답 포맷을 최대한 유연하게 파싱
 *  - finalize 응답과 live minutes 응답 모두 커버
 * -----------------------------------------------------*/
type AnyJson = Record<string, any>;

function pickOverallSummary(j: AnyJson): string {
  // 대표 요약 텍스트 후보
  return (
    j?.overall_summary ??
    j?.summary ??
    j?.minutes ??
    j?.text ??
    j?.content ??
    j?.result?.overall_summary ??
    j?.result?.summary ??
    ""
  );
}

function pickTopics(j: AnyJson): string[] {
  const raw = j?.topics;
  if (!Array.isArray(raw)) return [];
  // 지원 포맷: [{topic, summary}] or [string]
  return raw.map((t: any) => {
    if (typeof t === "string") return `• ${t}`;
    const head = t?.topic || t?.title || "";
    const tail = t?.summary || t?.desc || "";
    return `• ${head}${tail ? ` — ${tail}` : ""}`;
  });
}

function pickActionItems(j: AnyJson): string[] {
  const raw = j?.action_items ?? j?.actions ?? j?.todos;
  if (!Array.isArray(raw)) return [];
  return raw.map((a: any) => {
    if (typeof a === "string") return `- ${a}`;
    return `- ${a?.text ?? a?.title ?? ""}`;
  });
}

function composeSummaryText(j: AnyJson): string {
  const lines: string[] = [];
  const overall = pickOverallSummary(j);
  if (overall) lines.push(overall.trim());

  const topics = pickTopics(j);
  if (topics.length) {
    if (lines.length) lines.push(""); // 구분 빈 줄
    lines.push("Topics:");
    lines.push(...topics);
  }

  const actions = pickActionItems(j);
  if (actions.length) {
    if (lines.length) lines.push("");
    lines.push("Action items:");
    lines.push(...actions);
  }

  // 다른 필드가 하나도 없을 때 대비
  return (lines.join("\n") || "").trim();
}

export default function RecorderPanel({
  meetingId, // 숫자 아닌 값이 오더라도 내부에서 가드
  onClose,
  onFinish,
}: {
  meetingId?: string | number;
  onClose: () => void;
  onFinish: (p: RecorderResult) => void;
}) {
  const [status, setStatus] = useState<RecStatus>("rec");
  const [partial, setPartial] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  // 🔵 3분 라이브 요약 상태
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveLatest, setLiveLatest] = useState<string>("");
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<number | null>(null);
  const [liveHistory, setLiveHistory] = useState<{ ts: number; text: string }[]>([]);
  const livePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recognitionRef = useRef<any>(null);
  const startedAtRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);

  // ✅ meetingId 숫자 변환 (숫자가 아니면 null)
  const numericMeetingId = useMemo(() => {
    if (typeof meetingId === "number") return meetingId;
    if (typeof meetingId === "string" && /^\d+$/.test(meetingId)) return Number(meetingId);
    return null;
  }, [meetingId]);

  const canCallApi = numericMeetingId != null;

  /* ====================== 서버 전송 ====================== */
  async function postChunk(text: string, start_ms: number, end_ms: number) {
    if (!canCallApi) return; // 🛑 숫자 meetingId 준비 전이면 API 호출하지 않음
    try {
      const res = await fetch(ENDPOINTS.meetings.stt.chunk(numericMeetingId!), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text, start_ms, end_ms }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.warn("[stt-chunk] error:", res.status, t);
      }
    } catch (e) {
      console.warn("[stt-chunk] network error", e);
    }
  }

  async function finalizeMeeting() {
    // meetingId가 없으면 로컬 결과만 반환
    if (!canCallApi) {
      const localSummary = (finals.join(" ").trim() || "").slice(0, 1000);
      onFinish({
        audioUrl: "",
        transcript: finals.join("\n"),
        summary: localSummary,
      });
      setSummary(localSummary);
      return;
    }

    try {
      const res = await fetch(ENDPOINTS.meetings.stt.finalize(numericMeetingId!), {
        method: "POST",
        credentials: "include",
      });
      const j: AnyJson = await res.json().catch(() => ({} as AnyJson));

      if (!res.ok) {
        console.warn("[finalize] http error", res.status, j);
      }

      // ✅ 어떤 키로 와도 요약이 보이게 파싱
      const finalSummary = composeSummaryText(j) || summary || "";
      const transcript =
        j?.transcript ||
        j?.text ||
        finals.join("\n");

      onFinish({
        audioUrl: j?.audioUrl || "",
        transcript,
        summary: finalSummary,
      });
      setSummary(finalSummary);
    } catch (e) {
      console.warn("[finalize] error", e);
      onFinish({
        audioUrl: "",
        transcript: finals.join("\n"),
        summary: summary || "",
      });
    }
  }

  /* ====================== 음성 인식 ====================== */
  function startRecognition() {
    const SR: any = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) {
      alert("이 브라우저는 실시간 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    startedAtRef.current = performance.now();
    runningRef.current = true;
    setStatus("rec");

    rec.onresult = (event: any) => {
      let interim = "";
      let finalsBatch: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalsBatch.push(r[0].transcript.trim());
        else interim += r[0].transcript;
      }

      setPartial(interim);

      if (finalsBatch.length) {
        const text = finalsBatch.join(" ");
        const now = performance.now();
        const start_ms = Math.floor(startedAtRef.current);
        const end_ms = Math.floor(now);
        setFinals((prev) => [...prev, text]);
        postChunk(text, start_ms, end_ms);
        startedAtRef.current = now;
        setPartial("");
      }
    };

    rec.onerror = (e: any) => {
      console.warn("SpeechRecognition error", e);
      if (e?.error === "not-allowed") {
        alert("마이크 권한이 차단되었습니다. 주소창 왼쪽 자물쇠 → 사이트 설정 → 마이크 '허용'으로 변경 후 새로고침하세요.");
        runningRef.current = false;
        try { rec.stop(); } catch {}
        setStatus("pause");
        return;
      }
      if (
        runningRef.current &&
        (e.error === "aborted" || e.error === "no-speech" || e.error === "audio-capture")
      ) {
        // 무음/일시적 끊김은 자동 재시작
        setTimeout(() => {
          try { rec.start(); } catch {}
        }, 500);
      }
    };

    rec.onend = () => {
      if (runningRef.current) {
        try { rec.start(); } catch {}
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.error(e);
      alert("음성 인식 시작 실패");
    }
  }

  /* ====================== 3분 라이브 요약 ====================== */
  const fetchLiveMinutes = async () => {
    if (!canCallApi) return; // meetingId 없을 때는 폴링 자체를 하지 않음
    setLiveLoading(true);
    try {
      const r = await fetch(ENDPOINTS.meetings.minutes.live(numericMeetingId!), {
        method: "GET",
        credentials: "include",
      });
      const j: AnyJson = await r.json().catch(() => ({} as AnyJson));

      if (!r.ok) {
        console.warn("live minutes http error", r.status, j);
        if (!liveLatest) {
          setLiveLatest("요약을 불러오지 못했습니다. 네트워크/권한을 확인한 뒤 다시 시도해 주세요.");
        }
        return;
      }

      // ✅ 다양한 키를 한 줄 문자열로 합성
      const text = composeSummaryText(j);

      if (text) {
        setLiveLatest(text);
        setLiveUpdatedAt(Date.now());
        setLiveHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.text.trim() === text.trim()) return prev; // 중복 방지
          return [...prev, { ts: Date.now(), text }];
        });
      }
    } catch (e) {
      console.warn("live minutes fetch failed", e);
      if (!liveLatest) {
        setLiveLatest("요약을 불러오지 못했습니다. 네트워크/권한을 확인한 뒤 다시 시도해 주세요.");
      }
    } finally {
      setLiveLoading(false);
    }
  };

  const startLivePolling = () => {
    stopLivePolling();
    if (!canCallApi) return; // 숫자 ID 없으면 시작하지 않음
    fetchLiveMinutes(); // 즉시 1회
    // ⬇️ 기본 3분. 데모 중 빠르게 보고 싶으면 30초로 잠깐 낮춰도 됨.
    livePollRef.current = setInterval(fetchLiveMinutes, 3 * 60 * 1000);
  };
  const stopLivePolling = () => {
    if (livePollRef.current) {
      clearInterval(livePollRef.current);
      livePollRef.current = null;
    }
  };

  /* ====================== 마운트: 권한 먼저 요청 후 자동 시작 ====================== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // meetingId가 아직 숫자가 아니면 안내하고 아무 것도 시작하지 않음
      if (!canCallApi) {
        setStatus("pause");
        return;
      }

      try {
        // 버튼으로 열렸을 때: 권한 프롬프트 먼저
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
        tmp.getTracks().forEach((t) => t.stop());
        if (cancelled) return;

        // 권한 OK → 인식 + 라이브 요약 폴링
        startRecognition();
        startLivePolling();
      } catch {
        setStatus("pause");
        alert("마이크 권한을 허용해 주세요 (주소창 왼쪽 자물쇠 → 마이크 허용).");
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
      try { recognitionRef.current?.stop?.(); } catch {}
      recognitionRef.current = null;
      stopLivePolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCallApi]);

  /* ====================== 컨트롤 ====================== */
  const handlePauseOrResume = () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    if (status === "rec") {
      runningRef.current = false;
      try { rec.stop(); } catch {}
      stopLivePolling();
      setStatus("pause");
    } else {
      runningRef.current = true;
      startedAtRef.current = performance.now();
      try { rec.start(); } catch {}
      startLivePolling();
      setStatus("rec");
    }
  };

  const handleStop = async () => {
    runningRef.current = false;
    setStatus("processing");
    stopLivePolling();
    try { recognitionRef.current?.stop?.(); } catch {}
    await finalizeMeeting();
    setStatus("pause");
  };

  const handleClose = async () => {
    await handleStop();
    onClose();
  };

  /* ====================== UI ====================== */
  const lastUpdatedText =
    liveUpdatedAt ? new Date(liveUpdatedAt).toLocaleTimeString() : "대기 중";

  return (
    <div className="px-6 pt-3">
      {/* meetingId 준비 안 됐을 때 경고 리본 */}
      {!canCallApi && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
          회의 ID가 아직 준비되지 않아 녹음/요약 기능이 비활성화되어 있습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-xl font-bold">실시간 회의 녹음</h2>
        <span className="text-sm text-blue-600">
          {status === "rec" ? "녹음 중…" : status === "pause" ? "일시정지" : "처리 중…"}
        </span>

        <button
          type="button"
          onClick={handlePauseOrResume}
          title={status === "pause" ? "재개" : "일시정지"}
          className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-50"
          disabled={!canCallApi}
        >
          <img
            src={status === "pause" ? "/icons/재개.png" : "/icons/일시정지.png"}
            alt={status === "pause" ? "재개" : "일시정지"}
            className="h-6 w-6"
          />
        </button>

        <button
          type="button"
          onClick={handleStop}
          title="정지"
          className="rounded-md p-1 hover:bg-neutral-100 disabled:opacity-50"
          disabled={!canCallApi}
        >
          <img src="/icons/정지.png" alt="정지" className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="h-9 px-3 rounded-md border"
          title="닫기"
        >
          닫기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 패널 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 메모장 */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-slate-400 font-medium">회의 중 메모</div>
                  <h3 className="mt-1 text-[18px] font-semibold text-slate-800">메모장</h3>
                </div>
                <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-600 text-[12px] px-2 py-1">
                  작성 가능
                </span>
              </div>
            </div>
            <div className="px-5 pb-5">
              <textarea
                placeholder="회의 중 간단하게 메모 입력"
                className="w-full h-60 rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3
                           text-[14px] text-slate-700 placeholder:text-slate-400
                           outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition"
              />
              <p className="mt-2 text-[12px] text-slate-400">
                Enter 줄바꿈, Ctrl+Enter 문단 구분
              </p>
            </div>
          </div>

          {/* 🔵 3분마다 라이브 요약 */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="px-5 pt-5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <div>
                  <div className="text-[12px] text-slate-400 font-medium">자동 기록</div>
                  <h3 className="text-[18px] font-semibold text-slate-800">3분마다 회의 요약</h3>
                </div>
                <div className="ml-auto text-[12px] text-slate-400">
                  업데이트: {lastUpdatedText}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              {/* 로딩 인디케이터 */}
              {liveLoading && (
                <div className="mb-3 inline-flex items-center gap-2 text-[13px] text-slate-500">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
                  요약 생성 중…
                </div>
              )}

              {/* 최신 요약 */}
              <div className="mt-1 text-[14px] text-slate-700 min-h-[64px] whitespace-pre-wrap">
                {liveLatest
                  ? liveLatest
                      .split(/\n+/)
                      .map((line, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <p className="text-[14px] text-slate-800">{line}</p>
                        </div>
                      ))
                  : <span className="text-slate-400">첫 요약 대기 중…</span>}
              </div>

              {/* 이전 요약 히스토리 */}
              {liveHistory.length > 1 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-[13px] text-slate-500">
                    이전 요약 보기
                  </summary>
                  <ul className="mt-2 space-y-3">
                    {liveHistory
                      .slice(0, -1)
                      .reverse()
                      .map((h) => (
                        <li key={h.ts} className="rounded-lg bg-slate-50 p-3 border border-slate-200/60">
                          <div className="text-[12px] text-slate-400 mb-1">
                            {new Date(h.ts).toLocaleTimeString()}
                          </div>
                          {h.text.split(/\n+/).map((line, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <p className="text-[14px] text-slate-800">{line}</p>
                            </div>
                          ))}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="lg:col-span-2">
          <div className="h-[640px] lg:h-[calc(100vh-180px)] overflow-hidden">
            {/* @ts-ignore */}
            <RightTabEmbed className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
