// components/Editor.tsx
"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

/** 간단 throttle: 마지막 실행 이후 ms 내엔 1번만 실행 */
function throttle<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let last = 0;
  let tid: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const left = ms - (now - last);
    if (left <= 0) {
      last = now;
      if (tid) clearTimeout(tid);
      fn(...args);
    } else {
      if (tid) clearTimeout(tid);
      tid = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, left);
    }
  };
}

type Props = {
  /** 문서 저장 키 (로컬스토리지) */
  docId: string;
  /** 초기 HTML (없으면 defaultHTML) */
  initialHTML?: string;
  /** sticky 툴바 오프셋(px) */
  toolbarOffset?: number;
  /** 로컬스토리지 사용 여부 (기본: true) */
  persist?: boolean;
  /** persist=false일 때, 마운트 시 기존 저장본 제거 (기본: false) */
  clearOnMount?: boolean;
};

export default function Editor({
  docId,
  initialHTML,
  toolbarOffset = 0,
  persist = true,
  clearOnMount = false,
}: Props) {
  // TipTap 인스턴스
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
      Highlight,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    immediatelyRender: false, // SSR 단계 DOM 생성 방지
    content: initialHTML ?? defaultHTML,
    autofocus: "end",
    editorProps: {
      attributes: {
        // 테두리 없는 자유 편집 느낌 + 문단 폭 제한 없음
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[70dvh] px-0 py-0",
      },
    },
  });

  // 저장/불러오기 제어
  useEffect(() => {
    if (!editor) return;

    // 저장 끈 모드
    if (!persist) {
      if (clearOnMount && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`doc:${docId}`);
        } catch {}
      }
      return; // 저장/불러오기 전부 스킵
    }

    // ── persist=true: 저장본 불러오기
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`doc:${docId}`)
          : null;
      if (saved) editor.commands.setContent(saved, false); // 히스토리에 남기지 않음
    } catch {}

    // 변경 저장(스로틀)
    const onUpdate = throttle(() => {
      try {
        const html = editor.getHTML();
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`doc:${docId}`, html);
        }
      } catch {}
    }, 300);

    editor.on("update", onUpdate);
    return () => editor.off("update", onUpdate);
  }, [editor, docId, persist, clearOnMount]);

  // 로딩 스켈레톤
  if (!editor) {
    return (
      <div className="min-h-[70dvh] px-8 py-8 animate-pulse text-neutral-300">
        에디터 로딩 중…
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 상단 전체폭 툴바 */}
      <div
        className="sticky z-30 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ top: toolbarOffset }}
      >
        <div className="mx-auto w-full px-4 py-2">
          <Toolbar editor={editor} />
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto w-full px-8 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/* ───────── Toolbar ───────── */
function Toolbar({ editor }: { editor: any }) {
  const btn =
    "rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50 active:scale-[.99]";
  const active = "bg-neutral-100";
  const can = (cb: () => boolean) => (editor ? cb() : false);

  // 링크 도우미
  const setLink = () => {
    const prev = editor.getAttributes("link")?.href as string | undefined;
    const href = prompt("링크 URL을 입력하세요", prev || "https://");
    if (href === null) return; // 취소
    if (href === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className={`${btn} ${
          editor.isActive("heading", { level: 1 }) ? active : ""
        }`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        type="button"
      >
        제목1
      </button>
      <button
        className={`${btn} ${
          editor.isActive("heading", { level: 2 }) ? active : ""
        }`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        type="button"
      >
        제목2
      </button>

      <button
        className={`${btn} ${editor.isActive("bold") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!can(() => editor.can().chain().focus().toggleBold().run())}
        type="button"
      >
        Bold
      </button>
      <button
        className={`${btn} ${editor.isActive("italic") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!can(() => editor.can().chain().focus().toggleItalic().run())}
        type="button"
      >
        Italic
      </button>

      <span className="mx-1 w-px bg-neutral-200" />

      <button
        className={`${btn} ${editor.isActive("bulletList") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        type="button"
      >
        • 글머리 기호
      </button>
      <button
        className={`${btn} ${editor.isActive("orderedList") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        type="button"
      >
        1. 번호 매기기
      </button>
      <button
        className={`${btn} ${editor.isActive("taskList") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        type="button"
      >
        ☑ 할일 목록
      </button>

      <span className="mx-1 w-px bg-neutral-200" />

      <button
        className={`${btn} ${editor.isActive("highlight") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        type="button"
      >
        밑줄
      </button>
      <button className={btn} onClick={setLink} type="button">
        링크
      </button>

      <span className="mx-1 w-px bg-neutral-200" />

      <button
        className={btn}
        onClick={() => editor.chain().focus().undo().run()}
        type="button"
      >
        ↶
      </button>
      <button
        className={btn}
        onClick={() => editor.chain().focus().redo().run()}
        type="button"
      >
        ↷
      </button>
    </div>
  );
}

const defaultHTML = `
  <h1>새 문서</h1>
  <p>여기에 자유롭게 작성해 보세요.</p>
`;
