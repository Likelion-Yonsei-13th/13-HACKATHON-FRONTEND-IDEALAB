// File: src/components/RecorderPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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

      {/* 본문 레이아웃: 좌측 메모/받아쓰기, 우측 RIGHT 탭만 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 */}
        <div className="lg:col-span-1">
          {/* 메모장 (보더 제거) */}
          <div className="p-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">메모장</h3>
              <span className="text-sm text-neutral-400">회의 중 메모</span>
            </div>
            <textarea
              placeholder="간단 메모를 입력하세요…"
              className="w-full h-64 rounded-md border-0 bg-neutral-50 p-3 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* 받아쓰기 (보더 제거) */}
          <div className="p-1 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-semibold">실시간 받아쓰기</h3>
            </div>
            <div className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap min-h-[80px]">
              {partial}
            </div>
            {finals.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium">확정 문장</h4>
                <ul className="list-disc list-inside text-sm text-neutral-700 mt-1 space-y-1">
                  {finals.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 우측: RIGHT 탭만 (보더/타이틀 전부 제거) */}
        <div className="lg:col-span-2">
          <div className="mt-0 h-[640px] lg:h-[calc(100vh-220px)] overflow-hidden">
            <RightTabEmbed className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
