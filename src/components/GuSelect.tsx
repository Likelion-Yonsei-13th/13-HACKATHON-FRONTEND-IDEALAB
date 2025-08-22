"use client";

import { useState } from "react";
import { IoLocationSharp, IoChevronDown } from "react-icons/io5";

// 서울시 구 목록 데이터
const SEOUL_GU_LIST = [
  "종로구",
  "중구",
  "용산구",
  "성동구",
  "광진구",
  "동대문구",
  "중랑구",
  "성북구",
  "강북구",
  "도봉구",
  "노원구",
  "은평구",
  "서대문구",
  "마포구",
  "양천구",
  "강서구",
  "구로구",
  "금천구",
  "영등포구",
  "동작구",
  "관악구",
  "서초구",
  "강남구",
  "송파구",
  "강동구",
];

export default function GuSelect({ selectedGu, onGuChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // 구를 선택했을 때 실행될 함수
  const handleSelect = (gu) => {
    onGuChange(gu); // 선택된 구로 state 업데이트
    setIsOpen(false); // 메뉴 닫기
  };

  return (
    // position-relative을 사용하여 드롭다운 메뉴의 기준점을 설정합니다.
    <div className="relative w-52">
      {/* 현재 선택된 구를 보여주는 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)} // 클릭하면 isOpen 상태를 반전시켜 메뉴를 열고 닫음
        className="flex items-center justify-between w-full px-4 py-3 bg-white shadow-lg rounded-lg shadow-sm text-[15px]"
      >
        <span className="flex items-center">
          <IoLocationSharp className="mr-2 text-blue-500" size={24} />
          서울특별시 <span className="font-bold ml-1">{selectedGu}</span>
        </span>
        <IoChevronDown
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* isOpen이 true일 때만 드롭다운 메뉴를 보여줍니다. */}
      {isOpen && (
        <ul className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {SEOUL_GU_LIST.map((gu) => (
            <li
              key={gu}
              onMouseDown={() => handleSelect(gu)}
              className="px-4 py-3 text-[17px] hover:bg-gray-100 cursor-pointer"
            >
              {gu}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
