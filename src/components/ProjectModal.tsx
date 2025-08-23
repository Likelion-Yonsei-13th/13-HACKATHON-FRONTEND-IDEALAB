// File: src/components/ProjectModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type NewProject = {
  title: string;
  color: string;
  icon?: "folder" | "file";
};

export type CreateKind = "project" | "folder" | "file";

const TEXT = {
  project: {
    modalTitle: "새 프로젝트 만들기",
    nameLabel: "프로젝트 이름",
    placeholder: "예: 신제품 런칭",
    createLabel: "생성",
  },
  folder: {
    modalTitle: "새 폴더 만들기",
    nameLabel: "폴더 이름",
    placeholder: "예: UI 디자인",
    createLabel: "폴더 생성",
  },
  file: {
    modalTitle: "새 파일 만들기",
    nameLabel: "파일 이름",
    placeholder: "예: 회의록.md",
    createLabel: "파일 생성",
  },
} as const;

export default function ProjectModal({
  open,
  kind,
  onClose,
  onCreate,
}: {
  open: boolean;
  kind: CreateKind;
  onClose: () => void;
  onCreate: (p: NewProject) => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const inputRef = useRef<HTMLInputElement>(null);

  // 포커스, ESC 닫기, 페이지 스크롤 잠금
  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [open, onClose]);

  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#f472b6",
    "#22c55e",
  ];

  if (!open) return null;

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    onCreate({
      title: trimmed,
      color,
      icon: kind === "file" ? "file" : undefined,
    });
    // 입력값 초기화 후 닫기
    setTitle("");
    onClose();
  };

  const T = TEXT[kind];

  // ✅ body 포털 + 최상위 z-index로 툴바/헤더 위에도 항상 덮이게
  return createPortal(
    <div
      className="fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* 모달 래퍼 (클릭 전파 차단) */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-[520px] max-w-[92vw] rounded-xl bg-white p-6 shadow-2xl border border-neutral-200"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="project-modal-title" className="text-xl font-semibold mb-4">
            {T.modalTitle}
          </h2>

          <label className="block text-sm mb-1">{T.nameLabel}</label>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={T.placeholder}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <label className="block text-sm mb-1">색상</label>
          <div className="mb-4 flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
              aria-label="color-picker"
            />
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-sm ring-1 ring-black/10 ${
                    color === c ? "outline outline-2 outline-black" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`color-${c}`}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 border border-neutral-200 hover:bg-neutral-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-md px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              {T.createLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
