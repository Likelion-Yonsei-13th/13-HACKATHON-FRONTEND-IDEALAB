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

// 백에서 받는 데이터 대신
const fetchMockData = (gu) => {
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
  // 기본 데이터 (서대문구 등)
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

export default function RightTab({ backendGu }) {
  const [selectedGu, setSelectedGu] = useState(backendGu || "서대문구");
  const [genderData, setGenderData] = useState(null);
  const [timeData, setTimeData] = useState(null);
  const [ageData, setAgeData] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [ageHighlight, setAgeHighlight] = useState(null);
  const [dayHighlight, setDayHighlight] = useState(null);
  const [maxAgeItem, setMaxAgeItem] = useState(null);
  const [maxDayItem, setMaxDayItem] = useState(null);
  const [maxTimeItem, setMaxTimeItem] = useState(null);
  const [maxGenderItem, setMaxGenderItem] = useState(null);
  const [summary, setSummary] = useState({
    gender: "",
    age: "",
    day: "",
    time: "",
  });

  const [activeLocation, setActiveLocation] = useState("");
  const [fetchedData, setFetchedData] = useState(null); //api로 받아온 데이터 저장

  useEffect(() => {
    if (backendGu && backendGu !== selectedGu) {
      setSelectedGu(backendGu);
    }
  }, [backendGu]);

  // const handleLocationClick = (locationName) => {
  //   setActiveLocation(locationName);
  // };

  const dummyData = {
    신촌: {
      title: "신촌",
      properties: {
        SIG_KOR_NM: "서대문구", // 'SIG.json' 파일의 'SIG_KOR_NM'과 일치하도록 수정
        district_id: "seodaemun-gu",
      },
    },
    성수: {
      title: "성수",
      properties: {
        SIG_KOR_NM: "성동구", // 'SIG.json' 파일의 'SIG_KOR_NM'과 일치하도록 수정
        district_id: "seogdong-gu",
      },
    },
    강남: {
      title: "강남",
      properties: {
        SIG_KOR_NM: "강남구", // 'SIG.json' 파일의 'SIG_KOR_NM'과 일치하도록 수정
        district_id: "gangnam-gu",
      },
    },
  };

  //지역 바뀔 때마다 api 호출
  useEffect(() => {
    if (activeLocation) {
      setFetchedData(dummyData[activeLocation]);
      // 실제 백엔드 API 엔드포인트에 맞춰 URL을 만듭니다.
      // const url = `http://당신백엔드서버주소/api/ai-data?location=${activeLocation}&type=요약`;

      // fetch 함수로 데이터를 받아옵니다.
      // fetch(url)
      //   .then((response) => {
      // 응답이 성공적이지 않으면 에러를 발생시킵니다.
      // if (!response.ok) {
      //   throw new Error("API 호출 실패");
      // }
      // 응답을 JSON 형태로 변환합니다.
      //   return response.json();
      // })
      // .then((data) => {
      // 성공적으로 받은 데이터를 상태에 저장합니다.
      //   setFetchedData(data.data); // 응답의 data 속성에 실제 데이터가 있다고 가정합니다.
      // })
      // .catch((error) => {
      // 에러 발생 시 콘솔에 출력합니다.
      // console.error("데이터를 받아오는 데 문제가 발생했습니다:", error);
      // 사용자에게 에러 메시지를 보여줄 수도 있습니다.
      // });
    }
  }, [activeLocation]);

  const [aiGeneratedButton, setAiGeneratedButton] = useState([]);
  const [activeAiButton, setActiveAiButton] = useState(null);

  useEffect(() => {
    const buttonNames = Object.keys(dummyData);

    const timer = setTimeout(() => {
      setAiGeneratedButton(buttonNames);
      setActiveAiButton(buttonNames[0]);
      setActiveLocation(buttonNames[0]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // ai 추천 지역 버튼
  const handleButtonClick = (buttonName) => {
    setActiveAiButton(buttonName);
    setActiveLocation(buttonName);
    const newGu = dummyData[buttonName].properties.SIG_KOR_NM;
    setSelectedGu(newGu);
  };

  // 그래프 그리기
  useEffect(() => {
    // 실제 API 호출 로직
    // const fetchData = async () => {
    //   const response = await fetch(`/api/dashboard-data?gu=${selectedGu}`);
    //   const data = await response.json();
    //   setGenderData(data.genderSales);
    //   setTimeData(data.timeSales);
    //   setAgeData(data.ageSales);
    //   setDayData(data.daySales);
    // };
    // fetchData();

    // 가짜 데이터로 테스트
    const data = fetchMockData(selectedGu);

    // 막대그래프 최대값 구하기
    if (data.ageData && data.ageData.length > 0) {
      const maxAgeItem = data.ageData.reduce((max, current) =>
        current.value > max.value ? current : max
      );
      setAgeHighlight(maxAgeItem.label);
    }

    if (data.dayData && data.dayData.length > 0) {
      const maxDayItem = data.dayData.reduce((max, current) =>
        current.value > max.value ? current : max
      );
      setDayHighlight(maxDayItem.label);
    }

    if (data.ageData?.length > 0) {
      const maxItem = data.ageData.reduce((max, current) =>
        current.value > max.value ? current : max
      );
      setMaxAgeItem(maxItem);
    }
    if (data.dayData?.length > 0) {
      const maxItem = data.dayData.reduce((max, current) =>
        current.value > max.value ? current : max
      );
      setMaxDayItem(maxItem);
    }
    if (data.timeData?.length > 0) {
      const maxItem = data.timeData.reduce((max, current) =>
        current.value > max.value ? current : max
      );
      setMaxTimeItem(maxItem);
    }
    if (data.genderData) {
      const genderLabel =
        data.genderData.female > data.genderData.male ? "여성" : "남성";
      const genderValue = Math.max(
        data.genderData.female,
        data.genderData.male
      );
      setMaxGenderItem({ label: genderLabel, value: genderValue });
    }

    if (data.summary) {
      setSummary(data.summary);
    }

    setGenderData(data.genderData);
    setTimeData(data.timeData);
    setAgeData(data.ageData);
    setDayData(data.dayData);
  }, [selectedGu]);

  if (!genderData || !timeData || !ageData || !dayData) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }

  return (
    <main className="flex flex-col h-screen gap-2">
      {/* 회의록- 기주님 */}

      {/* 상단 버튼 */}
      <div>
        <div className="flex flex-row pt-5 gap-2 pl-8">
          <p className="text-[14px] text-[#A5A6B9]">AI 정보 제공</p>
          <Image src="/aiInfo.svg" height={20} width={20} alt="안내" />
          <Image src="/aiInformation.png" height={17} width={500} alt="안내" />
        </div>
        {/* 위치 버튼 */}
        <div className="flex flex-row gap-2 pt-3 pl-10">
          {aiGeneratedButton.length > 0 ? (
            aiGeneratedButton.map((buttonName, index) => (
              <button
                key={index}
                onClick={() => handleButtonClick(buttonName)}
                className={`px-3 py-2 h-10 rounded-lg border ${
                  activeAiButton === buttonName
                    ? "bg-[#0472DE] text-[#ffffff]"
                    : "bg-[#ffffff] text-[#0472DE]"
                }`}
              >
                {buttonName}
              </button>
            ))
          ) : (
            <p>AI가 버튼을 생성하는 중입니다...</p>
          )}
        </div>
        {/* 사용자 선택 바 */}
        <div className="pl-8 pt-3 flex flex-row gap-2">
          {/* 지역선택 */}
          <div className="relative z-20">
            <GuSelect selectedGu={selectedGu} onGuChange={setSelectedGu} />
          </div>
          {/* 업종선택 */}
          <div className="flex items-start justify-center">
            <CategorySelector />
          </div>
        </div>
      </div>
      {/* 지도 */}
      <div className="flex px-12 py-7 relative z-10">
        <MapsGraphs selectedGu={selectedGu} />
      </div>
      {/* ai 정보 제공 */}
      {/* <div>
        {fetchedData && (
          <div className="pt-5 prose pr-2"> */}
      {/* <h2>{fetchedData.title}</h2> */}
      {/* <ReactMarkdown>{fetchedData.content}</ReactMarkdown>
          </div>
        )}
      </div> */}
      {/* 그래프 */}
      <div className="p-8">
        <div className="flex flex-col gap-8">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxDayItem?.label}({maxDayItem?.value}%) 매출이 가장 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
              {summary.day}
            </p>
            <BarChart
              data={dayData}
              highlightLabel={dayHighlight}
              title="요일별 매출 현황"
            />
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxGenderItem?.label}({maxGenderItem?.value}%) 매출이 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
              {summary.gender}
            </p>
            <PieChart data={genderData} />
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxTimeItem?.label} 매출이 가장 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
              {summary.time}
            </p>
            <LineChart data={timeData} />
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">
              {maxAgeItem?.label}({maxAgeItem?.value}%) 매출이 높아요.
            </h2>
            <p className="text-sm bg-blue-50 p-3 rounded-md mb-4">
              {summary.age}
            </p>
            <BarChart
              data={ageData}
              highlightLabel={ageHighlight}
              title="연령대별 매출 현황"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
