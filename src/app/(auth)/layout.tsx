// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // ⚠️ 여기에는 html/body 쓰지 말기 (루트에서 이미 렌더됨)
  return <div className="min-h-dvh">{children}</div>;
}
