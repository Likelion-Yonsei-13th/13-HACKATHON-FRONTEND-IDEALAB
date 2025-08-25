// File: src/components/RightTab.tsx
"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/endpoints";

export default function RightTab({
  embed = false,
  className = "",
}: {
  /** 페이지 래퍼(패딩/헤더 등) 없이 패널만 렌더링할지 */
  embed?: boolean;
  /** 외부에서 높이/레이아웃을 제어하기 위한 클래스 */
  className?: string;
}) {
  // 선택된 지역(구/광역)
  const [region, setRegion] = useState<string>("서울특별시");

  // 백엔드에서 가져온 데이터
  const [salesInfo, setSalesInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 지역 바뀔 때마다 백엔드에서 데이터 불러오기
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        setSalesInfo("");

        // ✅ endpoints.ts에 맞게 호출 (끝에 / 포함된 경로)
        // 서버 규격: GET /regions/info/?gu=<지역명>
        const url = ENDPOINTS.geo.regionInfo(region);
        const res = await fetch(url, { signal: ac.signal });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // 예: { message: "금요일 매출이 가장 높아요…" }
        const data = await res.json();
        setSalesInfo(data.message || "데이터 없음");
      } catch (e: any) {
        setErr(e.message || "불러오기 실패");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [region]);

  const content = (
    <div className={clsx("w-full h-full flex flex-col", className)}>
      {/* 상단 컨트롤 바 */}
      <div className="shrink-0 border-b px-4 py-3 flex items-center gap-2">
        <span className="font-semibold">AI 정보 제공</span>
        <select
          className="border rounded-md px-2 py-1"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option>서울특별시</option>
          <option>경기도</option>
          <option>인천광역시</option>
        </select>
      </div>

      {/* 본문 */}
      <div className="grow overflow-auto p-4 space-y-4">
        {/* 지도 */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">지도</h3>
          <div className="h-72 bg-gray-50 rounded-md grid place-items-center">
            <span className="text-gray-400">Map goes here</span>
          </div>
        </div>

        {/* 요일별 매출(설명 메시지) */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">요일별 매출</h3>
          {loading && <p className="text-sm text-gray-500">불러오는 중…</p>}
          {err && <p className="text-sm text-red-600">에러: {err}</p>}
          {!loading && !err && (
            <p className="text-sm text-gray-600">{salesInfo}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (embed) return content;
  return <main className="p-4">{content}</main>;
}
