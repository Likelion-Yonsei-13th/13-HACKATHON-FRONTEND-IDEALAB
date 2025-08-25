// File: src/components/RightTabEmbed.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import MapsGraphs from "@/components/MapsGraphs";
import GuSelect from "@/components/GuSelect";
import CategorySelector from "@/components/CategorySelect";
import PieChart from "@/components/PieChart";
import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";
import { useInsightStore } from "@/store/insight";
import { ENDPOINTS } from "@/lib/endpoints";

/* ───────── Types ───────── */
type ChartItem = { label: string; value: number };
type AiReco = { name: string; gu: string };

type SummBlk = { heading: string; paragraph: string };
type Summary = {
  day?: SummBlk;
  gender?: SummBlk & { highlightLabel?: string; highlightValue?: number };
  time?: SummBlk;
  age?: SummBlk;
};

type Props = {
  backendGu?: string;
  /** 부모에서 높이/여백 제어용 */
  className?: string;
};

/* ───────── Helpers ───────── */

/** base(url) + query를 안전하게 합치기 (절대/상대 모두 대응) */
function withQuery(base: string, params: Record<string, string | undefined>) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const u = new URL(base, origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") u.searchParams.set(k, v);
  });
  return u.toString();
}

/** 한글 카테고리를 서버 토큰으로 변환(없으면 원문 그대로) */
function toServerCategory(kor: string): string {
  const map: Record<string, string> = {
    "음식점업": "restaurant",
    "카페": "cafe",
    "편의점": "convenience_store",
    "병원": "hospital",
    "학원": "academy",
    "미용실": "beauty",
  };
  return map[kor] ?? kor;
}

/** 분기를 하나 이전으로 */
function prevYyq(cur: string): string {
  // cur: "YYYYQn"
  const m = cur.match(/^(\d{4})Q([1-4])$/);
  if (!m) return cur;
  let y = Number(m[1]);
  let q = Number(m[2]);
  if (q === 1) {
    y -= 1;
    q = 4;
  } else {
    q -= 1;
  }
  return `${y}Q${q}`;
}

export default function RightTabEmbed({ backendGu, className }: Props) {
  /* ───────── 전역(에디터 ↔ 패널) 연결 ───────── */
  const selectedRegion = useInsightStore((s) => s.selectedRegion);
  const setGlobalRegion = useInsightStore((s) => s.setRegion);

  /* ───────── 로컬 상태 ───────── */
  const [selectedGu, setSelectedGu] = useState<string>(backendGu || "서대문구");
  const [selections, setSelections] = useState<Record<string, string | null>>({});

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [genderData, setGenderData] = useState<ChartItem[] | null>(null);
  const [timeData, setTimeData] = useState<ChartItem[] | null>(null);
  const [ageData, setAgeData] = useState<ChartItem[] | null>(null);
  const [dayData, setDayData] = useState<ChartItem[] | null>(null);
  const [summary, setSummary] = useState<Summary>({});
  const [aiGeneratedButton, setAiGeneratedButton] = useState<AiReco[]>([]);

  const [maxAgeItem, setMaxAgeItem] = useState<ChartItem | null>(null);
  const [maxDayItem, setMaxDayItem] = useState<ChartItem | null>(null);
  const [maxTimeItem, setMaxTimeItem] = useState<ChartItem | null>(null);

  // 현재 분기(yyq) 자동 계산
  const [year] = useState<string>(String(new Date().getFullYear()));
  const yyq = useMemo(() => {
    const m = new Date().getMonth() + 1; // 1~12
    const q = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
    return `${year}Q${q}`;
  }, [year]);

  /* 외부(백엔드 prop) → selectedGu 반영 */
  useEffect(() => {
    if (backendGu && backendGu !== selectedGu) setSelectedGu(backendGu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendGu]);

  /* 에디터 RegionMark 클릭 → 패널 selectedGu 반영 */
  useEffect(() => {
    if (!selectedRegion) return;
    if (selectedRegion !== selectedGu) setSelectedGu(selectedRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion]);

  /* 현재 선택된 업종(첫 번째) */
  const mainCategory = useMemo<string>(() => {
    const first = Object.values(selections).find(Boolean);
    return (first as string) || "음식점업";
  }, [selections]);

  /* ───────── 데이터 로드 ───────── */
  useEffect(() => {
    const ac = new AbortController();
    let disposed = false;

    const base =
      ENDPOINTS?.analytics?.industryMetrics ??
      "/api/analytics/industry-metrics";

    async function fetchOnce(gu: string, when: string) {
      const url = withQuery(base, {
        gu,
        category: toServerCategory(mainCategory),
        yyq: when, // 백엔드 요구사항: yyq만 사용
      });

      const res = await fetch(url, { signal: ac.signal });
      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");

      if (!res.ok) {
        let detail = "";
        try {
          detail = isJson ? JSON.stringify(await res.json()) : await res.text();
        } catch {
          /* noop */
        }
        const err = new Error(`HTTP ${res.status} @ ${url}`);
        // @ts-expect-error attach
        err.status = res.status;
        // @ts-expect-error attach
        err.detail = (detail || "").slice(0, 500);
        throw err;
      }

      if (!isJson) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Expected JSON but got "${ct}" @ ${url}\n↳ ${body.slice(0, 500)}`
        );
      }

      return res.json();
    }

    function hydrateChartsFromData(data: any) {
      const g: ChartItem[] | null = data?.charts?.genderSales ?? null;
      const t: ChartItem[] | null = data?.charts?.timeSales ?? null;
      const a: ChartItem[] | null = data?.charts?.ageSales ?? null;
      const d: ChartItem[] | null = data?.charts?.daySales ?? null;

      setGenderData(g);
      setTimeData(t);
      setAgeData(a);
      setDayData(d);
      setSummary(data?.summaries ?? {});
      setAiGeneratedButton(
        Array.isArray(data?.aiRecommendations)
          ? (data.aiRecommendations as AiReco[])
          : []
      );

      const maxOf = (arr: ChartItem[] | null) =>
        arr && arr.length
          ? arr.reduce((m, c) => (c.value > m.value ? c : m))
          : null;

      setMaxAgeItem(maxOf(a));
      setMaxDayItem(maxOf(d));
      setMaxTimeItem(maxOf(t));
    }

    function clearCharts() {
      setGenderData(null);
      setTimeData(null);
      setAgeData(null);
      setDayData(null);
      setSummary({});
      setAiGeneratedButton([]);
      setMaxAgeItem(null);
      setMaxDayItem(null);
      setMaxTimeItem(null);
    }

    async function load() {
      setIsLoading(true);
      setError(null);

      // 현재 분기부터 최대 5분기 과거로 후퇴
      const tryYyqs: string[] = [];
      let cur = yyq;
      for (let i = 0; i < 5; i++) {
        tryYyqs.push(cur);
        cur = prevYyq(cur);
      }

      // 데이터가 잘 있는 구 후보
      const guFallbacks = ["마포구", "강남구", "송파구", "중구", "종로구"];

      try {
        // 1) 현재 선택 구에서 분기 후퇴 재시도
        for (const when of tryYyqs) {
          try {
            const data = await fetchOnce(selectedGu, when);
            if (disposed) return;
            hydrateChartsFromData(data);
            return; // 성공!
          } catch (e: any) {
            const msg = String(e?.detail ?? e?.message ?? "");
            if (e?.status === 404 && msg.includes("상권(TRDAR)이 없습니다")) {
              continue; // 다음 분기 시도
            }
            // 다른 오류는 바로 노출
            throw e;
          }
        }

        // 2) 구를 바꿔서(1회) 시도
        for (const altGu of guFallbacks) {
          for (const when of tryYyqs) {
            try {
              const data = await fetchOnce(altGu, when);
              if (disposed) return;
              // 대체 구로 성공했음을 안내하고 상태 반영
              setSelectedGu(altGu);
              setGlobalRegion(altGu);
              hydrateChartsFromData(data);
              setError(
                `알림: '${selectedGu}'에는 ${tryYyqs[0]} 기준 데이터가 없어 '${altGu}' 데이터로 표시했어요.`
              );
              return;
            } catch (e: any) {
              const msg = String(e?.detail ?? e?.message ?? "");
              if (e?.status === 404 && msg.includes("상권(TRDAR)이 없습니다"))
                continue;
            }
          }
        }

        // 3) 모두 실패
        setError(
          `선택한 구('${selectedGu}')와 최근 분기들에 해당하는 데이터가 없습니다. 다른 구나 분기를 선택해 보세요.`
        );
        clearCharts();
      } catch (e: any) {
        if (disposed) return;
        const msg =
          e instanceof Error
            ? `${e.message}${e.detail ? `\n↳ ${e.detail}` : ""}`
            : "알 수 없는 오류";
        setError(msg);
        console.error("[RightTabEmbed] load error:", e);
        clearCharts();
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    load();
    return () => {
      disposed = true;
      ac.abort();
    };
  }, [selectedGu, mainCategory, yyq, setGlobalRegion]);

  /* ───────── 로딩/에러/빈 상태 ───────── */
  if (isLoading) return <div className={className}>데이터를 불러오는 중입니다…</div>;
  if (error) return <div className={className}>에러가 발생했습니다: {error}</div>;
  if (!genderData || !timeData || !ageData || !dayData)
    return <div className={className}>표시할 데이터가 없습니다.</div>;

  /* ───────── UI ───────── */
  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* 헤더(sticky) */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 pt-0 pb-3 border-b">
        <div className="flex flex-row items-center gap-2">
          <p className="text-[14px] text-[#A5A6B9]">AI 정보 제공</p>
          <Image src="/aiInfo.svg" height={20} width={20} alt="안내" />
          <Image src="/aiInformation.png" height={17} width={500} alt="안내" />
        </div>

        {/* 추천 지역 버튼 */}
        <div className="flex flex-row gap-2 pt-3">
          {aiGeneratedButton.map((b) => (
            <button
              key={`${b.name}-${b.gu}`}
              onClick={() => {
                setSelectedGu(b.gu);
                setGlobalRegion(b.gu); // 전역 동기화
              }}
              className={`px-3 py-2 h-10 rounded-lg border ${
                selectedGu === b.gu ? "bg-[#0472DE] text-white" : "bg-white text-[#0472DE]"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* 지역/업종 선택 */}
        <div className="pt-3 flex flex-row gap-2">
          <div className="relative z-20">
            <GuSelect
              selectedGu={selectedGu}
              onGuChange={(gu) => {
                setSelectedGu(gu);
                setGlobalRegion(gu);
              }}
            />
          </div>
          <div className="flex items-start justify-center">
            <CategorySelector
              selections={selections}
              onSelectionChange={setSelections}
            />
          </div>
        </div>
      </div>

      {/* 본문(스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        {/* 지도 */}
        <div className="px-12 py-7">
          <MapsGraphs selectedGu={selectedGu} />
        </div>

        {/* 그래프들 */}
        <div className="px-8 pb-8">
          <div className="flex flex-col gap-8">
            {/* 요일 */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">{summary.day?.heading}</h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.day?.paragraph}</p>
              <BarChart data={dayData} highlightLabel={maxDayItem?.label} title="요일별 매출 현황" />
            </div>

            {/* 성별 */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">{summary.gender?.heading}</h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.gender?.paragraph}</p>
              <PieChart data={genderData} />
            </div>

            {/* 시간대 */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">{summary.time?.heading}</h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.time?.paragraph}</p>
              <LineChart data={timeData} />
            </div>

            {/* 연령대 */}
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">{summary.age?.heading}</h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.age?.paragraph}</p>
              <BarChart data={ageData} highlightLabel={maxAgeItem?.label} title="연령대별 매출 현황" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
