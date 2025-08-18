"use client";

import { useEffect, useState } from "react";
import ProjectModal, { NewProject, CreateKind } from "./ProjectModal";

type Item = { id: string; title: string; color?: string; icon?: "folder" | "file" };
type SectionKey = "ws" | "folder" | "file";
type Section = { key: SectionKey; title: string; items?: Item[] };

const INITIAL_SECTIONS: Section[] = [
  {
    key: "ws",
    title: "멋사의 워크스페이스",
    items: [
      { id: "p1", title: "해커톤 준비", color: "#ef4444" },
      { id: "p2", title: "신촌 카페 창업", color: "#eab308" },
    ],
  },
  {
    key: "folder",
    title: "내 폴더",
    items: [
      { id: "f1", title: "기획/디자인", color: "#ef4444" },
      { id: "f2", title: "프론트", color: "#eab308" },
      { id: "f3", title: "백", color: "#60a5fa" },
    ],
  },
  {
    key: "file",
    title: "내 파일",
    items: [{ id: "doc", title: "문서 모음", icon: "file", color: "#60a5fa" }],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    ws: true,
    folder: true,
    file: true,
  });
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);

  // 어디서 모달을 여는지
  const [creatingFor, setCreatingFor] = useState<SectionKey | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  const toggle = (k: SectionKey) =>
    setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  const handleCreate = (p: NewProject) => {
    if (!creatingFor) return;
    setSections(prev =>
      prev.map(s => {
        if (s.key !== creatingFor) return s;
        const newItem: Item = {
          id: crypto.randomUUID(),
          title: p.title,
          color: p.color,
          icon: creatingFor === "file" ? "file" : undefined,
        };
        return { ...s, items: [...(s.items ?? []), newItem] };
      })
    );
    setCreatingFor(null);
  };

  const modalKind: CreateKind =
    creatingFor === "ws" ? "project" : creatingFor === "folder" ? "folder" : "file";

  return (
    <aside
      className={[
        "border-r bg-white shrink-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[260px]",
        "hidden md:flex",
      ].join(" ")}
    >
      <div className="flex h-dvh w-full flex-col">
        {/* 상단 로고/접기 */}
        <div className="flex items-center gap-2 px-3 h-14 border-b">
          <img src="/logos/메인로고.png" alt="logo" className="h-8 w-auto" />
          {!collapsed && (
            <>
              <img src="/logos/IDEAL.png" alt="IDEA" className="h-7" />
              <img src="/logos/Lab.png" alt="Lab" className="h-7 -ml-6 relative z-10" />
            </>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-auto rounded-md p-1.5 hover:bg-neutral-100"
            title={collapsed ? "펼치기" : "접기"}
            aria-label="collapse"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round"
                 className={["h-3.5 w-3.5", collapsed ? "" : "rotate-180"].join(" ")}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* 워크스페이스 */}
        <div className="px-2 pt-2">
          <button
            onClick={() => toggle("ws")}
            className={[
              "flex w-full items-center rounded-md px-2 py-2",
              "bg-[#e7f0ff] text-slate-900 border border-[#cfe0ff]",
            ].join(" ")}
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-[#3b82f6]" />
            {!collapsed && <span className="font-medium text-sm">멋사의 워크스페이스</span>}
            {!collapsed && (
              <span className="ml-auto flex items-center gap-2">
                {open.ws ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round"
                       className="h-3.5 w-3.5"><path d="m6 9 6 6 6-6" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round"
                       className="h-3.5 w-3.5"><path d="m9 18 6-6-6-6" /></svg>
                )}
              </span>
            )}
          </button>

          {open.ws && !collapsed && (
            <div className="mt-1 ml-3 pl-3 border-l border-neutral-200/70 space-y-1">
              {sections.find(s => s.key === "ws")?.items?.map(it => (
                <div key={it.id}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-neutral-200 bg-white hover:bg-neutral-50">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: it.color ?? "#d1d5db" }} />
                  <span className="truncate">{it.title}</span>
                  <img src="/icons/수정하기.png" alt="edit" className="ml-auto h-4 w-4 opacity-60 hover:opacity-100" />
                </div>
              ))}
              <button
                className="ml-1 mt-1 text-left text-sm text-blue-600 hover:underline"
                onClick={() => setCreatingFor("ws")}
              >
                + 새 프로젝트 만들기
              </button>
            </div>
          )}
        </div>

        {/* 내 폴더 / 내 파일 */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2">
          <SectionHeader
            title="내 폴더"
            open={open.folder}
            onToggle={() => toggle("folder")}
            collapsed={collapsed}
            leftIconUrl="/icons/folder.png"
            onAdd={() => setCreatingFor("folder")}
          />
          {open.folder && !collapsed && (
            <div className="mt-1 ml-3 pl-3 border-l border-neutral-200/70 space-y-1">
              {sections.find(s => s.key === "folder")?.items?.map(it => (
                <div key={it.id}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-neutral-200 bg-white hover:bg-neutral-50">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: it.color ?? "#d1d5db" }} />
                  <span className="truncate">{it.title}</span>
                  <img src="/icons/수정하기.png" alt="edit" className="ml-auto h-4 w-4 opacity-60 hover:opacity-100" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-2" />
          <SectionHeader
            title="내 파일"
            open={open.file}
            onToggle={() => toggle("file")}
            collapsed={collapsed}
            leftIconUrl="/icons/file.png"
            onAdd={() => setCreatingFor("file")}
          />
          {open.file && !collapsed && (
            <div className="mt-1 ml-3 pl-3 border-l border-neutral-200/70 space-y-1">
              {sections.find(s => s.key === "file")?.items?.map(it => (
                <div key={it.id}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-neutral-200 bg-white hover:bg-neutral-50">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: it.color ?? "#9ca3af" }} />
                  <span className="truncate">{it.title}</span>
                  <img src="/icons/수정하기.png" alt="edit" className="ml-auto h-4 w-4 opacity-60 hover:opacity-100" />
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* 하단 바 */}
        <div className="mt-auto border-t">
          <div className={`flex ${collapsed ? "justify-center" : "justify-between"} px-3 py-2`}>
            <img src="/icons/사람.png" alt="me" className="h-5 w-5 opacity-80" />
            {!collapsed && <div />}
            <img src="/icons/설정.png" alt="settings" className="h-5 w-5 opacity-80" />
            {!collapsed && <div />}
            <img src="/icons/나가기.png" alt="logout" className="h-5 w-5 opacity-80" />
          </div>
        </div>
      </div>

      {/* 공용 생성 모달 */}
      <ProjectModal
        open={!!creatingFor}
        kind={modalKind}                 // ★ 섹션에 따라 제목/라벨 변경
        onClose={() => setCreatingFor(null)}
        onCreate={handleCreate}
      />
    </aside>
  );
}

/** 섹션 헤더(아이콘 + 제목 + 우측 컨트롤) */
function SectionHeader({
  title,
  open,
  onToggle,
  collapsed,
  leftIconUrl,
  onAdd,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
  leftIconUrl?: string;
  onAdd?: () => void;
}) {
  return (
    <div
      className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm ${
        open ? "bg-blue-50 border border-blue-100" : "hover:bg-neutral-50"
      }`}
    >
      <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
        {leftIconUrl ? (
          <img src={leftIconUrl} alt="" className="h-[18px] w-[18px]" />
        ) : (
          <span className="inline-block h-[18px] w-[18px]" />
        )}
        {!collapsed && <span className="font-medium">{title}</span>}
      </button>

      {!collapsed && (
        <div className="ml-auto inline-flex items-center gap-2">
          {onAdd && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-neutral-200"
              aria-label={`${title}에 추가`}
              title={`${title}에 추가`}
            >
              <span className="text-sm leading-none">+</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-5 w-5 items-center justify-center"
            aria-label="toggle"
            title="toggle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round"
                 className={`h-3.5 w-3.5 ${open ? "" : "rotate-180"}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
