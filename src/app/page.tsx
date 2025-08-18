// src/app/page.tsx
import ClientEditor from "@/components/Editor";
import Breadcrumb from "@/components/Breadcrumb";

export default function Page() {
  const fileTitle = "제목 없는 문서"; // 상태/라우터에서 가져오면 교체
  const crumbs = [{ label: "내 파일", href: "#" }, { label: fileTitle }];

  return (
    <main className="min-h-screen">
      {/* 상단 고정 헤더 */}
      <div className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-screen-2xl px-6 h-14 flex items-center justify-between">
          {/* 왼쪽: 브레드크럼 + 제목 */}
          <div className="flex flex-col">
            <Breadcrumb items={crumbs} />
            {/* 필요하면 큰 제목 노출 */}
            {/* <div className="text-lg font-semibold text-neutral-800">{fileTitle}</div> */}
          </div>

          {/* 오른쪽: 액션 버튼들(예시) */}
          <div className="flex items-center gap-2">
            <button className="px-3 h-8 rounded-lg border text-sm">공유</button>
            <button className="px-3 h-8 rounded-lg bg-black text-white text-sm">내보내기</button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto max-w-screen-2xl px-6 py-6">
        <h1 className="sr-only">Editor</h1>
        <ClientEditor />
      </div>
    </main>
  );
}
