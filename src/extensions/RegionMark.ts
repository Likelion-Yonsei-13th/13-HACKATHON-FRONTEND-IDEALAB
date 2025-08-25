// src/extensions/RegionMark.ts
import { Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";

type RegionAttrs = { name: string };

type RegionOptions = {
  /** 지명 사전 (예: 전국 행정동/법정동/역명 등) */
  keywords: string[];
  /** 사전에 없더라도 잡고 싶은 패턴들 (예: OO구, OO동, OO역 등) */
  patterns?: RegExp[];
  /** 정규식 청크 크기 (대용량 사전일 때 분할 매칭) */
  chunkSize?: number;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export const RegionMark = Mark.create<RegionAttrs, RegionOptions>({
  name: "region",
  inclusive: false,

  addOptions() {
    return {
      keywords: [],           // ← 에디터에서 configure로 주입
      patterns: [],           // ← 선택: 패턴 기반 매칭 추가
      chunkSize: 400,         // 너무 큰 정규식은 분할 매칭
    };
  },

  addAttributes() {
    return {
      name: {
        default: "",
        parseHTML: el => (el as HTMLElement).dataset.name || "",
        renderHTML: attrs => ({ "data-name": (attrs.name as string) ?? "" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-region]" }, { tag: "span[data-name]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-region": "1", class: "region-token" }), 0];
  },

  addProseMirrorPlugins() {
    const key = new PluginKey("region-autohighlight");

    // 1) 사전 정렬(긴 문자열 우선 → 부분매칭 충돌 방지)
    const dict = [...this.options.keywords].sort((a, b) => b.length - a.length);
    // 2) 너무 길면 여러 정규식으로 분할
    const dictChunks = chunk(dict, this.options.chunkSize!);
    const regexes = dictChunks.map(ch => new RegExp(`(${ch.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g"));
    // 3) 패턴들(선택)
    const patternRegexes = (this.options.patterns || []).map(r => new RegExp(r, r.flags.includes("g") ? r.flags : r.flags + "g"));

    return [
      new Plugin({
        key,

        appendTransaction: (trs, _old, newState) => {
          if (!trs.some(tr => tr.docChanged)) return null;

          const { tr } = newState;
          const markType = newState.schema.marks.region;
          if (!markType) return null;

          newState.doc.descendants((node, pos) => {
            if (!node.isText) return true;
            const text = node.text ?? "";
            const len = text.length;
            if (len === 0) return true;

            // 기존 region 마크 제거 (텍스트 길이 기준)
            tr.removeMark(pos, pos + len, markType);

            // 사전 기반 매칭
            for (const re of regexes) {
              re.lastIndex = 0;
              let m: RegExpExecArray | null;
              while ((m = re.exec(text))) {
                const from = pos + m.index;
                const to = from + m[0].length;
                tr.addMark(from, to, markType.create({ name: m[0] }));
              }
            }

            // 패턴 기반 매칭(선택)
            for (const pre of patternRegexes) {
              pre.lastIndex = 0;
              let m: RegExpExecArray | null;
              while ((m = pre.exec(text))) {
                const raw = m[0];
                const from = pos + (m.index ?? 0);
                const to = from + raw.length;
                tr.addMark(from, to, markType.create({ name: raw }));
              }
            }

            return true;
          });

          return tr.docChanged ? tr : null;
        },

        props: {
          handleClick(view, _pos, event) {
            const el = event.target as HTMLElement | null;
            const span =
              el?.closest<HTMLElement>("span[data-region]") ||
              el?.closest<HTMLElement>("span[data-name]");
            if (!span) return false;

            const name =
              span.dataset.name || span.getAttribute("data-name") || span.textContent?.trim() || "";
            if (!name) return false;

            try {
              const from = view.posAtDOM(span, 0);
              const to = view.posAtDOM(span, Math.max(0, span.textContent?.length ?? 0));
              view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)));
            } catch {}

            (window as any).__setRegion?.(name);
            return true;
          },
        },
      }),
    ];
  },
});

export default RegionMark;
