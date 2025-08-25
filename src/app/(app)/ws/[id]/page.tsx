// src/app/(app)/ws/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";
import { ENDPOINTS } from "@/lib/endpoints";

type Crumb = { section: string; title: string };

// 문서 id(f1, p3 ...) ↔ meeting_id(숫자) 매핑
const MAP_KEY = "ws:doc2meeting";

export default function WorkspacePage() {
  const params = useParams();
  const docId = (params?.id as string) ?? "";

  // 상단 빵부스러기(폴더/제목)
  const [crumb, setCrumb] = useState<Crumb>({
    section: "내 파일",
    title: "제목 없는 문서",
  });

  // 백엔드 미팅 ID(숫자)
  const [meetingId, setMeetingId] = useState<number | null>(null);

  // 헤더 높이 (툴바 고정용)
  const headerH = 56;

  /* ─────────────────────────────────────────
   * ① 브레드크럼 복구 (localStorage)
   * ───────────────────────────────────────── */
  useEffect(() => {
    try {
      // 전역 저장된 마지막 위치가 있으면 우선
      const raw = localStorage.getItem("ws:breadcrumb");
      if (raw) {
        const parsed = JSON.parse(raw) as Crumb;
        if (parsed?.section && parsed?.title) {
          setCrumb(parsed);
          return;
        }
      }
      // 문서 메타가 있으면 사용
      const metaRaw = localStorage.getItem(`meta:${docId}`);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as Crumb;
        if (meta?.section && meta?.title) setCrumb(meta);
      }
    } catch {
      // ignore
    }
  }, [docId]);

  /* ─────────────────────────────────────────
   * ② 문서 id → meeting_id 확보(없으면 생성)
   *    - /api/meetings/ POST
   *    - 중복 생성 방지 가드 포함
   * ───────────────────────────────────────── */
  useEffect(() => {
    if (!docId) return;

    let creating = false; // 중복 호출 가드
    let aborted = false;  // 언마운트 가드

    const ensureMeeting = async () => {
      // 1) 로컬 매핑 먼저 확인
      const map: Record<string, number> = (() => {
        try {
          return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
        } catch {
          return {};
        }
      })();

      if (map[docId]) {
        if (!aborted) setMeetingId(map[docId]);
        return;
      }

      // 2) 없으면 생성
      if (creating) return;
      creating = true;

      try {
        const res = await fetch(ENDPOINTS.meetings.create, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: crumb.title || `Doc ${docId}`,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const newId = Number(j?.id);
        if (!newId) throw new Error("Invalid meeting id");

        map[docId] = newId;
        localStorage.setItem(MAP_KEY, JSON.stringify(map));
        if (!aborted) setMeetingId(newId);
      } catch (e) {
        console.error("meeting 생성 실패:", e);
      }
    };

    ensureMeeting();

    return () => {
      aborted = true;
      creating = false;
    };
  }, [docId, crumb.title]);

  /* ─────────────────────────────────────────
   * 렌더
   * ───────────────────────────────────────── */
  return (
    <div className="flex-1 min-w-0">
      {/* 상단 헤더 */}
      <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 h-14">
        <div className="h-full flex items-center gap-2 px-6">
          <span className="text-neutral-500">{crumb.section}</span>
          <span className="text-neutral-300">›</span>
          <span className="text-xl font-semibold truncate">{crumb.title}</span>
        </div>
      </div>

      {/* meetingId 유무와 관계없이 에디터는 표시.
          단, 녹음(STT) 기능은 meetingId가 생긴 뒤부터 정상 동작 */}
      <Editor
        docId={docId}
        toolbarOffset={headerH}
        meetingId={meetingId ?? undefined}
      />
    </div>
  );
}
