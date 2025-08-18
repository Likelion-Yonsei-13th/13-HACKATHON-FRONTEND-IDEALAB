"use client";
import { useEffect, useState } from "react";

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

  // 임시데이터
  const locationData = {
    "홍대 위치": `1. 홍대의 지리·교통 특징
위치: 서울 마포구 서교동·동교동 일대, 지하철 2호선 홍대입구역 중심.
교통 접근성
2호선, 공항철도, 경의중앙선 환승역 → 인천공항·김포공항과 바로 연결.
경의선 숲길·홍대거리 인근 버스 노선 다수.
인근 주요 상권(합정·상수·연남동)과 도보 연계 가능.
보행 유동량
20~30대 중심의 방문객이 많고, 주말·야간에 특히 밀집.
연남동·망원동·합정 등 인근 트렌디 지역과의 시너지로 유동인구 순환율 높음.
2. 상권의 성격
문화·예술 중심: 홍익대학교 미대·디자인 학과 영향 → 인디 문화, 라이브 공연, 아트 마켓, 스트리트 공연 활성화.
관광객 밀집: 외국인 관광객(특히 일본·중국·동남아) 비중 높음 → K-컬처, 뷰티, 패션, 한식 F&B 수요 강함.
소상공인·창작자 친화: 플리마켓, 셀러 페스티벌, 팝업스토어 활발.
트렌드 순환 속도 빠름: 유행 주기 3~6개월 내 변화 → 지속적 기획·마케팅 필요.
3. 고객층 특성
구분특징10대~20대 초반카페·디저트·패션·친구 모임 장소 수요 높음20대 후반~30대 초반개성 있는 음식점·펍·라이브 공연·전시 선호외국인 관광객K-팝 굿즈, 화장품, 전통·퓨전 음식, 한글 디자인 제품지역 주민주로 연남·망원·합정 거주, 주중 낮 유동인구 일부 형성
4. 창업 시 장점
유동인구 다양성: 내국인 + 외국인 + 예술·문화 종사자 혼합.
SNS·바이럴 파급력: 사진·영상 촬영 포인트가 많아 자연스러운 홍보 가능.
이벤트·행사 기회 풍부: 거리공연, 축제, 마켓 등으로 신규 유입 가능.
인접 상권 연계: 홍대 메인거리 → 연남 카페거리 → 합정·상수 유입 가능.
5. 창업 시 유의할 점
임대료: 메인거리(걷고싶은거리, 홍대입구역 9번 출구 인근)는 평당 임대료가 서울 평균 대비 높음. → 2~3층, 이면도로, 연남·합정 인근이 상대적으로 저렴.
경쟁 심화: F&B, 카페, 디저트, 패션 업종은 진입장벽 낮지만 경쟁 강도 매우 높음.
단기 유행 리스크: 콘셉트가 빠르게 식상해질 수 있어 시즌별 기획 필요.
관광객 의존 업종의 변동성: 환율·관광 규제 등에 민감.
6. 업종별 추천 방향
F&B: 이색 메뉴·비주얼 중심, 인스타그래머블한 인테리어·플레이팅 필수.
소품·패션: 한정판, 수공예, K-컬처 기반 디자인.
체험형 콘텐츠: 사진 스튜디오, 아트 클래스, VR/AR 게임 체험.
팝업스토어: 브랜드 테스트 마케팅용으로 단기 임대 적합.
📌 요약 홍대는 “다양한 유동인구 + 빠른 트렌드 순환 + 강력한 SNS 확산력”이 핵심 자산입니다. 다만 높은 임대료와 치열한 경쟁, 단기 유행 리스크를 고려해차별화된 콘셉트, 계절·이벤트별 변주, 오프라인·온라인 병행 전략이 필수입니다.`,
    "신촌 위치": "신촌 위치에 대한 상세 정보가 여기에 표시됩니다. 임시 데이터",
    "합정 위치": "합정 위치에 대한 상세 정보가 여기에 표시됩니다. 임시 데이터",
  };

  const [activeButton, setActiveButton] = useState("전체");

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const [activeLocation, setActiveLocation] = useState("");

  const handleLocationClick = (locationName) => {
    setActiveLocation(locationName);
  };

  return (
    <main className="flex flex-row h-screen gap-2">
      {/* 회의록 */}
      <div className="pl-5 flex-1 overflow-y-auto">
        <h1 className="pt-5 text-[40px]">{currentDate} 회의</h1>
        <h3 className="pt-5 text-[20px]">오늘 회의할 내용</h3>
        <div className="pl-2">
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
        <p>ai 정보 제공</p>
        <div className="flex flex-row gap-2">
          <button
            onClick={() => handleButtonClick("전체")}
            className={`flex h-10 py-[1px] px-5 justify-center items-center gap-[-8px] rounded-[32px] border ${
              activeButton === "전체"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => handleButtonClick("요약")}
            className={`flex h-10 py-[1px] px-5 justify-center items-center gap-[-8px] rounded-[32px] border ${
              activeButton === "요약"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            요약
          </button>
          <button
            onClick={() => handleButtonClick("구체적")}
            className={`flex h-10 py-[1px] px-5 justify-center items-center gap-[-8px] rounded-[32px] border ${
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
            className={`px-4 py-2 rounded-lg border ${
              activeLocation === "홍대 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            홍대 위치
          </button>
          <button
            onClick={() => handleLocationClick("신촌 위치")}
            className={`px-4 py-2 rounded-lg border ${
              activeLocation === "신촌 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            신촌 위치
          </button>
          <button
            onClick={() => handleLocationClick("합정 위치")}
            className={`px-4 py-2 rounded-lg border ${
              activeLocation === "합정 위치"
                ? "bg-[#0472DE] text-[#ffffff]"
                : "bg-[#ffffff] text-[#0472DE]"
            }`}
          >
            합정 위치
          </button>
        </div>
        <div>
          <p>{locationData[activeLocation]}</p>
        </div>
      </div>
      <div className="h-full w-px bg-black"></div>
      {/* 지도 및 그래프 */}
      <div className="pl-5 flex-1 overflow-y-auto">
        <p>지도 및 그래프</p>
      </div>
    </main>
  );
}
