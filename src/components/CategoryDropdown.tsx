"use client";

import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";

export default function CategoryDropdown({
  title,
  items,
  selectedItem,
  onSelect,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-24 px-1 py-1 text-sm border-b-2
          ${
            selectedItem
              ? "border-blue-500 text-blue-500 font-bold"
              : "border-transparent"
          }`}
      >
        <span className="flex items-center whitespace-nowrap">
          {selectedItem || title}
          <IoChevronDown
            className={`transform transition-transform duration-200 ml-1 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <ul className="absolute z-30 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* 전체 선택 옵션 */}
          <li
            onMouseDown={() => handleSelect(null)} // null은 전체 선택
            className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
          >
            전체
          </li>
          {items.map((item) => (
            <li
              key={item}
              onMouseDown={() => handleSelect(item)}
              className="px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
