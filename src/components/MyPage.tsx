// app/mypage/page.tsx
"use client";

import { useState } from "react";
import {
  FiUser,
  FiClock,
  FiCreditCard,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";

type UserProfile = {
  name: string;
  email: string;
};

type AnalysisHistoryItem = {
  id: number;
  location: string;
  category: string;
  subCategory: string;
  date: string;
};

// --- API 연동 전 사용할 가짜 데이터 ---
const mockUserProfile: UserProfile = {
  name: "김창업",
  email: "startup.kim@example.com",
};

const mockAnalysisHistory: AnalysisHistoryItem[] = [
  {
    id: 1,
    location: "강남구",
    category: "음식점업",
    subCategory: "한식",
    date: "2025-08-24",
  },
  {
    id: 2,
    location: "서대문구",
    category: "서비스업",
    subCategory: "미용실",
    date: "2025-08-22",
  },
  {
    id: 3,
    location: "성동구",
    category: "도소매업",
    subCategory: "의류",
    date: "2025-08-21",
  },
  {
    id: 4,
    location: "마포구",
    category: "음식점업",
    subCategory: "카페",
    date: "2025-08-19",
  },
];
// --- ─────────────────────────────────── ---

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("history");

  const [user, setUser] = useState<UserProfile>(mockUserProfile);
  const [history, setHistory] =
    useState<AnalysisHistoryItem[]>(mockAnalysisHistory);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection user={user} />;
      case "history":
        return <HistorySection history={history} />;
      case "subscription":
        return <SubscriptionSection />;
      case "support":
        return <SupportSection />;
      default:
        return <HistorySection history={history} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 네비게이션 */}
      <aside className="w-64 bg-white p-6 border-r flex flex-col">
        <h1 className="text-2xl font-bold mb-8">마이페이지</h1>
        <nav className="flex flex-col space-y-2">
          {/* <SidebarButton
            icon={<FiClock />}
            label="나의 분석 내역"
            isActive={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          /> */}
          <SidebarButton
            icon={<FiUser />}
            label="내 정보 관리"
            isActive={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
          {/* <SidebarButton
            icon={<FiCreditCard />}
            label="구독 및 결제"
            isActive={activeTab === "subscription"}
            onClick={() => setActiveTab("subscription")}
          /> */}
          <SidebarButton
            icon={<FiHelpCircle />}
            label="고객지원"
            isActive={activeTab === "support"}
            onClick={() => setActiveTab("support")}
          />
        </nav>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 p-10 overflow-y-auto">{renderContent()}</main>
    </div>
  );
}

// --- 각 섹션 컴포넌트들 ---

const SidebarButton = ({ icon, label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
      isActive ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    <span className="mr-3 text-lg">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const HistorySection = ({ history }: { history: AnalysisHistoryItem[] }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">나의 분석 내역</h2>
    <div className="space-y-4">
      {history.map((item) => (
        <a
          key={item.id}
          href="#"
          className="block p-5 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {item.location} - {item.category} ({item.subCategory})
              </p>
              <p className="text-sm text-gray-500 mt-1">분석일: {item.date}</p>
            </div>
            <span className="text-blue-500 font-semibold">
              결과 보기 &rarr;
            </span>
          </div>
        </a>
      ))}
    </div>
  </div>
);

const ProfileSection = ({ user }: { user: UserProfile }) => (
  <div>
    <h2 className="text-3xl font-bold mb-6">내 정보 관리</h2>
    <div className="bg-white p-8 border rounded-lg shadow-sm">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">이름</label>
        <input
          type="text"
          value={user.name}
          disabled
          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <hr className="my-8" />
      <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>
      {/* ... 비밀번호 변경 폼 ... */}
      <button className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600">
        변경하기
      </button>
      <hr className="my-8" />
      <button className="text-red-500 hover:underline">회원 탈퇴</button>
    </div>
  </div>
);

const SubscriptionSection = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">구독 및 결제</h2>
    <div className="bg-white p-8 border rounded-lg shadow-sm">
      <p>
        현재 구독 플랜:{" "}
        <span className="font-bold text-blue-600">프로 플랜</span>
      </p>
      <p className="mt-2 text-sm text-gray-600">다음 결제일: 2025년 9월 15일</p>
      <div className="mt-6">
        <button className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 mr-4">
          플랜 변경
        </button>
        <button className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
          결제 내역 보기
        </button>
      </div>
    </div>
  </div>
);

const SupportSection = () => (
  <div>
    <h2 className="text-3xl font-bold mb-6">고객지원</h2>
    <div className="bg-white p-8 border rounded-lg shadow-sm">
      <a href="#" className="block text-blue-600 hover:underline mb-4">
        자주 묻는 질문 (FAQ)
      </a>
      <a href="#" className="block text-blue-600 hover:underline">
        1:1 문의하기
      </a>
    </div>
  </div>
);
