// File: src/components/RecorderPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ENDPOINTS } from "@/lib/endpoints";

const RightTabEmbed = dynamic(() => import("@/components/RightTabEmbed"), { ssr: false });

export type RecorderResult = {
  audioUrl: string;
  transcript: string;
  summary: string;
};

type RecStatus = "rec" | "pause" | "processing";

// ✅ 브라우저 전역에 webkitSpeechRecognition 선언만 추가 (문법 안전)
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function RecorderPanel({
  meetingId = "1",
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

  const recognitionRef = useRef<any>(null);
  const startedAtRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);

  async function postChunk(text: string, start_ms: number, end_ms: number) {
    try {
      const res = await fetch(ENDPOINTS.meetings.stt.chunk(meetingId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, start_ms, end_ms }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        console.error("stt-chunk error:", res.status, t);
      }
    } catch (e) {
      console.error("stt-chunk network error", e);
    }
  }

  async function finalizeMeeting() {
    try {
      const res = await fetch(ENDPOINTS.meetings.stt.finalize(meetingId), { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as any;
      onFinish({
        audioUrl: data.audioUrl || "",
        transcript: data.transcript || finals.join("\n"),
        summary: data.summary || "",
      });
      setSummary(data.summary || "");
    } catch (e) {
      console.error("finalize error", e);
      onFinish({
        audioUrl: "",
        transcript: finals.join("\n"),
        summary: summary || "",
      });
    }
  }

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
  // 일부 브라우저에서 권한/캡처/무음 등으로 aborted, no-speech가 자주 뜸
  if (runningRef.current && (e.error === "aborted" || e.error === "no-speech" || e.error === "audio-capture")) {
    // 잠깐 쉬었다가 재시작
    setTimeout(() => {
      try { rec.start(); } catch {}
    }, 500);
  }
};

    rec.onend = () => {
      if (runningRef.current) {
        try {
          rec.start();
        } catch {}
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.error(e);
      alert("음성 인식 시작 실패");
    }
  }

  useEffect(() => {
    startRecognition();
    return () => {
      runningRef.current = false;
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  const handlePauseOrResume = () => {
    const rec = recognitionRef.current;
    if (!rec) return;

    if (status === "rec") {
      runningRef.current = false;
      try { rec.stop(); } catch {}
      setStatus("pause");
    } else {
      runningRef.current = true;
      startedAtRef.current = performance.now();
      try { rec.start(); } catch {}
      setStatus("rec");
    }
  };

  const handleStop = async () => {
    runningRef.current = false;
    setStatus("processing");
    try { recognitionRef.current?.stop?.(); } catch {}
    await finalizeMeeting();
    setStatus("pause");
  };

  const handleClose = async () => {
    await handleStop();
    onClose();
  };

  return (
    <div className="px-6 pt-3">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-xl font-bold">실시간 회의 녹음</h2>
        <span className="text-sm text-blue-600">
          {status === "rec" ? "녹음 중…" : status === "pause" ? "일시정지" : "처리 중…"}
        </span>

        <button
          type="button"
          onClick={handlePauseOrResume}
          title={status === "pause" ? "재개" : "일시정지"}
          className="rounded-md p-1 hover:bg-neutral-100"
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
          className="rounded-md p-1 hover:bg-neutral-100"
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
        <div className="lg:col-span-1 space-y-6">
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
              <p className="mt-2 text-[12px] text-slate-400">Enter 줄바꿈, Ctrl+Enter 문단 구분</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="px-5 pt-5">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <div>
                  <div className="text-[12px] text-slate-400 font-medium">자동 기록</div>
                  <h3 className="text-[18px] font-semibold text-slate-800">실시간 받아쓰기</h3>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="mt-3 text-[14px] text-slate-700 min-h-[64px] whitespace-pre-wrap">
                {partial || <span className="text-slate-400">받아쓰는 중…</span>}
              </div>

              {finals.length > 0 && (
                <div className="mt-4">
                  <div className="text-[13px] text-slate-500 mb-2">확정 문장</div>
                  <ul className="space-y-1.5">
                    {finals.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <p className="text-[14px] text-slate-800">{t}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

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
