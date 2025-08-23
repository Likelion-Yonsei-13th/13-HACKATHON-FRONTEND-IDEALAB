// File: src/components/RightTabEmbed.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MapsGraphs from "@/components/MapsGraphs";
import GuSelect from "@/components/GuSelect";
import CategorySelector from "@/components/CategorySelect";
import PieChart from "@/components/PieChart";
import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";

type Props = {
  backendGu?: string;
  className?: string; // 부모에서 높이/여백 제어용
};

export default function RightTabEmbed({ backendGu, className }: Props) {
  const [selectedGu, setSelectedGu] = useState<string>(backendGu || "서대문구");
  const [selections, setSelections] = useState<Record<string, string | null>>(
    {}
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [genderData, setGenderData] = useState<any>(null);
  const [timeData, setTimeData] = useState<any>(null);
  const [ageData, setAgeData] = useState<any>(null);
  const [dayData, setDayData] = useState<any>(null);
  const [summary, setSummary] = useState<any>({});
  const [aiGeneratedButton, setAiGeneratedButton] = useState<string[]>([]);

  const [maxAgeItem, setMaxAgeItem] = useState<any>(null);
  const [maxDayItem, setMaxDayItem] = useState<any>(null);
  const [maxTimeItem, setMaxTimeItem] = useState<any>(null);
  const [maxGenderItem, setMaxGenderItem] = useState<any>(null);

  useEffect(() => {
    if (backendGu && backendGu !== selectedGu) setSelectedGu(backendGu);
  }, [backendGu]); // eslint-disable-line

  // 선택 구 변경 시 차트 데이터 갱신
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true); // 데이터 요청 시작 -> 로딩 상태 활성화
      setError(null);

      try {
        // 업종 선택값 가져오기 (첫 번째 선택된 업종 사용, 없으면 '음식점업' 기본값)
        const mainCategory =
          Object.values(selections).filter((v) => v)[0] || "음식점업";

        // API URL 동적으로 생성
        const apiUrl = `/api/dashboard/summary?gu=${selectedGu}&category=${mainCategory}`;
        console.log(`API 요청: ${apiUrl}`);

        // fetch 함수로 API 호출
        const response = await fetch(apiUrl);

        // 응답이 실패한 경우 (예: 404, 500 에러)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 응답 본문을 JSON으로 파싱
        const data = await response.json();

        // 받아온 실제 데이터로 모든 state 업데이트
        setGenderData(data.charts.genderSales);
        setTimeData(data.charts.timeSales);
        setAgeData(data.charts.ageSales);
        setDayData(data.charts.daySales);

        setSummary(data.summaries);
        setAiGeneratedButton(data.aiRecommendations);

        // 최댓값 계산 로직
        if (data.charts.ageSales?.length > 0) {
          const maxItem = data.charts.ageSales.reduce((m: any, c: any) =>
            c.value > m.value ? (m = c) : m
          );
          setMaxAgeItem(maxItem);
        }
        if (data.charts.daySales?.length > 0) {
          const maxItem = data.charts.daySales.reduce((m: any, c: any) =>
            c.value > m.value ? (m = c) : m
          );
          setMaxDayItem(maxItem);
        }
        if (data.charts.timeSales?.length > 0) {
          const maxItem = data.charts.timeSales.reduce((m: any, c: any) =>
            c.value > m.value ? (m = c) : m
          );
          setMaxTimeItem(maxItem);
        }
        if (data.summaries.gender) {
          setMaxGenderItem({
            label: data.summaries.gender.highlightLabel,
            value: data.summaries.gender.highlightValue,
          });
        }
      } catch (err: any) {
        // 에러 발생 시 에러 메시지 저장
        setError(err.message);
        console.error("API 호출 중 에러 발생:", err);
      } finally {
        // 성공하든 실패하든 항상 마지막에 로딩 상태 해제
        setIsLoading(false);
      }
    };

    loadDashboardData(); // 함수 실행
  }, [selectedGu, selections]); // '구' 또는 '업종'이 바뀔 때마다 재실행

  if (isLoading) {
    return <div className={className}>데이터를 불러오는 중입니다...</div>;
  }
  if (error) {
    return <div className={className}>에러가 발생했습니다: {error}</div>;
  }
  if (!genderData || !timeData || !ageData || !dayData) {
    return <div className={className}>표시할 데이터가 없습니다.</div>;
  }

  // ───────────────────────────────────────────────────────────────
  // 레이아웃: 헤더(sticky) 고정 + 본문만 스크롤
  return (
    <div className={`flex flex-col h-full ${className || ""}`}>
      {/* 헤더(고정) */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 pt-0 pb-3 border-b">
        <div className="flex flex-row items-center gap-2">
          <p className="text-[14px] text-[#A5A6B9]">AI 정보 제공</p>
          <Image src="/aiInfo.svg" height={20} width={20} alt="안내" />
          <Image src="/aiInformation.png" height={17} width={500} alt="안내" />
        </div>

        {/* 추천 지역 버튼 */}
        <div className="flex flex-row gap-2 pt-3">
          {aiGeneratedButton.map((button) => (
            <button
              key={button.name}
              onClick={() => setSelectedGu(button.gu)}
              className={`px-3 py-2 h-10 rounded-lg border ${
                selectedGu === button.gu
                  ? "bg-[#0472DE] text-white"
                  : "bg-white text-[#0472DE]"
              }`}
            >
              {button.name}
            </button>
          ))}
        </div>

        {/* 지역/업종 선택 */}
        <div className="pt-3 flex flex-row gap-2">
          <div className="relative z-20">
            <GuSelect selectedGu={selectedGu} onGuChange={setSelectedGu} />
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
