"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MapsGraphs from "@/components/MapsGraphs";
import GuSelect from "@/components/GuSelect";
import CategorySelector from "@/components/CategorySelect";
import Image from "next/image";

export default function RightTab({ backendGu }) {
  const [currentDate, setCurrentDate] = useState("");
  const [selectedGu, setSelectedGu] = useState(backendGu || "서대문구");

  useEffect(() => {
    const today = new Date();
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
      content:
        "### 홍대: 문화, 트렌드, 유동인구의 중심\n\n- **핵심 키워드**: 문화 예술, 젊음, 빠른 트렌드\n- **주요 고객**: 20~30대, 외국인 관광객\n- **창업 시 장점**: 강력한 SNS 파급력, 다양한 유동인구\n- **유의점**: 높은 임대료, 치열한 경쟁, 유행 주기 짧음",
    },
    성수: {
      title: "성수",
      content:
        "### 신촌: 학생과 젊은 층의 활기찬 상권\n\n- **핵심 키워드**: 대학가, 활기, 복합 문화\n- **주요 고객**: 대학생, 10~20대\n- **창업 시 장점**: 꾸준한 수요, 새로운 아이디어 수용적\n- **유의점**: 빠른 유행 변화, 복잡한 골목 상권",
    },
    강남: {
      title: "강남",
      content:
        "### 합정: 개성 있고 트렌디한 감성 상권\n\n- **핵심 키워드**: 독립적, 감성적, 예술적\n- **주요 고객**: 20~30대, 직장인, 커플\n- **창업 시 장점**: 개성 있는 분위기, 높은 SNS 노출\n- **유의점**: 홍대/신촌 대비 낮은 유동인구, 높은 임대료",
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

  const handleButtonClick = (buttonName) => {
    setActiveAiButton(buttonName);
    setActiveLocation(buttonName);
  };

  return (
    <main className="flex flex-col h-screen gap-2">
      {/* 회의록 */}
      {/* <div className="pl-5 flex-1 overflow-y-auto">
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
      <div className="h-full w-px bg-black"></div> */}

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

        {/* <div className="flex flex-row gap-2 pt-3">
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
        </div> */}
      </div>
      {/* 지도 및 그래프 */}
      <div className="flex px-12 py-7 relative z-10">
        <MapsGraphs selectedGu={selectedGu} />
      </div>
      {/* ai 정보 제공 */}
      <div>
        {fetchedData && (
          <div className="pt-5 prose pr-2">
            {/* <h2>{fetchedData.title}</h2> */}
            <ReactMarkdown>{fetchedData.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </main>
  );
}
