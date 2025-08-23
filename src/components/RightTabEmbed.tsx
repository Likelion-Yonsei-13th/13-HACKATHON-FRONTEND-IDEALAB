// File: src/components/RightTabEmbed.tsx
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MapsGraphs from "@/components/MapsGraphs";
import GuSelect from "@/components/GuSelect";
import CategorySelector from "@/components/CategorySelect";
import PieChart from "@/components/PieChart";
import LineChart from "@/components/LineChart";
import BarChart from "@/components/BarChart";
import Image from "next/image";

type Props = {
  backendGu?: string;
  className?: string; // 부모에서 높이/여백 제어
};

// page.tsx의 mock 데이터 로직 그대로 사용
const fetchMockData = (gu: string) => {
  console.log(`${gu}의 데이터를 새로 요청합니다...`);
  if (gu === "강남구") {
    return {
      genderData: { female: 70.1, male: 29.9 },
      timeData: [
        { time: "00~06시", value: 5 },
        { time: "06~11시", value: 10 },
        { time: "11~14시", value: 15 },
        { time: "14~17시", value: 30 },
        { time: "17~21시", value: 25 },
        { time: "21~24시", value: 15 },
      ],
      ageData: [
        { label: "10대", value: 2 },
        { label: "20대", value: 25 },
        { label: "30대", value: 40.2 },
        { label: "40대", value: 20 },
        { label: "50대", value: 10.8 },
        { label: "60대 이상", value: 2 },
      ],
      dayData: [
        { label: "월", value: 15 },
        { label: "화", value: 18 },
        { label: "수", value: 25.8 },
        { label: "목", value: 12 },
        { label: "금", value: 10 },
        { label: "토", value: 9.2 },
        { label: "일", value: 10 },
      ],
      summary: {
        gender:
          "강남구는 여성(70.1%) 고객의 소비가 활발한 지역입니다. 여성을 타겟으로 한 마케팅 전략이 유효할 수 있습니다.",
        age: "주요 소비층은 30대(40.2%)입니다. 구매력 있는 직장인을 대상으로 한 고급화 전략을 고려해 보세요.",
        day: "수요일(25.8%)에 매출이 가장 높게 나타납니다. 주중 점심 및 저녁 시간대 프로모션이 효과적일 수 있습니다.",
        time: "하루 중 14~17시 사이에 매출이 가장 높습니다. 늦은 점심 또는 이른 저녁 시간대 고객 유입을 유도해 보세요.",
      },
    };
  }
  return {
    genderData: { female: 61.7, male: 38.3 },
    timeData: [
      { time: "00~06시", value: 0 },
      { time: "06~11시", value: 8.3 },
      { time: "11~14시", value: 19.3 },
      { time: "14~17시", value: 52 },
      { time: "17~21시", value: 19.5 },
      { time: "21~24시", value: 1 },
    ],
    ageData: [
      { label: "10대", value: 1 },
      { label: "20대", value: 32.6 },
      { label: "30대", value: 11.7 },
      { label: "40대", value: 21.3 },
      { label: "50대", value: 30.3 },
      { label: "60대 이상", value: 3.1 },
    ],
    dayData: [
      { label: "월", value: 10.9 },
      { label: "화", value: 10.6 },
      { label: "수", value: 14.1 },
      { label: "목", value: 9.8 },
      { label: "금", value: 30.4 },
      { label: "토", value: 16.6 },
      { label: "일", value: 7.6 },
    ],
    summary: {
      gender:
        "선택상권은 여성(61.7%) 고객이 많은 상권입니다. 여성 고객의 방문에 도움이되는 요소에 보다 많은 투자를 고려하세요.",
      age: "선택상권의 외식업은 20대(32.6%)가 가장 활발한 소비를 보입니다. 젊은 층이 관심을 가질 만한 트렌디한 아이템 도입을 고려해 보세요.",
      day: "서대문구는 금요일에 가장 매출이 높습니다. 주말을 앞둔 약속이나 외식 수요가 높은 상권입니다.",
      time: "14~17시 매출이 가장 높습니다. 오후와 저녁시간대가 활발한 상권입니다.",
    },
  };
};

export default function RightTabEmbed({ backendGu, className }: Props) {
  const [selectedGu, setSelectedGu] = useState<string>(backendGu || "서대문구");
  const [genderData, setGenderData] = useState<any>(null);
  const [timeData, setTimeData] = useState<any>(null);
  const [ageData, setAgeData] = useState<any>(null);
  const [dayData, setDayData] = useState<any>(null);
  const [ageHighlight, setAgeHighlight] = useState<string | null>(null);
  const [dayHighlight, setDayHighlight] = useState<string | null>(null);
  const [maxAgeItem, setMaxAgeItem] = useState<any>(null);
  const [maxDayItem, setMaxDayItem] = useState<any>(null);
  const [maxTimeItem, setMaxTimeItem] = useState<any>(null);
  const [maxGenderItem, setMaxGenderItem] = useState<any>(null);
  const [summary, setSummary] = useState({ gender: "", age: "", day: "", time: "" });

  const [activeLocation, setActiveLocation] = useState("");
  const [fetchedData, setFetchedData] = useState<any>(null);

  useEffect(() => {
    if (backendGu && backendGu !== selectedGu) setSelectedGu(backendGu);
  }, [backendGu]); // eslint-disable-line

  const dummyData: any = {
    신촌: { title: "신촌", properties: { SIG_KOR_NM: "서대문구", district_id: "seodaemun-gu" } },
    성수: { title: "성수", properties: { SIG_KOR_NM: "성동구", district_id: "seogdong-gu" } },
    강남: { title: "강남", properties: { SIG_KOR_NM: "강남구", district_id: "gangnam-gu" } },
  };

  useEffect(() => {
    if (activeLocation) setFetchedData(dummyData[activeLocation]);
  }, [activeLocation]);

  const [aiGeneratedButton, setAiGeneratedButton] = useState<string[]>([]);
  const [activeAiButton, setActiveAiButton] = useState<string | null>(null);

  useEffect(() => {
    const names = Object.keys(dummyData);
    const t = setTimeout(() => {
      setAiGeneratedButton(names);
      setActiveAiButton(names[0]);
      setActiveLocation(names[0]);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  const handleButtonClick = (name: string) => {
    setActiveAiButton(name);
    setActiveLocation(name);
    const newGu = dummyData[name].properties.SIG_KOR_NM;
    setSelectedGu(newGu);
  };

  useEffect(() => {
    const data = fetchMockData(selectedGu);
    if (data.ageData?.length > 0) {
      const max = data.ageData.reduce((m: any, c: any) => (c.value > m.value ? c : m));
      setAgeHighlight(max.label);
      setMaxAgeItem(max);
    }
    if (data.dayData?.length > 0) {
      const max = data.dayData.reduce((m: any, c: any) => (c.value > m.value ? c : m));
      setDayHighlight(max.label);
      setMaxDayItem(max);
    }
    if (data.timeData?.length > 0) {
      const max = data.timeData.reduce((m: any, c: any) => (c.value > m.value ? c : m));
      setMaxTimeItem(max);
    }
    if (data.genderData) {
      const label = data.genderData.female > data.genderData.male ? "여성" : "남성";
      const value = Math.max(data.genderData.female, data.genderData.male);
      setMaxGenderItem({ label, value });
    }
    if (data.summary) setSummary(data.summary);

    setGenderData(data.genderData);
    setTimeData(data.timeData);
    setAgeData(data.ageData);
    setDayData(data.dayData);
  }, [selectedGu]);

  if (!genderData || !timeData || !ageData || !dayData) {
    return <div className={className}>데이터를 불러오는 중입니다...</div>;
  }

  // 페이지 래퍼 없이, 부모 높이에 맞춰 꽉 차게
  return (
    <div className={`flex flex-col h-full gap-2 ${className || ""}`}>
      {/* 상단 컨트롤 */}
      <div>
        <div className="flex flex-row pt-5 gap-2 pl-8">
          <p className="text-[14px] text-[#A5A6B9]">AI 정보 제공</p>
          <Image src="/aiInfo.svg" height={20} width={20} alt="안내" />
          <Image src="/aiInformation.png" height={17} width={500} alt="안내" />
        </div>

        <div className="flex flex-row gap-2 pt-3 pl-10">
          {aiGeneratedButton.length > 0 ? (
            aiGeneratedButton.map((name) => (
              <button
                key={name}
                onClick={() => handleButtonClick(name)}
                className={`px-3 py-2 h-10 rounded-lg border ${
                  activeAiButton === name ? "bg-[#0472DE] text-white" : "bg-white text-[#0472DE]"
                }`}
              >
                {name}
              </button>
            ))
          ) : (
            <p>AI가 버튼을 생성하는 중입니다...</p>
          )}
        </div>

        <div className="pl-8 pt-3 flex flex-row gap-2">
          <div className="relative z-20">
            <GuSelect selectedGu={selectedGu} onGuChange={setSelectedGu} />
          </div>
          <div className="flex items-start justify-center">
            <CategorySelector />
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="flex px-12 py-7 relative z-10">
        <MapsGraphs selectedGu={selectedGu} />
      </div>

      {/* 그래프 (내부 스크롤) */}
      <div className="p-8 overflow-auto">
        <div className="flex flex-col gap-8">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxDayItem?.label}({maxDayItem?.value}%) 매출이 가장 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.day}</p>
            <BarChart data={dayData} highlightLabel={dayHighlight} title="요일별 매출 현황" />
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxGenderItem?.label}({maxGenderItem?.value}%) 매출이 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.gender}</p>
            <PieChart data={genderData} />
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxTimeItem?.label} 매출이 가장 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.time}</p>
            <LineChart data={timeData} />
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxAgeItem?.label}({maxAgeItem?.value}%) 매출이 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">{summary.age}</p>
            <BarChart data={ageData} highlightLabel={ageHighlight} title="연령대별 매출 현황" />
          </div>
        </div>
      </div>
    </div>
  );
}
