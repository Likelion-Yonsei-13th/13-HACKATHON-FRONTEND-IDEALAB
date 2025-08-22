"use client";

import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import CategoryDropdown from "./CategoryDropdown";

const CATEGORY_DATA = {
  음식점업: [
    "반찬가게",
    "분식전문점",
    "양식음식점",
    "일식음식점",
    "제과점",
    "중식음식점",
    "치킨전문점",
    "커피-음료",
    "패스트푸드점",
    "한식음식점",
    "호프-간이주점",
    "양식음식점",
  ],
  도소매업: [
    "가구",
    "가방",
    "가전제품",
    "문구",
    "미곡판매",
    "서적",
    "섬유제품",
    "수산물판매",
    "슈퍼마켓",
    "시계및귀금속",
    "신발",
    "안경",
    "애완동물",
    "완구",
    "운동/경기용품",
    "육류판매",
    "의료기기",
    "의약품",
    "일반의류",
    "자전거 및 기타운송장비",
    "조명용품",
    "철물점",
    "청과상",
    "컴퓨터및주변장치판매",
    "편의점",
    "핸드폰",
    "화장품",
    "화초",
  ],
  서비스업: [
    "PC방",
    "가전제품수리",
    "골프연습장",
    "네일숍",
    "노래방",
    "당구장",
    "미용실",
    "부동산중개업",
    "세탁소",
    "스포츠 강습",
    "스포츠클럽",
    "자동차미용",
    "자동차수리",
    "인테리어",
    "전자상거래업",
    "피부관리실",
  ],

  의료업: ["일반의원", "치과의원", "한의원", "의료기기", "의약품", "안경"],
  교육업: ["예술학원", "외국어학원", "일반교습학원"],
  숙박업: ["여관"],
};

export default function CategorySelector() {
  const [selections, setSelections] = useState({});

  const handleSelect = (category, item) => {
    setSelections((prev) => ({
      ...prev,
      [category]: item,
    }));

    // 선택 결과 확인 (백엔드로 보낼 데이터)
    console.log({ ...selections, [category]: item });
  };

  const handleSelectAll = () => {
    setSelections({});
    console.log({});
  };

  const isAnyCategorySelected = Object.values(selections).some((val) => val);

  return (
    <div className="flex items-center bg-white p-2 rounded-lg shadow-lg">
      <div className="pr-4 border-r">
        <p className="text-sm text-gray-500">업종</p>
      </div>

      <div className="flex items-center pl-4">
        <button
          onClick={handleSelectAll}
          className={`font-bold mr-4 ${
            !isAnyCategorySelected ? "text-blue-500" : "text-black"
          }`}
        >
          전체
        </button>

        <div className="flex items-center -space-x-4">
          {Object.entries(CATEGORY_DATA).map(([category, items]) => (
            <CategoryDropdown
              key={category}
              title={category}
              items={items}
              selectedItem={selections[category]}
              onSelect={(item) => handleSelect(category, item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
