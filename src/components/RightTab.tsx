// src/components/RightTab.tsx
"use client";

import clsx from "clsx";
import { useState } from "react";

export default function RightTab({
  embed = false,
  className = "",
}: {
  /** 페이지 래퍼(패딩/헤더 등) 없이 패널만 렌더링할지 */
  embed?: boolean;
  /** 외부에서 높이/레이아웃을 제어하기 위한 클래스 */
  className?: string;
}) {
  // 필요한 상태들 예시 (기존 코드 옮겨 넣으면 됨)
  const [region, setRegion] = useState<string>("서울특별시");

  const content = (
    <div className={clsx("w-full h-full flex flex-col", className)}>
      {/* 상단 컨트롤 바 */}
      <div className="shrink-0 border-b px-4 py-3 flex items-center gap-2">
        <span className="font-semibold">AI 정보 제공</span>
        {/* 기존 필터/버튼들 그대로 옮겨오세요 */}
        {/* 예) 지역 선택 */}
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

      {/* 본문: 지도/차트/추천 카드 등 */}
      <div className="grow overflow-auto p-4 space-y-4">
        {/* 예시 패널들 — 기존 RightTab 내부 UI를 여기로 옮겨오면 됩니다 */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">지도</h3>
          <div className="h-72 bg-gray-50 rounded-md grid place-items-center">
            {/* 실제 지도 컴포넌트로 교체 */}
            <span className="text-gray-400">Map goes here</span>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">요일별 매출</h3>
          {/* 차트/리포트 컴포넌트 배치 */}
          <p className="text-sm text-gray-600">금요일 매출이 가장 높아요…</p>
        </div>
      </div>
    </div>
  );

  // 단독 페이지로 쓸 때는 래퍼 포함, 임베드면 패널만 반환
  if (embed) return content;
  return <main className="p-4">{content}</main>;
}
