"use client";

import { useEffect, useState } from "react";
// import { trim15 } from "@/lib/strings";  // ✅ 여기로 변경
// 나머지 코드는 그대로


type Item = { id: string; title: string; color?: string; icon?: "folder" | "file" };
type Section = { key: string; title: string; items?: Item[]; icon?: "workspace" | "folder" | "file" };

const SECTIONS: Section[] = [
  {
    key: "ws",
    title: "멋사의 워크스페이스",
    icon: "workspace",
    items: [
      { id: "p1", title: "해커톤 준비", color: "#ef4444" },      // red-500
      { id: "p2", title: "신촌 카페 창업", color: "#eab308" },    // yellow-500
    ],
  },
  {
    key: "folder",
    title: "내 폴더",
    icon: "folder",
    items: [
      { id: "f1", title: "기획/디자인", icon: "folder" },
      { id: "f2", title: "프론트", icon: "folder" },
      { id: "f3", title: "백", icon: "folder" },
    ],
  },
  {
    key: "file",
    title: "내 파일",
    icon: "file",
    items: [{ id: "doc", title: "문서 모음", icon: "file" }],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ ws: true, folder: false, file: false });

  // 접힘 상태 저장(새로고침 유지 optional)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={[
        "border-r bg-white shrink-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[260px]",
        "hidden md:flex",
      ].join(" ")}
    >
      <div className="flex h-dvh w-full flex-col">
        {/* 상단 로고 + 접기버튼 */}
        <div className="flex items-center gap-2 px-4 h-14 border-b">
           <button
                onClick={() => collapsed && setCollapsed(false)}
                className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-neutral-100 transition-colors"
                title={collapsed ? "펼치기" : "IDEALab"}
                aria-label="IDEALab"
            >
                <Logo collapsed={collapsed} />
                </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto rounded-lg p-1.5 hover:bg-neutral-100"
            title={collapsed ? "펼치기" : "접기"}
          >
            {/* chevron */}
            <svg width="18" height="18" viewBox="0 0 24 24" className={collapsed ? "rotate-180" : ""}>
              <path d="M15 6L9 12l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 섹션들 */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {SECTIONS.map((s) => (
            <div key={s.key} className="mb-2">
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
                className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm
                ${open[s.key] ? "bg-blue-50 border border-blue-100" : "hover:bg-neutral-50"}`}
              >
                <Icon name={s.icon ?? "folder"} />
                {!collapsed && (
                  <>
                    <span className="font-medium">{s.title}</span>
                    <span className="ml-auto inline-flex items-center gap-2">
                      <span className="text-xs text-neutral-400">+</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" className={`text-neutral-400 transition-transform ${open[s.key] ? "rotate-90" : ""}`}>
                        <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </span>
                  </>
                )}
              </button>

              {/* 하위 아이템(접기/펼치기) */}
              {open[s.key] && s.items && (
                <div className={`mt-1 space-y-1 ${collapsed ? "hidden" : "block"}`}>
                  {s.items.map((it) => (
                    <a
                      key={it.id}
                      href="#"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
                      title={it.title}
                    >
                      {/* 색 점 또는 아이콘 */}
                      {it.color ? (
                        <span className="size-3 rounded-sm" style={{ background: it.color }} />
                      ) : (
                        <Icon name={it.icon ?? "file"} muted />
                      )}
                      <span className="truncate">{it.title.length > 15 ? `${it.title.slice(0, 15)}…` : it.title}</span>
                      {/* 우측에 연필 아이콘(수정) */}
                      <span className="ml-auto text-neutral-300 hover:text-neutral-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </span>
                    </a>
                  ))}
                  {s.key === "ws" && (
                    <button className="ml-3 text-left text-sm text-blue-600 hover:underline">
                      + 새 프로젝트 만들기
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 하단 아이콘 바 */}
        <div className="mt-auto border-t">
          <div className={`flex ${collapsed ? "justify-center" : "justify-between"} px-3 py-2`}>
            <Icon name="user" />
            {!collapsed && <div />}
            <Icon name="gear" />
            {!collapsed && <div />}
            <Icon name="exit" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-6 rounded-sm bg-gradient-to-br from-blue-500 to-blue-600 grid place-items-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M4 16h4v4H4v-4Zm6-6h4v10h-4V10Zm6-6h4v16h-4V4Z" fill="white"/>
        </svg>
      </div>
      {!collapsed && (
        <span className="font-extrabold text-lg">
          <span className="text-blue-600">IDEA</span>
          <span className="text-amber-500">Lab</span>
        </span>
      )}
    </div>
  );
}

function Icon({ name, muted = false }: { name?: string; muted?: boolean }) {
  const cls = muted ? "text-neutral-300" : "text-neutral-500";
  switch (name) {
    case "workspace":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M3 12h18M3 6h12M3 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "folder":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M3 6h6l2 2h10v10H3V6Z" fill="currentColor" />
        </svg>
      );
    case "file":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8l-6-6Z" fill="currentColor"/>
        </svg>
      );
    case "user":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10Zm7 9v-1a5 5 0 00-5-5H10a5 5 0 00-5 5v1" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case "gear":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M19.4 15a7.97 7.97 0 000-6m-14.8 6a7.97 7.97 0 010-6M12 2v3m0 14v3M2 12h3m14 0h3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      );
    case "exit":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" className={cls}>
          <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2M15 12H3m0 0l3-3m-3 3l3 3"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return null;
  }
}
