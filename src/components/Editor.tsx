// components/Editor.tsx
"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import {Table} from "@tiptap/extension-table";              // ✅ default import
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

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
  /** 문서 식별자(로컬스토리지 키로도 사용 가능) */
  docId: string;
  /** 초기 HTML (없으면 기본) */
  initialHTML?: string;
  /** sticky 툴바 오프셋(px) */
  toolbarOffset?: number;
  /** 로컬스토리지 저장/로드 사용 (기본 true). 저장 원치 않으면 false */
  persist?: boolean;
  /** persist=false일 때, 마운트 시 기존 저장본 제거 */
  clearOnMount?: boolean;
  /** 툴바 테마 */
  toolbarTheme?: "light" | "dark";
};

export default function Editor({
  docId,
  initialHTML,
  toolbarOffset = 0,
  persist = true,
  clearOnMount = false,
  toolbarTheme = "light",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "여기에 자유롭게 작성하세요…",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-neutral-400 before:float-left before:h-0 pointer-events-none",
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      Image.configure({ allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // 표 기능
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
      }),
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

  // 저장/불러오기 제어
  useEffect(() => {
    if (!editor) return;

    if (!persist) {
      if (clearOnMount && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(`doc:${docId}`);
        } catch {}
      }
      return; // 저장/불러오기 스킵
    }

    // 불러오기
    try {
      const saved =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`doc:${docId}`)
          : null;
      if (saved) editor.commands.setContent(saved, false);
    } catch {}

    // 저장(스로틀)
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

  if (!editor) {
    return (
      <div className="min-h-[70dvh] px-8 py-8 animate-pulse text-neutral-300">
        에디터 로딩 중…
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 상단 툴바 */}
      <div className="sticky z-30 w-full border-b" style={{ top: toolbarOffset }}>
        <div className="mx-auto w-full px-4 py-2">
          <Toolbar editor={editor} theme={toolbarTheme} />
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto w-full px-8 py-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/* ───────── Toolbar (요청한 PNG 아이콘만 사용) ───────── */
function Toolbar({
  editor,
  theme = "light",
}: {
  editor: any;
  theme?: "dark" | "light";
}) {
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
        theme === "dark"
          ? "mx-1 h-5 w-px bg-neutral-800"
          : "mx-1 h-5 w-px bg-neutral-200"
      }
    />
  );

  // 블록 전환
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

  // 링크 삽입
  const insertLink = () => {
    const prev = editor.getAttributes("link")?.href as string | undefined;
    const href = prompt("링크 URL을 입력하세요", prev || "https://");
    if (href === null) return;
    if (href === "") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href }).run();
  };

  // 이미지(로컬 파일 → DataURL)
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

  // 파일 추가(다운로드 링크로 삽입)
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

  // 동영상 추가(로컬 파일 또는 URL)
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

  // 표 추가(3x3 기본)
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={["rounded-xl border px-3 py-2 flex flex-wrap items-center gap-2", tone].join(" ")}>
      {/* 블록 타입 드롭다운 */}
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

      {/* 텍스트 스타일 */}
      <TextBtn title="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </TextBtn>
      <TextBtn title="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </TextBtn>
      <TextBtn title="밑줄" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </TextBtn>
      <TextBtn title="취소선" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </TextBtn>

      <Sep />

      {/* 정렬 – PNG 아이콘 (좌측/가운데/우측) */}
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

      {/* 목록 – 글머리 기호는 PNG, 번호/할일은 텍스트 */}
      <IconBtn
        title="글머리 기호"
        src="/icons/글머리 기호.png"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <TextBtn title="번호 목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </TextBtn>
      <TextBtn title="할 일 목록" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        ☑
      </TextBtn>

      <Sep />

      {/* 링크/사진/파일/동영상/표 – PNG 아이콘 */}
      <IconBtn title="링크" src="/icons/링크.png" onClick={insertLink} />
      <IconBtn title="사진 추가" src="/icons/사진.png" onClick={insertImage} />
      <IconBtn title="파일 추가" src="/icons/파일추가.png" onClick={insertFile} />
      <IconBtn title="동영상 추가" src="/icons/동영상.png" onClick={insertVideo} />
      <IconBtn title="표 추가" src="/icons/표.png" onClick={insertTable} />

      <Sep />

      {/* 실행 취소/다시 실행 */}
      <TextBtn title="되돌리기" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </TextBtn>
      <TextBtn title="다시 실행" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </TextBtn>
    </div>
  );
}
