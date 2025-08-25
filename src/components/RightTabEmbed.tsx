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

/* ───────── 타입 정의 ───────── */
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
  className?: string;
};

/* ───────── 헬퍼 함수 ───────── */

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
    음식점업: "restaurant",
    카페: "cafe",
    편의점: "convenience_store",
    병원: "hospital",
    학원: "academy",
    미용실: "beauty",
  };
  return map[kor] ?? kor;
}

/** 분기를 하나 이전으로 */
function prevYyq(cur: string): string {
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
  const selectedRegion = useInsightStore((s) => s.selectedRegion);
  const setGlobalRegion = useInsightStore((s) => s.setRegion);

  const [selectedGu, setSelectedGu] = useState<string>(backendGu || "서대문구");
  const [selections, setSelections] = useState<Record<string, string | null>>(
    {}
  );

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

  const [year] = useState<string>(String(new Date().getFullYear()));
  const yyq = useMemo(() => {
    const m = new Date().getMonth() + 1;
    const q = m <= 3 ? 1 : m <= 6 ? 2 : m <= 9 ? 3 : 4;
    return `${year}Q${q}`;
  }, [year]);

  useEffect(() => {
    if (selectedRegion && selectedRegion !== selectedGu) {
      setSelectedGu(selectedRegion);
    }
  }, [selectedRegion, selectedGu]);

  const mainCategory = useMemo<string>(() => {
    const first = Object.values(selections).find(Boolean);
    return (first as string) || "음식점업";
  }, [selections]);

  /* ───────── 핵심 데이터 로드 useEffect ───────── */
  useEffect(() => {
    const ac = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const base =
          ENDPOINTS?.analytics?.industryMetrics ??
          "/api/analytics/industry-metrics";
        const url = withQuery(base, {
          gu: selectedGu,
          category: toServerCategory(mainCategory),
          yyq: yyq,
        });

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) {
          throw new Error(`API 호출 실패: ${res.status}`);
        }

        const data = await res.json();

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
          Array.isArray(data?.aiRecommendations) ? data.aiRecommendations : []
        );

        const maxOf = (arr: ChartItem[] | null) =>
          arr && arr.length
            ? arr.reduce((m, c) => (c.value > m.value ? c : m))
            : null;

        setMaxAgeItem(maxOf(a));
        setMaxDayItem(maxOf(d));
        setMaxTimeItem(maxOf(t));
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.log("API 요청이 취소되었습니다.");
          return;
        }
        setError(
          e.message || "데이터를 불러오는 중 알 수 없는 오류가 발생했습니다."
        );
        console.error("[RightTabEmbed] load error:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedGu && mainCategory) {
      load();
    }

    return () => {
      ac.abort();
    };
  }, [selectedGu, mainCategory, yyq]);

  if (isLoading)
    return <div className={className}>데이터를 불러오는 중입니다…</div>;
  if (error)
    return <div className={className}>에러가 발생했습니다: {error}</div>;
  if (!genderData || !timeData || !ageData || !dayData)
    return <div className={className}>표시할 데이터가 없습니다.</div>;

  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* 헤더(고정) */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 pt-0 pb-3 border-b">
        <div className="flex flex-row items-center gap-2">
          <p className="text-[14px] text-[#A5A6B9]">AI 정보 제공</p>
          <Image src="/aiInfo.svg" height={20} width={20} alt="안내" />
          <Image src="/aiInformation.png" height={17} width={500} alt="안내" />
        </div>

        <div className="flex flex-row gap-2 pt-3">
          {aiGeneratedButton.map((b) => (
            <button
              key={`${b.name}-${b.gu}`}
              onClick={() => {
                setSelectedGu(b.gu);
                setGlobalRegion(b.gu);
              }}
              className={`px-3 py-2 h-10 rounded-lg border ${
                selectedGu === b.gu
                  ? "bg-[#0472DE] text-white"
                  : "bg-white text-[#0472DE]"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

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
        <div className="px-12 py-7">
          <MapsGraphs selectedGu={selectedGu} />
        </div>

        <div className="px-8 pb-8">
          <div className="flex flex-col gap-8">
            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                {summary.day?.heading}
              </h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
                {summary.day?.paragraph}
              </p>
              <BarChart
                data={dayData}
                highlightLabel={maxDayItem?.label}
                title="요일별 매출 현황"
              />
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                {summary.gender?.heading}
              </h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
                {summary.gender?.paragraph}
              </p>
              <PieChart data={genderData} />
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                {summary.time?.heading}
              </h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
                {summary.time?.paragraph}
              </p>
              <LineChart data={timeData} />
            </div>

            <div className="p-4 border rounded-lg">
              <h2 className="text-xl font-bold text-blue-600 mb-2">
                {summary.age?.heading}
              </h2>
              <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
                {summary.age?.paragraph}
              </p>
              <BarChart
                data={ageData}
                highlightLabel={maxAgeItem?.label}
                title="연령대별 매출 현황"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
