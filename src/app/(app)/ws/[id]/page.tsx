// src/app/(app)/ws/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";
import { ENDPOINTS } from "@/lib/endpoints";

type Crumb = { section: string; title: string };

// 문서 id(f1, p3...) ↔ meeting_id(숫자) 매핑 보관 키
const MAP_KEY = "ws:doc2meeting";

export default function WorkspacePage() {
  const params = useParams();
  const docId = (params?.id as string) ?? "";

  const [crumb, setCrumb] = useState<Crumb>({
    section: "내 파일",
    title: "제목 없는 문서",
  });

  const [meetingId, setMeetingId] = useState<number | null>(null);
  const headerH = 56;

  // ① 브레드크럼 복구
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ws:breadcrumb");
      if (raw) {
        const parsed = JSON.parse(raw) as Crumb;
        if (parsed?.section && parsed?.title) {
          setCrumb(parsed);
        }
      } else {
        const metaRaw = localStorage.getItem(`meta:${docId}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw) as Crumb;
          if (meta?.section && meta?.title) setCrumb(meta);
        }
      }
    } catch {}
  }, [docId]);

  // ② 문서 id → meeting_id 확보(없으면 생성)
  useEffect(() => {
    if (!docId) return;

    const ensureMeeting = async () => {
      // 로컬 매핑 확인
      const map = (() => {
        try { return JSON.parse(localStorage.getItem(MAP_KEY) || "{}"); }
        catch { return {}; }
      })() as Record<string, number>;

      if (map[docId]) {
        setMeetingId(map[docId]);
        return;
      }

      // 생성 요청 (명세: POST /api/meetings/)
      try {
        const res = await fetch(ENDPOINTS.meetings.create, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            // 백엔드가 요구하는 필드에 맞게 이름만 전달
            // 없으면 title 정도만 넣어둠
            title: crumb.title || `Doc ${docId}`,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // 응답 예: { id: 6, ... }
        const j = await res.json();
        const newId: number = Number(j.id);
        if (!newId) throw new Error("Invalid meeting id");

        map[docId] = newId;
        localStorage.setItem(MAP_KEY, JSON.stringify(map));
        setMeetingId(newId);
      } catch (e) {
        console.error("meeting 생성 실패:", e);
      }
    };

    ensureMeeting();
  }, [docId, crumb.title]);

  return (
    <div className="flex-1 min-w-0">
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 h-14">
        <div className="h-full flex items-center gap-2 px-6">
          <span className="text-neutral-500">{crumb.section}</span>
          <span className="text-neutral-300">›</span>
          <span className="text-xl font-semibold truncate">{crumb.title}</span>
        </div>
      </div>

      {/* meetingId 확보 전에는 에디터만 보여주고, 녹음 버튼 누르면 안내 */}
      <Editor
        docId={docId}
        toolbarOffset={headerH}
        meetingId={meetingId ?? undefined}
      />
    </div>
  );
}
