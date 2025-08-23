// File: src/components/RecorderPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// 우측 보조패널: RIGHT 탭 임베드
const RightTabEmbed = dynamic(() => import("@/components/RightTabEmbed"), { ssr: false });

export type RecorderResult = {
  audioUrl: string;
  transcript: string;
  summary: string;
};

export default function RecorderPanel({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: (p: RecorderResult) => void;
}) {
  const [status, setStatus] = useState<"rec" | "pause" | "processing">("rec");
  const [partial, setPartial] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const httpStopRef = useRef<null | (() => Promise<void>)>(null);
  const sessionIdRef = useRef<string>("");
  const usingWSRef = useRef<boolean>(false);
  const mimeRef = useRef<string>("");
  const finalizedRef = useRef<boolean>(false);
  const chunkTimerRef = useRef<number | null>(null);
  const hardPausedRef = useRef<boolean>(false);

  // ── Endpoints ──
  const WS_URL =
    typeof location !== "undefined"
      ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/stt/stream`
      : "/stt/stream";
  const HTTP_CHUNK_URL = `/stt/chunk`;
  const HTTP_FINALIZE_URL = `/stt/finalize`;

  function pickMimeType() {
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    }
    return "";
  }

  useEffect(() => {
    start().catch((e) => {
      alert("마이크 권한/연결 오류");
      console.error(e);
    });
    return cleanupHard;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startChunkTimer(mr: MediaRecorder) {
    stopChunkTimer();
    chunkTimerRef.current = window.setInterval(() => {
      try {
        if (mr.state === "recording") mr.requestData();
      } catch {}
    }, 3000);
  }
  function stopChunkTimer() {
    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  }

  async function start() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    const mime = pickMimeType();
    mimeRef.current = mime;
    finalizedRef.current = false;

    // WebSocket 우선
    try {
      await new Promise<void>((resolve, reject) => {
        const codec = mime.includes("ogg") ? "ogg_opus" : mime.includes("webm") ? "webm_opus" : "unknown";
        const ws = new WebSocket(`${WS_URL}?lang=ko&codec=${codec}`);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;
        sessionIdRef.current = crypto.randomUUID();

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "start",
              sessionId: sessionIdRef.current,
              contentType: mime || "audio/webm;codecs=opus",
            }),
          );

          const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          mediaRecorderRef.current = mr;

          mr.onstart = () => { setStatus("rec"); startChunkTimer(mr); };
          mr.onpause = () => { setStatus("pause"); stopChunkTimer(); };
          mr.onresume = () => { setStatus("rec"); startChunkTimer(mr); };
          mr.onstop = () => { setStatus("processing"); stopChunkTimer(); };

          mr.ondataavailable = (e) => {
            if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          mr.start(); // timeslice 없이
          resolve();
        };

        ws.onerror = () => reject(new Error("ws-fail"));

        ws.onmessage = (evt) => {
          try {
            const m = JSON.parse(evt.data);
            if (m.type === "partial") setPartial(m.text ?? "");
            else if (m.type === "final") setFinals((p) => [...p, m.text ?? ""]);
            else if (m.type === "summary") {
              if (finalizedRef.current) return;
              finalizedRef.current = true;
              setSummary(m.summary ?? "");
              setAudioUrl(m.audioUrl ?? "");
              onFinish({
                audioUrl: m.audioUrl ?? "",
                transcript: (finals.join("\n") || ""),
                summary: m.summary ?? "",
              });
            }
          } catch {}
        };
      });

      usingWSRef.current = true;
    } catch {
      // HTTP 폴백
      sessionIdRef.current = crypto.randomUUID();
      const mr = new MediaRecorder(micStreamRef.current!, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mr;

      mr.onstart = () => { setStatus("rec"); startChunkTimer(mr); };
      mr.onpause = () => { setStatus("pause"); stopChunkTimer(); };
      mr.onresume = () => { setStatus("rec"); startChunkTimer(mr); };
      mr.onstop = () => { setStatus("processing"); stopChunkTimer(); };

      mr.ondataavailable = async (e) => {
        if (!e.data || e.data.size === 0) return;
        const fd = new FormData();
        fd.append("audio", e.data, `chunk.${mime.includes("ogg") ? "ogg" : "webm"}`);
        fd.append("sessionId", sessionIdRef.current);
        fd.append("lang", "ko");
        try {
          const r = await fetch(HTTP_CHUNK_URL, { method: "POST", body: fd });
          const d = await r.json();
          if (d.partial) setPartial(d.partial);
          if (d.final) setFinals((p) => [...p, d.final]);
        } catch (err) {
          console.warn("청크 업로드 실패", err);
        }
      };

      mr.start();
      httpStopRef.current = async () => {
        if (finalizedRef.current) return;
        const r = await fetch(`${HTTP_FINALIZE_URL}?sessionId=${sessionIdRef.current}`, { method: "POST" });
        const fin = await r.json(); // {audioUrl, transcript, summary}
        finalizedRef.current = true;
        setSummary(fin.summary ?? "");
        setAudioUrl(fin.audioUrl ?? "");
        onFinish({
          audioUrl: fin.audioUrl ?? "",
          transcript: fin.transcript ?? finals.join("\n"),
          summary: fin.summary ?? "",
        });
      };

      usingWSRef.current = false;
    }
  }

  function closeWS() {
    try { if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close(); } catch {}
    wsRef.current = null;
  }

  function stopRecorderOnly() {
    try { if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop(); } catch {}
  }

  function stopAllTracks() {
    try { mediaRecorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    try { micStreamRef.current?.getTracks?.().forEach((t) => t.stop()); } catch {}
    mediaRecorderRef.current = null;
    micStreamRef.current = null;
    stopChunkTimer();
  }

  function cleanupSoft() {
    try {
      if (usingWSRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop", sessionId: sessionIdRef.current }));
      }
    } catch {}
  }

  function cleanupHard() {
    cleanupSoft();
    closeWS();
    stopAllTracks();
  }

  // ── Controls ──
  const handlePauseOrResume = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;

    if (mr.state === "recording") {
      try { mr.pause(); } catch {}
      try { micStreamRef.current?.getAudioTracks()?.forEach((t) => (t.enabled = false)); } catch {}
      hardPausedRef.current = true;
      setStatus("pause");
      return;
    }

    if (mr.state === "paused") {
      try { micStreamRef.current?.getAudioTracks()?.forEach((t) => (t.enabled = true)); } catch {}
      try {
        mr.resume();
        hardPausedRef.current = false;
        setStatus("rec");
      } catch {
        await start();
        hardPausedRef.current = false;
        setStatus("rec");
      }
      return;
    }

    await start();
    setStatus("rec");
  };

  const handleStop = async () => {
    if (finalizedRef.current) return;
    setStatus("processing");
    stopRecorderOnly();
    cleanupSoft();
    if (!usingWSRef.current && httpStopRef.current) {
      await httpStopRef.current();
    }
    stopAllTracks();
    setTimeout(closeWS, 1200);
  };

  const handleClose = async () => {
    await handleStop();
    if (onFinish && !finalizedRef.current) {
      onFinish({
        audioUrl: audioUrl || "",
        transcript: finals.join("\n"),
        summary: summary || "",
      });
      finalizedRef.current = true;
    }
    cleanupHard();
    onClose();
  };

  return (
    <div className="px-6 pt-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-xl font-bold">실시간 회의 녹음</h2>
        <span className="text-sm text-blue-600">
          {status === "rec" ? "녹음 중…" : status === "pause" ? "일시정지" : "처리 중…"}
        </span>

        {/* 일시정지/재개 */}
        <button
          type="button"
          onClick={handlePauseOrResume}
          title={status === "pause" ? "재개" : "일시정지"}
        >
          <img
            src={status === "pause" ? "/icons/재개.png" : "/icons/일시정지.png"}
            alt={status === "pause" ? "재개" : "일시정지"}
            className="h-6 w-6"
          />
        </button>

        {/* 정지 */}
        <button
          type="button"
          onClick={handleStop}
          title="정지"
        >
          <img src="/icons/정지.png" alt="정지" className="h-6 w-6" />
        </button>

        {/* 닫기 */}
        <button
          type="button"
          onClick={handleClose}
          className="h-9 px-3 rounded-md border"
          title="닫기"
        >
          닫기
        </button>
      </div>

      {/* 본문: 좌측(메모/받아쓰기), 우측(RightTab) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 — Figma 느낌으로 리디자인 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 메모장 카드 */}
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
                placeholder="회의 중 간단하게 메모 입력할 수 있는 칸…"
                className="w-full h-60 rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3
                           text-[14px] text-slate-700 placeholder:text-slate-400
                           outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition"
              />
              <p className="mt-2 text-[12px] text-slate-400">Enter 줄바꿈, Ctrl+Enter 문단 구분</p>
            </div>
          </div>

          {/* 실시간 받아쓰기 카드 */}
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

{/* 우측 — RIGHT 탭 */}
<div className="lg:col-span-2">
  <div className="h-[640px] lg:h-[calc(100vh-180px)] overflow-hidden">
    <RightTabEmbed className="h-full" />
  </div>
</div>


      </div>
    </div>
  );
}
