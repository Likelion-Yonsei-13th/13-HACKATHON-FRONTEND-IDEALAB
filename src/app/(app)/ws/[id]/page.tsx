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
      <div className="h-14 border-b">
        <div className="h-full flex items-center gap-2 px-6">
          <span className="text-neutral-500">{crumb.section}</span>
          <span className="text-neutral-300">›</span>
          <span className="text-xl font-semibold truncate">{crumb.title}</span>
        </div>
      </div>
      <Editor docId={id} toolbarOffset={0} persist={true} />
    </div>
  );
}
