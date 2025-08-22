// src/components/Editor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

/* ───────── 유틸 ───────── */
function throttle<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let last = 0, tid: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now(), left = ms - (now - last);
    if (left <= 0) { last = now; if (tid) clearTimeout(tid); fn(...args); }
    else { if (tid) clearTimeout(tid); tid = setTimeout(() => { last = Date.now(); fn(...args); }, left); }
  };
}

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
function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/* ───────── Props ───────── */
type Props = {
  docId: string;
  initialHTML?: string;
  toolbarOffset?: number;         // 상단 고정 헤더 높이
  persist?: boolean;              // 로컬 저장
  clearOnMount?: boolean;
  toolbarTheme?: "light" | "dark";
};

/* ───────── 메인 Editor ───────── */
export default function Editor({
  docId,
  initialHTML,
  toolbarOffset = 0,
  persist = false,
  clearOnMount = false,
  toolbarTheme = "light",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: "여기에 자유롭게 작성하세요…",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-neutral-400 before:float-left before:h-0 pointer-events-none",
      }),
      Underline,
      Link.configure({ autolink: true, openOnClick: true, linkOnPaste: true }),
      Image.configure({ allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true, lastColumnResizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content:
      initialHTML ??
      `<h1>새 문서</h1><p>여기에 자유롭게 작성해 보세요.</p>`,
    autofocus: "end",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[70dvh] px-0 py-0",
      },
    },
  });

  // 로컬 저장
  useEffect(() => {
    if (!editor) return;
    if (!persist) {
      if (clearOnMount && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`doc:${docId}`);
        } catch {}
      }
      return;
    }
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`doc:${docId}`)
          : null;
      if (saved) editor.commands.setContent(saved, false);
    } catch {}
    const onUpdate = throttle(() => {
      try {
        const html = editor.getHTML();
        if (typeof window !== "undefined")
          window.localStorage.setItem(`doc:${docId}`, html);
      } catch {}
    }, 300);
    editor.on("update", onUpdate);
    return () => {
      // tiptap v2의 on()은 반환값이 없음 → 해제 불가. editor가 unmount되며 정리됨.
    };
  }, [editor, docId, persist, clearOnMount]);

  const [recOpen, setRecOpen] = useState(false);

  if (!editor)
    return (
      <div className="min-h-[70dvh] px-8 py-8 animate-pulse text-neutral-300">
        에디터 로딩 중…
      </div>
    );

  return (
    <div className="w-full">
      {/* 상단 툴바 (녹음 중에는 숨김) */}
      {!recOpen && (
        <div className="sticky z-30 w-full" style={{ top: toolbarOffset }}>
          <div className="mx-auto w-full px-4 py-2">
            <Toolbar
              editor={editor}
              theme={toolbarTheme}
              onOpenRecorder={() => setRecOpen(true)}
            />
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className="mx-auto w-full px-8 py-8">
        <EditorContent editor={editor} />
      </div>

      {/* 녹음 패널 (워크스페이스 영역에 고정, 툴바 숨김) */}
      {recOpen && (
        <RecorderInline
          onClose={() => setRecOpen(false)}
          onFinish={(p) => {
            const html = `
              <div class="ai-audio-note">
                <audio controls src="${p.audioUrl}"></audio>
                <div class="ai-summary">
                  <p><strong>요약</strong></p>
                  <ul>${p.summary
                    .split(/\n+/)
                    .map((s) => `<li>${s}</li>`)
                    .join("")}</ul>
                </div>
                <details><summary>전체 스크립트</summary>
                  <pre style="white-space:pre-wrap">${esc(p.transcript)}</pre>
                </details>
              </div>`;
            editor.commands.insertContent(html);
          }}
        />
      )}
    </div>
  );
}

/* ───────── Toolbar: 텍스트 버튼 유지 + PNG 아이콘 + 표/마이크 ───────── */
function Toolbar({
  editor,
  theme = "light",
  onOpenRecorder,
}: {
  editor: any;
  theme?: "dark" | "light";
  onOpenRecorder: () => void;
}) {
  const [tableBarOpen, setTableBarOpen] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // 표 선택되면 자동으로 2줄바 열기/닫기
  useEffect(() => {
    editor?.on("selectionUpdate", () => {
      setTableBarOpen(editor.isActive("table"));
    });
  }, [editor]);

  const tone =
    theme === "dark"
      ? "bg-neutral-900 text-neutral-100 border-neutral-800 shadow-sm"
      : "bg-white text-neutral-900 border-neutral-200 shadow";
  const btnBase =
    "h-9 rounded-md px-2 text-sm inline-flex items-center justify-center gap-1 border transition active:scale-[.98]";
  const btnTone =
    theme === "dark"
      ? "border-neutral-800 hover:bg-neutral-800/70"
      : "border-neutral-200 hover:bg-neutral-50";
  const activeTone = theme === "dark" ? "bg-neutral-800" : "bg-neutral-100";
  const iconBtnBase =
    "h-9 w-9 rounded-md inline-flex items-center justify-center border transition active:scale-[.98] " +
    (theme === "dark"
      ? "border-neutral-800 hover:bg-neutral-800/70"
      : "border-neutral-200 hover:bg-neutral-50");
  const iconClass = "h-8 w-8";

  const TextBtn = ({
    title,
    active = false,
    disabled = false,
    onClick,
    children,
  }: any) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        btnBase,
        btnTone,
        active ? activeTone : "",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
  const IconBtn = ({
    title,
    src,
    active = false,
    onClick,
    disabled = false,
  }: {
    title: string;
    src: string;
    active?: boolean;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        iconBtnBase,
        active ? activeTone : "",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <img src={src} alt={title} className={iconClass} />
    </button>
  );
  const Sep = () => (
    <span
      className={
        theme === "dark" ? "mx-1 h-5 w-px bg-neutral-800" : "mx-1 h-5 w-px bg-neutral-200"
      }
    />
  );

  const setBlock = (type: string) => {
    const c = editor.chain().focus();
    switch (type) {
      case "p":
        c.setParagraph().run();
        break;
      case "h1":
        c.toggleHeading({ level: 1 }).run();
        break;
      case "h2":
        c.toggleHeading({ level: 2 }).run();
        break;
      case "h3":
        c.toggleHeading({ level: 3 }).run();
        break;
      case "quote":
        c.toggleBlockquote().run();
        break;
      case "code":
        c.toggleCodeBlock().run();
        break;
    }
  };

  const insertLink = () => {
    const prev = editor.getAttributes("link")?.href as string | undefined;
    const href = prompt("링크 URL을 입력하세요", prev || "https://");
    if (href === null) return;
    if (href === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href }).run();
  };
  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  const insertFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${url}" download="${file.name}" target="_blank" rel="noopener">${file.name}</a>`
        )
        .run();
    };
    input.click();
  };
  const insertVideo = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        editor
          .chain()
          .focus()
          .insertContent(
            `<video controls src="${url}" style="max-width:100%;border-radius:8px;"></video>`
          )
          .run();
        return;
      }
      const link = prompt("동영상 URL(YouTube iframe 또는 mp4 링크)을 입력하세요");
      if (!link) return;
      const isIframe = link.includes("<iframe");
      const html = isIframe
        ? link
        : `<video controls src="${link}" style="max-width:100%;border-radius:8px;"></video>`;
      editor.chain().focus().insertContent(html).run();
    };
    input.click();
  };

  /* ── 1줄: 기본 툴바 ── */
  return (
    <>
      <div
        className={[
          "rounded-xl border px-3 py-2 flex flex-wrap items-center gap-2",
          tone,
        ].join(" ")}
      >
        {/* 블록 타입 */}
        <select
          className={[
            "h-9 rounded-md border px-2 text-sm",
            theme === "dark"
              ? "bg-neutral-900 border-neutral-800 text-neutral-100"
              : "bg-white border-neutral-200 text-neutral-900",
          ].join(" ")}
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
              ? "h2"
              : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("blockquote")
              ? "quote"
              : editor.isActive("codeBlock")
              ? "code"
              : "p"
          }
          onChange={(e) => setBlock(e.target.value)}
          title="블록 타입"
        >
          <option value="p">본문</option>
          <option value="h1">제목 1</option>
          <option value="h2">제목 2</option>
          <option value="h3">제목 3</option>
          <option value="quote">인용</option>
          <option value="code">코드</option>
        </select>

        <Sep />

        {/* 텍스트(텍스트 버튼 유지) */}
        <TextBtn
          title="굵게"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </TextBtn>
        <TextBtn
          title="기울임"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </TextBtn>
        <TextBtn
          title="밑줄"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </TextBtn>
        <TextBtn
          title="취소선"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </TextBtn>

        <Sep />

        {/* 정렬 (PNG) */}
        <IconBtn
          title="왼쪽 정렬"
          src="/icons/좌측.png"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <IconBtn
          title="가운데 정렬"
          src="/icons/가운데.png"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <IconBtn
          title="오른쪽 정렬"
          src="/icons/우측.png"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />

        <Sep />

        {/* 목록: 글머리(아이콘), 번호/할일(텍스트 유지) */}
        <IconBtn
          title="글머리 기호"
          src="/icons/글머리 기호.png"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <TextBtn
          title="번호 목록"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </TextBtn>
        <TextBtn
          title="할 일 목록"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☑
        </TextBtn>

        <Sep />

        {/* 삽입 (PNG) */}
        <IconBtn title="링크" src="/icons/링크.png" onClick={insertLink} />
        <IconBtn title="사진" src="/icons/사진.png" onClick={insertImage} />
        <IconBtn title="파일 추가" src="/icons/파일추가.png" onClick={insertFile} />
        <IconBtn title="동영상" src="/icons/동영상.png" onClick={insertVideo} />

        {/* 표 버튼 → 모달 열기 (PNG) */}
        <IconBtn
          title="표"
          src="/icons/표.png"
          onClick={() => setShowTableModal(true)}
        />

        {/* 🎤 마이크 버튼(표 옆, PNG 하나만) */}
        <IconBtn
          title="녹음 시작"
          src="/icons/마이크.png"
          onClick={onOpenRecorder}
        />

        {/* 오른쪽 끝으로 밀기 */}
        <div className="ml-auto" />

        {/* 되돌리기/다시 실행 (텍스트 유지) */}
        <TextBtn
          title="되돌리기"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </TextBtn>
        <TextBtn
          title="다시 실행"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </TextBtn>
      </div>

      {/* 2줄: 표 전용 툴바 */}
      {tableBarOpen && editor.isActive("table") && (
        <div
          className={[
            "mt-2 rounded-xl border px-3 py-2 flex flex-wrap items-center gap-2",
            tone,
          ].join(" ")}
        >
          <span className="text-sm opacity-60 mr-1">표 편집</span>
          <TextBtn
            title="행↑+"
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            행↑+
          </TextBtn>
          <TextBtn
            title="행↓+"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            행↓+
          </TextBtn>
          <TextBtn
            title="행−"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            행−
          </TextBtn>
          <Sep />
          <TextBtn
            title="열←+"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            열←+
          </TextBtn>
          <TextBtn
            title="열→+"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            열→+
          </TextBtn>
          <TextBtn
            title="열−"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            열−
          </TextBtn>
          <Sep />
          <TextBtn
            title="헤더"
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          >
            헤더
          </TextBtn>
          <TextBtn
            title="표 삭제"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            표 삭제
          </TextBtn>
        </div>
      )}

      {/* 표 만들기 모달 */}
      {showTableModal && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center">
          <div
            className={`rounded-xl border bg-white p-5 w-[320px] ${
              theme === "dark"
                ? "text-neutral-100 bg-neutral-900 border-neutral-800"
                : ""
            }`}
          >
            <h3 className="text-lg font-semibold">표 만들기</h3>

            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between">
                <span>행 개수</span>
                <input
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(e) =>
                    setRows(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-24 rounded-md border px-2 py-1"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>열 개수</span>
                <input
                  type="number"
                  min={1}
                  value={cols}
                  onChange={(e) =>
                    setCols(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-24 rounded-md border px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2 text-sm opacity-70">
                <input type="checkbox" checked readOnly />
                헤더 행 포함 (기본)
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowTableModal(false)}
                className="h-9 px-3 rounded-md border"
              >
                취소
              </button>
              <button
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows, cols, withHeaderRow: true })
                    .run();
                  setShowTableModal(false);
                  setTableBarOpen(true);
                }}
                className="h-9 px-3 rounded-md border bg-blue-600 text-white hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── 녹음 패널(인라인, 사이드바와 함께 동작) ───────── */
function RecorderInline({
  onClose,
  onFinish,
}: {
  onClose: () => void;
  onFinish: (p: { audioUrl: string; transcript: string; summary: string }) => void;
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

  // 시작
  useEffect(() => {
    start().catch((e) => {
      alert("마이크 권한/연결 오류");
      console.error(e);
    });
    return cleanupHard;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    const mime = pickMimeType();
    mimeRef.current = mime;

    // WS 우선
    try {
      await new Promise<void>((resolve, reject) => {
        const codec = mime.includes("ogg")
          ? "ogg_opus"
          : mime.includes("webm")
          ? "webm_opus"
          : "unknown";
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
            })
          );
          const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
          mediaRecorderRef.current = mr;
          mr.ondataavailable = (e) => {
            if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };
          mr.start(3000);
          resolve();
        };
        ws.onerror = () => reject(new Error("ws-fail"));
        ws.onmessage = (evt) => {
          try {
            const m = JSON.parse(evt.data);
            if (m.type === "partial") setPartial(m.text);
            else if (m.type === "final") setFinals((p) => [...p, m.text]);
            else if (m.type === "summary") {
              setSummary(m.summary);
              setAudioUrl(m.audioUrl);
              onFinish(m);
            }
          } catch {}
        };
      });
      usingWSRef.current = true;
    } catch {
      // HTTP 폴백
      sessionIdRef.current = crypto.randomUUID();
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mr;
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
      mr.start(3000);
      httpStopRef.current = async () => {
        const r = await fetch(
          `${HTTP_FINALIZE_URL}?sessionId=${sessionIdRef.current}`,
          { method: "POST" }
        );
        const fin = await r.json(); // {audioUrl, transcript, summary}
        setSummary(fin.summary);
        setAudioUrl(fin.audioUrl);
        onFinish(fin);
      };
      usingWSRef.current = false;
    }
  }

  function stopTracks() {
    try { mediaRecorderRef.current?.stop(); } catch {}
    try { mediaRecorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    try { micStreamRef.current?.getTracks?.().forEach((t) => t.stop()); } catch {}
    mediaRecorderRef.current = null;
    micStreamRef.current = null;
  }

  function cleanupSoft() {
    // WS 종료 신호만
    try {
      if (usingWSRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop", sessionId: sessionIdRef.current }));
        setTimeout(() => {
          try { if (wsRef.current && wsRef.current.readyState <= 1) wsRef.current.close(); } catch {}
        }, 1500);
      }
    } catch {}
  }

  function cleanupHard() {
    cleanupSoft();
    try { wsRef.current && wsRef.current.close(); } catch {}
    stopTracks();
  }

  const onPause = () => {
    if (!mediaRecorderRef.current) return;
    if (status === "rec") {
      mediaRecorderRef.current.pause();
      setStatus("pause");
      // 일시정지 시에도 마이크는 끔(요청)
      stopTracks();
    } else {
      // 재개: 다시 마이크 요청 후 재시작
      start().then(() => setStatus("rec")).catch(() => setStatus("pause"));
    }
  };

  const onStop = async () => {
    setStatus("processing");
    cleanupSoft();
    stopTracks();
    if (!usingWSRef.current && httpStopRef.current) {
      await httpStopRef.current();
    }
  };

  // ✅ 내부 함수명 변경(빌드 에러 방지)
  const handleClose = async () => {
    await onStop();
    if (onFinish) {
      onFinish({
        audioUrl: audioUrl || "",
        transcript: finals.join("\n"),
        summary: summary || "",
      });
    }
    cleanupHard();
    onClose();
  };

  return (
    <div className="px-6 pt-3">
      {/* 헤더: 제목 + (일시정지/정지/닫기) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">실시간 회의 녹음</h2>
          <span className="text-sm text-blue-600">
            {status === "rec" ? "녹음 중…" : status === "pause" ? "일시정지" : "처리 중…"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* 일시정지/재개 PNG 토글 */}
          <button
            onClick={onPause}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
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
            onClick={onStop}
            className="h-9 w-9 rounded-full border flex items-center justify-center"
            title="정지"
          >
            <img src="/icons/정지.png" alt="정지" className="h-6 w-6" />
          </button>

          {/* 닫기 (텍스트) */}
          <button
            onClick={handleClose}
            className="h-9 px-3 rounded-md border"
            title="닫기"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 본문 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 메모/받아쓰기 */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">메모장</h3>
              <span className="text-sm text-neutral-400">회의 중 메모</span>
            </div>
            <textarea
              placeholder="간단 메모를 입력하세요…"
              className="w-full h-64 rounded-md border p-3 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="rounded-xl border p-4 mt-6">
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

        {/* 우측: 요약/오디오 (오른쪽은 추후 확장 전제) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">실시간 회의 요약</h3>
              <span className="text-neutral-400 text-sm">자동 생성</span>
            </div>
            {!summary ? (
              <div className="text-neutral-500 text-sm mt-2">
                요약을 생성 중입니다… (종료를 누르면 최종 요약이 표시됩니다)
              </div>
            ) : (
              <ul className="list-disc list-inside mt-3 space-y-1">
                {summary.split(/\n+/).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            {audioUrl && (
              <div className="mt-4">
                <audio controls src={audioUrl} className="w-full" />
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4 mt-6">
            <div className="text-neutral-500 text-sm">
              여기에 지도/필터 등 보조 패널을 배치할 수 있어요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
