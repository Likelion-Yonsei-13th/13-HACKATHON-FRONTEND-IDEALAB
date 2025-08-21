"use client";

import { useEffect, useState } from "react";

export default function WorkspaceEditor({ id }: { id: string }) {
  const storageKey = `doc:${id}`;
  const [content, setContent] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setContent(saved);
  }, [storageKey]);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(storageKey, content), 300);
    return () => clearTimeout(t);
  }, [content, storageKey]);

  return (
    <div className="flex-1 min-w-0">
      <div className="h-14 border-b">
        <div className="h-full flex items-center px-6">
          <span className="text-2xl font-semibold">문서 편집</span>
          <span className="ml-3 text-neutral-400">/ {id}</span>
        </div>
      </div>

      <div className="p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여기에 자유롭게 작성해 보세요."
          className="w-full h-[68vh] rounded-lg border p-4 outline-none"
        />
      </div>
    </div>
  );
}
