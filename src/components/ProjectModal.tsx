"use client";

import { useEffect, useRef, useState } from "react";

export type NewProject = {
  title: string;
  color: string;            // 예: "#3b82f6"
  icon?: "folder" | "file"; // (옵션) 필요 시 사용
};

export default function ProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: NewProject) => void;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState<"folder" | "file">("folder");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f472b6", "#22c55e"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold mb-4">새 프로젝트 만들기</h2>

        <label className="block text-sm mb-1">프로젝트 이름</label>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 신제품 런칭"
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
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-sm ring-1 ring-black/10"
                style={{ backgroundColor: c, outline: color === c ? "2px solid black" : "none" }}
                type="button"
                aria-label={`color-${c}`}
              />
            ))}
          </div>
        </div>

        {/* (옵션) 아이콘 타입 유지해도 표시엔 영향 없음. 색상 네모만 보여줄 거라 생략 가능 */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md bg-neutral-100 px-4 py-2 hover:bg-neutral-200" type="button">
            취소
          </button>
          <button
            onClick={() => {
              const trimmed = title.trim();
              if (!trimmed) return inputRef.current?.focus();
              onCreate({ title: trimmed, color, icon });
              onClose();
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            type="button"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}
