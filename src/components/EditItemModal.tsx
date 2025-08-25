"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // ✅ 추가

export default function EditItemModal({
  open,
  initialTitle,
  initialColor,
  onClose,
  onSave,
}: {
  open: boolean;
  initialTitle: string;
  initialColor?: string;
  onClose: () => void;
  onSave: (v: { title: string; color?: string }) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState(initialColor ?? "#60a5fa");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setColor(initialColor ?? "#60a5fa");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();

    // ✅ 열려있는 동안 body 스크롤 잠금 (선택)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, initialTitle, initialColor, onClose]);

  if (!open) return null;

  const COLORS = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
    "#8b5cf6", "#06b6d4", "#f472b6", "#22c55e",
  ];

  // ✅ 모달 DOM
  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4" // z-index 살짝 키움
      role="dialog"
      aria-modal="true"
    >
      {/* 어두운 배경 */}
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="close"
        onClick={onClose}
      />
      {/* 모달 카드 */}
      <div
        className="relative z-[1] w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">이름/색상 수정</h2>

        <label className="block text-sm mb-1">이름</label>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="이름"
          className="w-full rounded-md border px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-blue-100"
          maxLength={50}
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
            onClick={() => {
              onSave({ title: title.trim() || initialTitle, color });
              onClose();
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );

  // ✅ body로 포탈 렌더
  return createPortal(modal, document.body);
}
