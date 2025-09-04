// src/lib/endpoints.ts
/** 1) ENV 값 정리 */
const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
const envBase =
  raw && raw !== "undefined" && raw !== "null" ? raw.replace(/\/+$/, "") : "";

/** 2) 브라우저 fallback (없으면 localhost:8000 으로 추정) */
const fallbackBase =
  typeof window !== "undefined"
    ? (() => {
        const { protocol, hostname, port } = window.location;
        const base = `${protocol}//${hostname}`;
        if (port) return `${base}:${port}`;               // ex) http://localhost:3000
        if (hostname === "localhost") return `${base}:8000`; // ex) http://localhost:8000
        return base; // 외부 IP/도메인
      })()
    : "";

export const API_URL = envBase || fallbackBase;
export const WS_BASE = API_URL ? API_URL.replace(/^http(s?):\/\//, "ws$1://") : "";

if (!API_URL) {
  console.error(
    "[ENDPOINTS] API_URL 이 비어있습니다. .env.local 에 NEXT_PUBLIC_API_URL=http://HOST[:PORT] 를 설정하세요."
  );
}

/** 공통: 쿼리 붙이기(항상 마지막에 / 유지) */
const withQuery = (base: string, params: Record<string, string | number | undefined>) => {
  const u = new URL(base.endsWith("/") ? base : base + "/");
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
  });
  return u.toString();
};

export const ENDPOINTS = {
  login: `${API_URL}/api/user/login/`,
  signup: `${API_URL}/api/user/signup/`,

  meetings: {
    list: `${API_URL}/api/meetings/`,
    create: `${API_URL}/api/meetings/`,
    detail: (id: string | number) => `${API_URL}/api/meetings/${id}/`,
    update: (id: string | number) => `${API_URL}/api/meetings/${id}/`,
    delete: (id: string | number) => `${API_URL}/api/meetings/${id}/`,
    finalize: (id: string | number) => `${API_URL}/api/meetings/${id}/finalize/`,
    stt: {
      chunk: (id: string | number) => `${API_URL}/api/meetings/${id}/stt-chunk/`,
      finalize: (id: string | number) => `${API_URL}/api/meetings/${id}/finalize/`,
      ws: (id: string | number) => `${WS_BASE}/api/meetings/${id}/stt-stream/?persist=true`,
    },
    minutes: {
      live: (id: string | number) => `${API_URL}/api/meetings/${id}/minutes/live/`,
      final: (id: string | number) => `${API_URL}/api/meetings/${id}/minutes/final/`,
    },
    keywords: {
      extract: (id: string | number) => `${API_URL}/api/meetings/${id}/keywords/extract/`,
      list: (id: string | number) => `${API_URL}/api/meetings/${id}/keywords/`,
    },
  },

  blocks: {
    list: `${API_URL}/api/blocks/`,
    create: `${API_URL}/api/blocks/`,
    detail: (id: string | number) => `${API_URL}/api/blocks/${id}/`,
    update: (id: string | number) => `${API_URL}/api/blocks/${id}/`,
    reorder: (id: string | number) => `${API_URL}/api/blocks/${id}/reorder/`,
    revisions: (id: string | number) => `${API_URL}/api/blocks/${id}/revisions/`,
    restore: (id: string | number) => `${API_URL}/api/blocks/${id}/restore/`,
    updateCell: (id: string | number) => `${API_URL}/api/blocks/${id}/update_cell/`,
    insertRow: (id: string | number) => `${API_URL}/api/blocks/${id}/insert_row/`,
    deleteRow: (id: string | number) => `${API_URL}/api/blocks/${id}/delete_row/`,
    insertCol: (id: string | number) => `${API_URL}/api/blocks/${id}/insert_col/`,
    deleteCol: (id: string | number) => `${API_URL}/api/blocks/${id}/delete_col/`,
    renameCol: (id: string | number) => `${API_URL}/api/blocks/${id}/rename_col/`,
    setColWidth: (id: string | number) => `${API_URL}/api/blocks/${id}/set_col_width/`,
  },

  docs: {
    update: (docId: string | number) => `${API_URL}/api/docs/${encodeURIComponent(docId)}/`,
  },

  analytics: {
    storeCounts: `${API_URL}/api/analytics/store-counts/`,
    changeIndex: `${API_URL}/api/analytics/change-index/`,
    closures: `${API_URL}/api/analytics/closures/`,
    industryMetrics: `${API_URL}/api/analytics/industry-metrics/`,
    salesEstimates: `${API_URL}/api/analytics/sales-estimates/`,

    // ✅ 쿼리 붙이는 편의 함수 (항상 슬래시 유지)
    industryMetricsQ: (q: { sigungu_cd: string; yyq?: string }) =>
      withQuery(`${API_URL}/api/analytics/industry-metrics/`, q),
  },

  // (선택) 지도용 – 없으면 컴포넌트가 public/SIG.json 으로 자동 폴백
  regions: {
    sig: `${API_URL}/api/regions/sig/`,                       // 없으면 무시됨
    info: (gu: string) => withQuery(`${API_URL}/api/regions/info/`, { gu }),
  },
};
