// src/app/(app)/ws/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";

type Crumb = { section: string; title: string };

export default function WorkspacePage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";

  const [crumb, setCrumb] = useState<Crumb>({
    section: "내 파일",
    title: "제목 없는 문서",
  });

  // 상단 고정 헤더 높이(px) — Editor.toolbarOffset에 그대로 넘김
  const headerH = 56; // h-14 ≒ 56px

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ws:breadcrumb");
      if (raw) {
        const parsed = JSON.parse(raw) as Crumb;
        if (parsed?.section && parsed?.title) {
          setCrumb(parsed);
          return;
        }
      }
      const metaRaw = localStorage.getItem(`meta:${id}`);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as Crumb;
        if (meta?.section && meta?.title) setCrumb(meta);
      }
    } catch {}
  }, [id]);

  return (
    <div className="flex-1 min-w-0">
      {/* ▷ 상단 브레드크럼: 스크롤해도 고정 */}
      <div
        className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 h-14"
        // h-14 = 56px (headerH와 맞춤)
      >
        <div className="h-full flex items-center gap-2 px-6">
          <span className="text-neutral-500">{crumb.section}</span>
          <span className="text-neutral-300">›</span>
          <span className="text-xl font-semibold truncate">{crumb.title}</span>
        </div>
      </div>

      {/* ▷ 에디터: 툴바를 브레드크럼 바로 아래에 붙이도록 오프셋 지정 */}
      <Editor docId={id} toolbarOffset={headerH} persist={true} />
    </div>
  );
}
