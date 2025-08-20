"use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function RightTab() {
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const today = new Date();
    // const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    const formattedDate = `${month}/${date}`;
    setCurrentDate(formattedDate);
  }, []);

  const [activeButton, setActiveButton] = useState("전체");

  const handleInfoClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const [activeLocation, setActiveLocation] = useState("");

  const handleLocationClick = (locationName) => {
    setActiveLocation(locationName);
  };

  const [fetchedData, setFetchedData] = useState(null); //api로 받아온 데이터 저장

  //지역 바뀔 때마다 api 호출
  useEffect(() => {
    const url = `https://api.example.com/ai-data?location=${activeLocation}&type=요약`;

    const dummyData = {
      "홍대 위치": {
        title: "홍대 상권 요약 (API로부터)",
        content:
          "### 홍대: 문화, 트렌드, 유동인구의 중심\n\n- **핵심 키워드**: 문화 예술, 젊음, 빠른 트렌드\n- **주요 고객**: 20~30대, 외국인 관광객\n- **창업 시 장점**: 강력한 SNS 파급력, 다양한 유동인구\n- **유의점**: 높은 임대료, 치열한 경쟁, 유행 주기 짧음",
      },
      "신촌 위치": {
        title: "신촌 상권 요약 (API로부터)",
        content:
          "### 신촌: 학생과 젊은 층의 활기찬 상권\n\n- **핵심 키워드**: 대학가, 활기, 복합 문화\n- **주요 고객**: 대학생, 10~20대\n- **창업 시 장점**: 꾸준한 수요, 새로운 아이디어 수용적\n- **유의점**: 빠른 유행 변화, 복잡한 골목 상권",
      },
      "합정 위치": {
        title: "합정 상권 요약 (API로부터)",
        content:
          "### 합정: 개성 있고 트렌디한 감성 상권\n\n- **핵심 키워드**: 독립적, 감성적, 예술적\n- **주요 고객**: 20~30대, 직장인, 커플\n- **창업 시 장점**: 개성 있는 분위기, 높은 SNS 노출\n- **유의점**: 홍대/신촌 대비 낮은 유동인구, 높은 임대료",
      },
    };

    setFetchedData(dummyData[activeLocation]);
  }, [activeLocation]);

  return (
    <main className="flex flex-row h-screen gap-2">
      {/* 회의록 */}
      <div className="pl-5 flex-1 overflow-y-auto">
        <h1 className="pt-5 font-semibold text-[30px]">{currentDate} 회의</h1>
        <h3 className="pt-5 text-[20px]">오늘 회의할 내용</h3>
        <div className="pl-2 pt-1">
          <ol className="list-decimal list-outside flex flex-col gap-2 px-4">
            <li className="bg-[#FFFCBA]">무드 레퍼런스 찾기</li>
            <li className="bg-[#FFFCBA]">위치별로 데이터 모으기</li>
            <li className="bg-[#FFFCBA]">
              업종 - 현재 있는 업종 중 참고할 만한 내용 정리
            </li>
          </ol>

          <p className="pt-7">어떤 무드로 할까?</p>
          <ul className="list-disc list-inside">
            <li>이상한 나라의 앨리스</li>
            <li>나무, 숲</li>
          </ul>
          <p className="pt-7">어떤 위치가 좋을까?</p>
          <ul className="list-disc list-inside font-bold underline text-underline-offset: auto">
            <li>홍대</li>
            <li>신촌</li>
            <li>합정</li>
          </ul>
        </div>
      </div>
      <div className="h-full w-px bg-black"></div>

      {/* ai 정보 제공 */}
      <div className="pl-5 flex-1 overflow-y-auto">
        <p className="pt-5 text-[15px] text-[#A5A6B9]">AI 정보 제공</p>
        <div className="flex flex-row gap-2 pt-3">
          <button
            onClick={() => handleInfoClick("전체")}
            className={`flex h-8 py-[1px] px-4 justify-center items-center gap-[-8px] rounded-[32px] border ${
              activeButton === "전체"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleInfoClick("요약")}
            className={`flex h-8 py-[1px] px-4 justify-center items-center gap-[-8px] rounded-[32px] border ${
              activeButton === "요약"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            요약
          </button>
          <button
            onClick={() => handleInfoClick("구체적")}
            className={`flex h-8 py-[1px] px-4 justify-center items-center gap-[-8px] rounded-[32px] border ${
              activeButton === "구체적"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            구체적
          </button>
        </div>
        <div className="flex flex-row gap-2 pt-3">
          <button
            onClick={() => handleLocationClick("홍대 위치")}
            className={`px-2 py-2 h-10 rounded-lg border ${
              activeLocation === "홍대 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            홍대 위치
          </button>
          <button
            onClick={() => handleLocationClick("신촌 위치")}
            className={`px-2 py-2 h-10 rounded-lg border ${
              activeLocation === "신촌 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            신촌 위치
          </button>
          <button
            onClick={() => handleLocationClick("합정 위치")}
            className={`px-2 py-2 h-10 rounded-lg border ${
              activeLocation === "합정 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            합정 위치
          </button>
        </div>
        {fetchedData && (
          <div className="pt-5 prose pr-2">
            {/* <h2>{fetchedData.title}</h2> */}
            <ReactMarkdown>{fetchedData.content}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className="h-full w-px bg-black"></div>
      {/* 지도 및 그래프 */}
      <div className="pl-5 flex-1 overflow-y-auto">
        <p>지도 및 그래프</p>
      </div>
    </main>
  );
}
