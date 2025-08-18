"use client";

import { useEffect, useRef, useState } from "react";

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
  kind: CreateKind;                 // ★ 어디서 열렸는지
  onClose: () => void;
  onCreate: (p: NewProject) => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#f472b6", "#22c55e",
  ];

  if (!open) return null;

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed) return inputRef.current?.focus();
    onCreate({
      title: trimmed,
      color,
      icon: kind === "file" ? "file" : undefined, // 파일일 때만 아이콘 지정
    });
    onClose();
    setTitle("");
  };

  const T = TEXT[kind];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{T.modalTitle}</h2>

        <label className="block text-sm mb-1">{T.nameLabel}</label>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={T.placeholder}
          className="w-full rounded-md border px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-blue-100"
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
                className="h-7 w-7 rounded-sm ring-1 ring-black/10"
                style={{ backgroundColor: c, outline: color === c ? "2px solid black" : "none" }}
                aria-label={`color-${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-neutral-100 px-4 py-2 hover:bg-neutral-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {T.createLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
