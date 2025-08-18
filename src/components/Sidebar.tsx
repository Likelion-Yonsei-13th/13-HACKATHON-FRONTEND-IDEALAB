// components/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProjectModal, { NewProject, CreateKind } from "./ProjectModal";
import EditItemModal from "./EditItemModal";

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

// key -> 한글 라벨 (브레드크럼 표시용)
const sectionLabel = (k: SectionKey) =>
  k === "ws" ? "멋사의 워크스페이스" : k === "folder" ? "내 폴더" : "내 파일";

export default function Sidebar() {
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    ws: true,
    folder: true,
    file: true,
  });
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);

  // 생성/수정 모달 상태
  const [creatingFor, setCreatingFor] = useState<SectionKey | null>(null);
  const [editing, setEditing] = useState<{ section: SectionKey; id: string } | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sidebar-collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar-collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  const toggle = (k: SectionKey) => setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  // ✅ 새로 만들기: 목록 추가 + 문서/메타/브레드크럼 저장 + 즉시 이동
  const handleCreate = (p: NewProject) => {
    if (!creatingFor) return;

    let createdId = "";

    setSections(prev =>
      prev.map(s => {
        if (s.key !== creatingFor) return s;
        const newItem: Item = {
          id: crypto.randomUUID(),
          title: p.title,
          color: p.color,
          icon: creatingFor === "file" ? "file" : undefined,
        };
        createdId = newItem.id;
        return { ...s, items: [...(s.items ?? []), newItem] };
      })
    );

    // 저장
    const label = sectionLabel(creatingFor);
    localStorage.setItem(`doc:${createdId}`, ""); // 초기 내용
    localStorage.setItem(`meta:${createdId}`, JSON.stringify({ section: label, title: p.title }));
    localStorage.setItem("ws:breadcrumb", JSON.stringify({ section: label, title: p.title }));

    // 이동
    setCreatingFor(null);
    router.push(`/ws/${createdId}`);
  };

  // 수정 저장: 목록 + meta:{id} 동시 반영, 열려 있으면 브레드크럼도 갱신
  const handleSaveEdit = (val: { title: string; color?: string }) => {
    if (!editing) return;

    setSections(prev =>
      prev.map(s => {
        if (s.key !== editing.section) return s;
        return {
          ...s,
          items: (s.items ?? []).map(it =>
            it.id === editing.id ? { ...it, title: val.title, color: val.color ?? it.color } : it
          ),
        };
      })
    );

    try {
      const raw = localStorage.getItem(`meta:${editing.id}`);
      const prevMeta = raw ? JSON.parse(raw) : {};
      localStorage.setItem(`meta:${editing.id}`, JSON.stringify({ ...prevMeta, title: val.title }));

      if (location.pathname.includes(`/ws/${editing.id}`)) {
        localStorage.setItem(
          "ws:breadcrumb",
          JSON.stringify({ section: sectionLabel(editing.section), title: val.title })
        );
      }
    } catch {}

    setEditing(null);
  };

  const modalKind: CreateKind =
    creatingFor === "ws" ? "project" : creatingFor === "folder" ? "folder" : "file";

  const handleLogoClick = () => { if (collapsed) setCollapsed(false); };

  const showTitle = (t: string) => (t.length > 10 ? t.slice(0, 10) + "…" : t);

  // 공용 아이템 렌더러: 클릭 시 브레드크럼 저장 → 라우팅
  const renderItems = (key: SectionKey) =>
    sections.find(s => s.key === key)?.items?.map(it => (
      <div
        key={it.id}
        role="button"
        tabIndex={0}
        onClick={() => {
          const label = sectionLabel(key);
          localStorage.setItem("ws:breadcrumb", JSON.stringify({ section: label, title: it.title }));
          localStorage.setItem(`meta:${it.id}`, JSON.stringify({ section: label, title: it.title }));
          router.push(`/ws/${it.id}`);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const label = sectionLabel(key);
            localStorage.setItem("ws:breadcrumb", JSON.stringify({ section: label, title: it.title }));
            localStorage.setItem(`meta:${it.id}`, JSON.stringify({ section: label, title: it.title }));
            router.push(`/ws/${it.id}`);
          }
        }}
        className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer"
        title={it.title}
      >
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: it.color ?? "#d1d5db" }} />
        <span className="truncate">{showTitle(it.title)}</span>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditing({ section: key, id: it.id }); }}
          className="ml-auto inline-flex items-center justify-center"
          aria-label="수정"
          title="수정"
        >
          <img src="/icons/수정하기.png" alt="edit" className="h-4 w-4 opacity-60 hover:opacity-100" />
        </button>
      </div>
    ));

  return (
    <aside
      className={[
        "border-r bg-white shrink-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[260px]",
        "hidden md:flex",
      ].join(" ")}
    >
      <div className="flex h-dvh w-full flex-col">
        {/* 상단 바 */}
        <div className="h-14 border-b">
          <div className="h-full flex items-center gap-2 px-3">
            <img src="/logos/메인로고.png" alt="app" className="h-8 w-auto" />
            <button
              type="button"
              onClick={handleLogoClick}
              className={["relative flex items-center", collapsed ? "opacity-60 hover:opacity-100" : ""].join(" ")}
              title={collapsed ? "펼치기" : "IDEALab"}
              aria-label="logo-expand"
            >
              {!collapsed && <img src="/logos/IDEAL.png" alt="IDEA" className="h-7" />}
              {!collapsed && <img src="/logos/Lab.png" alt="Lab" className="h-7 -ml-4 relative z-10" />}
            </button>
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
        </div>

        {/* 워크스페이스 */}
        <div className="px-2 pt-2">
          <button
            onClick={() => toggle("ws")}
            className={["flex w-full items-center rounded-md px-2 py-2","bg-[#e7f0ff] text-slate-900 border border-[#cfe0ff]"].join(" ")}
          >
            <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-[#3b82f6]" />
            {!collapsed && <span className="font-medium text-sm">멋사의 워크스페이스</span>}
            {!collapsed && (
              <span className="ml-auto flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2"
                     strokeLinecap="round" strokeLinejoin="round"
                     className={`h-3.5 w-3.5 ${open.ws ? "" : "rotate-180"}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            )}
          </button>

          {open.ws && !collapsed && (
            <div className="mt-1 ml-3 pl-3 border-l border-neutral-200/70 space-y-1">
              {renderItems("ws")}
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
              {renderItems("folder")}
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
              {renderItems("file")}
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

      {/* 생성 모달 */}
      <ProjectModal open={!!creatingFor} kind={modalKind} onClose={() => setCreatingFor(null)} onCreate={handleCreate} />

      {/* 수정 모달 */}
      <EditItemModal
        open={!!editing}
        initialTitle={
          editing ? (sections.find(s => s.key === editing.section)?.items?.find(i => i.id === editing.id)?.title ?? "") : ""
        }
        initialColor={
          editing ? (sections.find(s => s.key === editing.section)?.items?.find(i => i.id === editing.id)?.color) : undefined
        }
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </aside>
  );
}

/** 섹션 헤더 */
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
    <div className={`group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm ${
      open ? "bg-blue-50 border border-blue-100" : "hover:bg-neutral-50"
    }`}>
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
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-3.5 w-3.5 ${open ? "" : "rotate-180"}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
