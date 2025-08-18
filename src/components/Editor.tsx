"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

/** 간단 throttle: 마지막 실행 이후 ms 내엔 모아서 1번만 실행 */
function throttle<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      last = now;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      fn(...args);
    } else {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, remaining);
    }
  };
}

type Props = {
  /** 문서 저장 키 (로컬스토리지) */
  docId?: string;
  /** 초기 HTML (없으면 defaultHTML) */
  initialHTML?: string;
  /** 헤더 높이(px). 툴바를 그 바로 아래에 붙이고 싶을 때 사용 */
  toolbarOffset?: number;
};

export default function Editor({
  docId = "demo-doc",
  initialHTML,
  toolbarOffset = 0,
}: Props) {
  // 화면 표시 상태 (훅 순서 영향 X)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // TipTap 에디터 (SSR 안전)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder:
          "여기에 자유롭게 작성하세요...",
          emptyEditorClass:
            "before:content-[attr(data-placeholder)] before:text-neutral-400 before:float-left before:h-0 pointer-events-none",

      }),
      Highlight,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    immediatelyRender: false, // SSR 단계에서 DOM 생성 방지
    content: initialHTML ?? defaultHTML,
    autofocus: "end",
    editorProps: {
      attributes: {
        // 박스/테두리 제거 + 전체 폭 사용
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[70dvh] px-0 py-0",
      },
    },
  });

  // 로컬스토리지: 마운트 후 로드 + 변경시 저장(throttle)
  useEffect(() => {
    if (!editor) return;

    // 초기 로드
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`doc:${docId}`)
          : null;
      if (saved) editor.commands.setContent(saved, false); // 히스토리에 남기지 않음
    } catch {}

    // 저장 (300~500ms 추천)
    const onUpdate = throttle(() => {
      try {
        const html = editor.getHTML();
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`doc:${docId}`, html);
        }
      } catch {}
    }, 300);

    editor.on("update", onUpdate);
    return () => {
      try {
        editor.off("update", onUpdate);
      } catch {}
    };
  }, [editor, docId]);

  // 로딩 스켈레톤
  if (!editor || !mounted) {
    return (
      <div className="min-h-[70dvh] px-8 py-8 animate-pulse text-neutral-300">
        에디터 로딩 중…
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 상단 전체폭 툴바 (헤더 높이만큼 오프셋) */}
      <div
        className="sticky z-30 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ top: toolbarOffset }}
      >
        <div className="mx-auto w-full px-4 py-2">
          <Toolbar editor={editor} />
        </div>
      </div>

      {/* 본문 (필요하면 max-w-[1100px] mx-auto로 종이폭 느낌 가능) */}
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
        type="button"
      >
        Bold
      </button>
      <button
        className={`${btn} ${editor.isActive("italic") ? active : ""}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
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
      <button
        className={btn}
        onClick={() => {
          const href = prompt("링크 URL?");
          if (href) editor.chain().focus().setLink({ href }).run();
        }}
        type="button"
      >
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
