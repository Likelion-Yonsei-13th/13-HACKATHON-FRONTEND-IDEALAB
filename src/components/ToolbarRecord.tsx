// File: src/components/ToolbarRecord.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { PiMicrophoneFill, PiStopFill } from "react-icons/pi";
import { ENDPOINTS } from "@/lib/endpoints";

/* =================== 설정 =================== */
const DEFAULT_LANG: "ko" | "en" = "ko";
/* =========================================== */

export default function ToolbarRecord({
  editor,
  lang = DEFAULT_LANG,
}: {
  editor: any;
  lang?: "ko" | "en";
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  // 공통 참조
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveNodeIdRef = useRef<string>("");
  const meetingIdRef = useRef<string>(""); // ★ 회의 ID

  // WS/HTTP
  const wsRef = useRef<WebSocket | null>(null);
  const isUsingWSRef = useRef<boolean>(false);
  const httpStopRef = useRef<null | (() => Promise<void>)>(null);

  const pickMimeType = () => {
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    }
    return "";
  };

  const insertLiveHolder = () => {
    const liveId = `live-${crypto.randomUUID()}`;
    liveNodeIdRef.current = liveId;
    editor?.commands?.insertContent(
      `<div id="${liveId}" class="ai-audio-note">
         <p><strong>🎤 실시간 받아쓰기…</strong></p>
         <p class="live-text" style="opacity:.8"></p>
       </div>`
    );
  };

  const updatePartial = (text: string) => {
    const holder = document.getElementById(liveNodeIdRef.current);
    holder?.querySelector(".live-text")?.replaceChildren(document.createTextNode(text));
  };

  const insertFinalLine = (text: string) => {
    editor?.commands?.insertContent(`<p>${escapeHtml(text)}</p>`);
    updatePartial("");
  };

  const finishWithSummary = (payload: { audioUrl: string; transcript: string; summary: string }) => {
    const html = `
      <div class="ai-audio-note">
        <audio controls src="${payload.audioUrl}"></audio>
        <div class="ai-summary">
          <p><strong>요약</strong></p>
          <ul>${payload.summary.split(/\n+/).map((s) => `<li>${s}</li>`).join("")}</ul>
        </div>
        <details><summary>전체 스크립트</summary>
          <pre style="white-space:pre-wrap">${escapeHtml(payload.transcript)}</pre>
        </details>
      </div>`;
    editor?.commands?.insertContent(html);
    document.getElementById(liveNodeIdRef.current)?.remove();
  };

  const start = async () => {
    try {
      // 0) 회의 생성 → meetingId 확보
      const cr = await fetch(ENDPOINTS.meetings.create, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: `회의 ${new Date().toLocaleString()}` }),
      });
      if (!cr.ok) throw new Error("회의 생성 실패");
      const cj = await cr.json();
      meetingIdRef.current = (cj.id ?? cj.meeting_id ?? "").toString();
      if (!meetingIdRef.current) throw new Error("meeting_id 없음");

      // 1) 마이크
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMimeType();

      insertLiveHolder();

      // 2) 먼저 WebSocket 시도
      try {
        await startWS(stream, mime);
        isUsingWSRef.current = true;
      } catch {
        // 3) 실패 시 HTTP 폴백
        await startHTTP(stream, mime);
        isUsingWSRef.current = false;
      }

      setIsRecording(true);
    } catch (e) {
      alert("마이크/서버 연결 오류가 발생했습니다. 브라우저 권한과 서버 상태를 확인해주세요.");
      console.error(e);
    }
  };

  const stop = async () => {
    setLoading(true);
    try {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;

      if (isUsingWSRef.current) {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop", meetingId: meetingIdRef.current }));
        }
        setTimeout(() => wsRef.current?.close(), 2000);
      } else {
        if (httpStopRef.current) await httpStopRef.current();
      }
    } finally {
      setIsRecording(false);
      setLoading(false);
    }
  };

  // ---- WebSocket 모드 ----
  const startWS = async (stream: MediaStream, mime: string) =>
    new Promise<void>((resolve, reject) => {
      const WS_URL = ENDPOINTS.sttWS?.stream || ""; // 없으면 빈 문자열
      if (!WS_URL) return reject(new Error("WS 미지원"));

      const codec =
        mime.includes("ogg") ? "ogg_opus" : mime.includes("webm") ? "webm_opus" : "unknown";
      const qs = `?lang=${lang}&codec=${codec}&meetingId=${encodeURIComponent(
        meetingIdRef.current
      )}`;
      const ws = new WebSocket(`${WS_URL}${qs}`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "start",
            meetingId: meetingIdRef.current,
            contentType: mime || "audio/webm;codecs=opus",
          })
        );
        const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
        };
        mr.start(3000);
        resolve();
      };

      ws.onerror = () => reject(new Error("WS 연결 실패"));

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "partial") updatePartial(msg.text);
          else if (msg.type === "final") insertFinalLine(msg.text);
          else if (msg.type === "summary") finishWithSummary(msg);
        } catch { /* ignore */ }
      };
    });

  // ---- HTTP 폴백 모드 ----
  const startHTTP = async (stream: MediaStream, mime: string) => {
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = async (e) => {
      if (!e.data || e.data.size === 0) return;
      const fd = new FormData();
      fd.append("audio", e.data, `chunk.${mime.includes("ogg") ? "ogg" : "webm"}`);
      fd.append("lang", lang);

      try {
        const res = await fetch(ENDPOINTS.meetings.sttChunk(meetingIdRef.current), {
          method: "POST",
          body: fd,
        });
        const data = await res.json(); // { partial?: string, final?: string }
        if (data.partial) updatePartial(data.partial);
        if (data.final) insertFinalLine(data.final);
      } catch (err) {
        console.warn("청크 업로드 실패", err);
      }
    };

    mr.start(3000);

    httpStopRef.current = async () => {
      try {
        const res = await fetch(ENDPOINTS.meetings.finalize(meetingIdRef.current), {
          method: "POST",
        });
        const fin = await res.json(); // { audioUrl, transcript, summary }
        finishWithSummary(fin);
      } catch (err) {
        console.error("finalize 실패", err);
      }
    };
  };

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        if (wsRef.current && wsRef.current.readyState <= 1) wsRef.current.close();
      } catch {}
    };
  }, []);

  return (
    <button
      onClick={isRecording ? stop : start}
      className={`px-2 py-1 rounded ${isRecording ? "bg-red-500 text-white" : "bg-gray-100"}`}
      title={isRecording ? "녹음 종료" : "녹음 시작"}
      disabled={loading}
    >
      {isRecording ? <PiStopFill size={18} /> : <PiMicrophoneFill size={18} />}
      <span className="ml-1">{loading ? "처리 중…" : isRecording ? "종료" : "녹음"}</span>
    </button>
  );
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
