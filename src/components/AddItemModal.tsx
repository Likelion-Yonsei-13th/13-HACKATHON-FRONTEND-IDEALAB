"use client";

import { useEffect, useRef, useState } from "react";

export type AddItemPayload = {
  title: string;
  color?: string; // 색칩(선택)
};

export default function AddItemModal({
  title = "새 항목 만들기",
  placeholder = "이름을 입력하세요",
  defaultColor = "#60a5fa",
  showColor = true,
  onClose,
  onCreate,
}: {
  title?: string;
  placeholder?: string;
  defaultColor?: string;
  showColor?: boolean;
  onClose: () => void;
  onCreate: (data: AddItemPayload) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColor);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    if (!name.trim()) return;
    onCreate({ title: name.trim(), color: showColor ? color : undefined });
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30">
      <div className="w-[360px] rounded-xl border bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <label className="mb-2 block text-sm text-neutral-500">{placeholder}</label>
        <input
          ref={inputRef}
          className="mb-3 w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
        />

        {showColor && (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-neutral-500">색상</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border p-0"
              aria-label="색상 선택"
            />
            <span className="text-xs text-neutral-400">{color}</span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
          >
            취소
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}
