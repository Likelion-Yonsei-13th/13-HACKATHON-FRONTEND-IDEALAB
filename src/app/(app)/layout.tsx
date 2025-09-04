// app/(app)/layout.tsx
import Script from "next/script";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAPS_KEY || "";

  return (
    <>
      {/* 카카오맵 SDK: 앱 전역에서 한 번만 로드 (서버 컴포넌트에서는 onLoad 쓰지 말기!) */}
      {kakaoKey ? (
        <Script
          id="kakao-maps-sdk"
          strategy="afterInteractive"
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
        />
      ) : (
        <script
          id="kakao-maps-missing"
          dangerouslySetInnerHTML={{
            __html:
              "console.error('[KAKAO] NEXT_PUBLIC_KAKAO_MAPS_KEY is missing. Maps will not work.');",
          }}
        />
      )}

      <div className="flex min-h-dvh">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </>
  );
}
