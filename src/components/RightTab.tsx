// File: src/components/RightTab.tsx
"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/lib/endpoints";
import { useInsightStore } from "@/store/insight";
import MapsGraphs from "@/components/MapsGraphs";

type RegionInfoResponse = { message?: string };

// ENDPOINTS.geo.regionInfo(region) 이 함수가 아니거나 없을 때를 대비
function buildRegionInfoURL(region: string) {
  try {
    if (typeof ENDPOINTS?.geo?.regionInfo === "function") {
      return ENDPOINTS.geo.regionInfo(region);
    }
  } catch {}
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const u = new URL("/api/regions/info", origin);
  u.searchParams.set("gu", region); // 서버 규격: ?gu=<구 이름>
  return u.toString();
}

export default function RightTab({
  embed = false,
  className = "",
}: {
  embed?: boolean;
  className?: string;
}) {
  // 전역 스토어와 동기화 (오른쪽/다른 위젯과 지역을 공유)
  const storeRegion = useInsightStore((s) => s.selectedRegion);
  const setStoreRegion = useInsightStore((s) => s.setRegion);

  // 기본값은 구 단위로(서버 쿼리 ?gu=...과 일치)
  const [region, setRegion] = useState<string>(storeRegion || "서대문구");

  useEffect(() => {
    if (storeRegion && storeRegion !== region) setRegion(storeRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeRegion]);

  useEffect(() => {
    if (region !== storeRegion) setStoreRegion(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  const [salesInfo, setSalesInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 지역 바뀔 때마다 백엔드에서 데이터 불러오기 (실패 시 데모로 폴백)
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setErr("");
      setSalesInfo("");

      try {
        const url = buildRegionInfoURL(region);
        const res = await fetch(url, { signal: ac.signal, credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as RegionInfoResponse;
        setSalesInfo(data.message || "");
      } catch (e: any) {
        if (e?.name === "AbortError") return; // 페이지 전환/지역 변경 중단은 무시
        // 💡 로컬/404/네트워크 실패 시에도 사용자 경험 유지
        setErr(e?.message || "불러오기 실패");
        setSalesInfo(`${region}은(는) 주말 매출이 다소 높은 경향이 있습니다.`); // 데모 문구
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
        {/* 구 단위 선택(서버 ?gu= 와 일치) */}
        <select
          className="border rounded-md px-2 py-1"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          {[
            "서대문구",
            "마포구",
            "용산구",
            "중구",
            "종로구",
            "성동구",
            "광진구",
            "강남구",
            "송파구",
          ].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* 본문 */}
      <div className="grow overflow-auto p-4 space-y-4">
        {/* 지도 */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">지도</h3>
          <div className="h-[360px] rounded-md overflow-hidden">
            <MapsGraphs selectedGu={region} />
          </div>
        </div>

        {/* 요일별 매출(설명 메시지) */}
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold mb-2">요일별 매출</h3>
          {loading && <p className="text-sm text-gray-500">불러오는 중…</p>}
          {!loading && err && (
            <p className="text-xs text-amber-700">
              서버 응답에 문제가 있어 데모 메시지를 표시합니다. ({err})
            </p>
          )}
          {!loading && (
            <p className="text-sm text-gray-700">{salesInfo || "데이터 없음"}</p>
          )}
        </div>
      </div>
    </div>
  );

  return embed ? content : <main className="p-4">{content}</main>;
}
