// src/extensions/RegionMark.ts
import { Mark, mergeAttributes, markInputRule, markPasteRule } from "@tiptap/core";

// 필요한 지역 키워드들만 넣어두고 필요할 때 추가해
const REGIONS = [
  "서울특별시",
  "서대문구", "마포구", "용산구", "은평구", "종로구", "중구", "성동구", "광진구", "동대문구",
  "중랑구", "성북구", "강북구", "도봉구", "노원구", "강서구", "양천구", "구로구", "금천구",
  "영등포구", "동작구", "관악구", "서초구", "강남구", "송파구", "강동구",
  "인천광역시", "경기도",
];

const pattern = new RegExp(`\\b(?:${REGIONS.join("|")})\\b`, "g");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    regionMark: {
      setRegion: (region: string) => ReturnType;
      unsetRegion: () => ReturnType;
    };
  }
}

const RegionMark = Mark.create({
  name: "regionMark",
  inclusive: false,
  renderHTML({ HTMLAttributes }) {
    const name = HTMLAttributes["data-region"];
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-region": name,
        style: "font-weight:700;color:#0472DE;cursor:pointer;",
        onclick: `window.__insight && window.__insight.setFromEditor(${JSON.stringify(
          name
        )})`,
      }),
      0,
    ];
  },
  addAttributes() {
    return {
      "data-region": {
        default: null,
        parseHTML: (el) => el.getAttribute("data-region"),
        renderHTML: (attrs) => ({ "data-region": attrs["data-region"] }),
      },
    };
  },
  addCommands() {
    return {
      setRegion:
        (region: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { "data-region": region }),
      unsetRegion:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
  addInputRules() {
    return [
      markInputRule({
        find: pattern,
        type: this.type,
        getAttributes: (match) => ({ "data-region": match[0] }),
      }),
    ];
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: pattern,
        type: this.type,
        getAttributes: (match) => ({ "data-region": match[0] }),
      }),
    ];
  },
});

export default RegionMark;
