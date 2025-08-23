// File: src/components/RecorderPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// RIGHT 탭(클라이언트 전용)
const RightTabEmbed = dynamic(() => import("@/components/RightTabEmbed"), { ssr: false });

export type RecorderResult = {
  audioUrl: string;
  transcript: string;
  summary: string;
};

type RecStatus = "rec" | "pause" | "processing";

export default function RecorderPanel({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: (p: RecorderResult) => void;
}) {
  const [status, setStatus] = useState<RecStatus>("rec");
  const [partial, setPartial] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // ── 내부 상태/리소스 ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const httpStopRef = useRef<null | (() => Promise<void>)>(null);
  const sessionIdRef = useRef<string>("");
  const usingWSRef = useRef<boolean>(false);
  const mimeRef = useRef<string>("");
  const finalizedRef = useRef<boolean>(false);
  const chunkTimerRef = useRef<number | null>(null);
  const hardPauseRef = useRef<boolean>(false); // ← 일시정지 목적의 stop 구분

  // ── Endpoint ──
  const WS_URL =
    typeof location !== "undefined"
      ? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/stt/stream`
      : "/stt/stream";
  const HTTP_CHUNK_URL = `/stt/chunk`;
  const HTTP_FINALIZE_URL = `/stt/finalize`;

  // 적절한 mime 고르기
  function pickMimeType() {
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    }
    return "";
  }

  useEffect(() => {
    // 첫 시작
    boot().catch((e) => {
      alert("마이크 권한/연결 오류");
      console.error(e);
    });
    return cleanupHard;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 타이머(청크 요청) ──
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

  // ── 공통: MR 핸들러 장착 ──
  function wireRecorder(mr: MediaRecorder) {
    mr.onstart = () => {
      setStatus("rec");
      startChunkTimer(mr);
    };
    mr.onpause = () => {
      setStatus("pause");
      stopChunkTimer();
    };
    mr.onresume = () => {
      setStatus("rec");
      startChunkTimer(mr);
    };
    mr.onstop = () => {
      // hard pause 목적의 stop이면 'processing' 상태로 바꾸지 않음
      stopChunkTimer();
      if (!hardPauseRef.current) setStatus("processing");
    };

    // 데이터 전송
    mr.ondataavailable = async (e) => {
      if (!e.data || e.data.size === 0) return;

      if (usingWSRef.current) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      } else {
        // HTTP 업로드
        const fd = new FormData();
        fd.append("audio", e.data, `chunk.${mimeRef.current.includes("ogg") ? "ogg" : "webm"}`);
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
      }
    };
  }

  // ── MR 생성/시작 (스트림은 살아있다고 가정) ──
  function createAndStartRecorder() {
    const stream = micStreamRef.current!;
    const mr = new MediaRecorder(stream, mimeRef.current ? { mimeType: mimeRef.current } : undefined);
    mediaRecorderRef.current = mr;
    wireRecorder(mr);
    mr.start(); // timeslice 없이
  }

  // ── WS 메시지 핸들 ──
  function wireWS(ws: WebSocket) {
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
  }

  // ── 초기 부팅: 스트림, 전송 채널, 레코더 ──
  async function boot() {
    // 마이크
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    // mime
    mimeRef.current = pickMimeType();
    sessionIdRef.current = crypto.randomUUID();
    finalizedRef.current = false;

    // 1) WebSocket 시도
    try {
      await new Promise<void>((resolve, reject) => {
        const codec = mimeRef.current.includes("ogg")
          ? "ogg_opus"
          : mimeRef.current.includes("webm")
          ? "webm_opus"
          : "unknown";
        const ws = new WebSocket(`${WS_URL}?lang=ko&codec=${codec}`);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "start",
              sessionId: sessionIdRef.current,
              contentType: mimeRef.current || "audio/webm;codecs=opus",
            }),
          );
          wireWS(ws);
          resolve();
        };
        ws.onerror = () => reject(new Error("ws-fail"));
      });

      usingWSRef.current = true;
    } catch {
      // 2) HTTP 폴백
      httpStopRef.current = async () => {
        if (finalizedRef.current) return;
        const r = await fetch(
          `${HTTP_FINALIZE_URL}?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
          { method: "POST" },
        );
        const fin = await r.json(); // { audioUrl, transcript, summary }
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

    // 첫 레코더 시작
    createAndStartRecorder();
  }

  // ── 정리 ──
  function closeWS() {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    } catch {}
    wsRef.current = null;
  }
  function stopAllTracks() {
    try {
      mediaRecorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    try {
      micStreamRef.current?.getTracks?.forEach((t) => t.stop());
    } catch {}
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

  // ── 컨트롤: 일시정지/재개/정지/닫기 ──
  const handlePauseOrResume = async () => {
    const mr = mediaRecorderRef.current;

    // 아직 시작 전이면 무시
    if (!mr && status === "rec") return;

    // 녹음 중 → 일시정지 (stop으로 플러시만, 세션/WS는 유지)
    if (mr && mr.state === "recording") {
      hardPauseRef.current = true;
      try {
        mr.stop(); // onstop에서 processing으로 안 바꾸도록 hardPauseRef로 구분
      } catch {}
      setStatus("pause");
      return;
    }

    // 일시정지 → 재개 (새 MediaRecorder 생성/시작)
    if (status === "pause") {
      hardPauseRef.current = false;

      // 스트림이 죽었으면 재획득
      let stream = micStreamRef.current;
      if (!stream || stream.getTracks().every((t) => t.readyState === "ended")) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
      }

      createAndStartRecorder();
      setStatus("rec");
      return;
    }
  };

  const handleStop = async () => {
    if (finalizedRef.current) return;
    setStatus("processing");

    // 완전 정지
    try {
      mediaRecorderRef.current?.stop();
    } catch {}
    cleanupSoft();

    // HTTP는 finalize 호출
    if (!usingWSRef.current && httpStopRef.current) {
      await httpStopRef.current();
    }

    stopAllTracks();
    setTimeout(closeWS, 800);
  };

  const handleClose = async () => {
    await handleStop();
    // 서버 요약 응답 전에 닫는 경우 최소 결과 전달
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

  // ── UI ──
  return (
    <div className="px-6 pt-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h2 className="text-xl font-bold">실시간 회의 녹음</h2>
        <span className="text-sm text-blue-600">
          {status === "rec" ? "녹음 중…" : status === "pause" ? "일시정지" : "처리 중…"}
        </span>

        {/* 일시정지/재개 토글 */}
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

        {/* 정지 */}
        <button
          type="button"
          onClick={handleStop}
          title="정지"
          className="rounded-md p-1 hover:bg-neutral-100"
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

      {/* 본문: 좌(메모/받아쓰기) · 우(RIGHT 탭) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측 */}
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
                placeholder="회의 중 간단하게 메모 입력할 수 있는 칸…"
                className="w-full h-60 rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3
                           text-[14px] text-slate-700 placeholder:text-slate-400
                           outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 transition"
              />
              <p className="mt-2 text-[12px] text-slate-400">Enter 줄바꿈, Ctrl+Enter 문단 구분</p>
            </div>
          </div>

          {/* 실시간 받아쓰기 */}
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

        {/* 우측: RIGHT 탭 */}
        <div className="lg:col-span-2">
          <div className="h-[640px] lg:h-[calc(100vh-180px)] overflow-hidden">
            {/* @ts-ignore - className만 내려줌 */}
            <RightTabEmbed className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
