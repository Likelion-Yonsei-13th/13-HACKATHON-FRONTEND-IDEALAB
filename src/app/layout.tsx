// src/app/layout.tsx
import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head></head>
      <body className="min-h-dvh">
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=3c445bd9047174a854000dc17cd9cccf&autoload=false`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
      <body>{children}</body>
    </html>
  );
}
