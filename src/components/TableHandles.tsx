"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";

type Edge = "top" | "bottom" | "left" | "right" | null;

export default function TableHandles({ editor }: { editor: Editor }) {
  const [edge, setEdge] = useState<Edge>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  // 현재 선택이 표 내부인지 확인
  const inTable = useMemo(() => {
    if (!editor) return false;
    const sel = editor.state.selection;
    const dom = editor.view.domAtPos(sel.from).node as Node;
    return !!closestTable(dom);
  }, [editor?.state.selection]);

  useEffect(() => {
    if (!editor) return;
    const onMove = (e: MouseEvent) => {
      if (!inTable) {
        setVisible(false);
        setEdge(null);
        return;
      }
      const tableEl = getCurrentTableEl(editor);
      if (!tableEl) {
        setVisible(false);
        setEdge(null);
        return;
      }
      const r = tableEl.getBoundingClientRect();
      setRect(r);

      const margin = 10; // 가장자리 감지 폭(px)
      const nearTop = Math.abs(e.clientY - r.top) <= margin && e.clientX >= r.left && e.clientX <= r.right;
      const nearBottom = Math.abs(e.clientY - r.bottom) <= margin && e.clientX >= r.left && e.clientX <= r.right;
      const nearLeft = Math.abs(e.clientX - r.left) <= margin && e.clientY >= r.top && e.clientY <= r.bottom;
      const nearRight = Math.abs(e.clientX - r.right) <= margin && e.clientY >= r.top && e.clientY <= r.bottom;

      if (nearTop) { setEdge("top"); setVisible(true); return; }
      if (nearBottom) { setEdge("bottom"); setVisible(true); return; }
      if (nearLeft) { setEdge("left"); setVisible(true); return; }
      if (nearRight) { setEdge("right"); setVisible(true); return; }

      setVisible(false);
      setEdge(null);
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [editor, inTable]);

  if (!visible || !rect || !edge) return null;

  const top = edge === "top" ? rect.top - 16
            : edge === "bottom" ? rect.bottom + 4
            : (rect.top + rect.height / 2 - 12);
  const left = edge === "left" ? rect.left - 16
             : edge === "right" ? rect.right + 4
             : (rect.left + rect.width / 2 - 12);

  const handleClick = () => {
    const chain = editor.chain().focus();
    switch (edge) {
      case "top": chain.addRowBefore().run(); break;
      case "bottom": chain.addRowAfter().run(); break;
      case "left": chain.addColumnBefore().run(); break;
      case "right": chain.addColumnAfter().run(); break;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 50,
      }}
      className="h-6 w-6 rounded-full bg-blue-600 text-white text-sm leading-6 text-center shadow hover:brightness-110"
      title={
        edge === "top" ? "위에 행 추가"
        : edge === "bottom" ? "아래에 행 추가"
        : edge === "left" ? "왼쪽에 열 추가"
        : "오른쪽에 열 추가"
      }
    >
      +
    </button>
  );
}

/* 현재 커서가 위치한 TABLE 엘리먼트 찾기 */
function getCurrentTableEl(editor: Editor): HTMLTableElement | null {
  const sel = editor.state.selection;
  const domNode = editor.view.domAtPos(sel.from).node as Node;
  const el = closestTable(domNode);
  return el;
}

function closestTable(n: Node | null): HTMLTableElement | null {
  while (n) {
    if ((n as HTMLElement).tagName === "TABLE") return n as HTMLTableElement;
    n = (n as HTMLElement).parentNode as Node | null;
  }
  return null;
}
