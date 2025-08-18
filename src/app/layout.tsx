import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "IDEALab",
  description: "Workspace UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="h-dvh">
        {/* 화면 전체를 좌/우로 나누는 레이아웃 */}
        <div className="flex min-h-dvh">
          {/* 왼쪽: 사이드바(고정) */}
          <Sidebar />
          {/* 오른쪽: 컨텐츠(여기가 스크롤됨) */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
