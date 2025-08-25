// src/lib/endpoints.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const WS_BASE = API_URL ? API_URL.replace(/^http(s?):/, "ws$1:") : "";

export const ENDPOINTS = {
  docs: {
    update: (docId: string) => `${API_URL}/api/docs/${encodeURIComponent(docId)}/`,
  },
  meetings: {
    detail: (id: string | number) => `${API_URL}/api/meetings/${id}/`,
    // 서버 스펙: 텍스트 청크 + 타임스탬프
    stt: {
      chunk: (id: string | number) => `${API_URL}/api/meetings/${id}/stt-chunk/`,
      finalize: (id: string | number) => `${API_URL}/api/meetings/${id}/finalize/`,
      // 현재 서버에 ws 스트림 엔드포인트가 없다면 사용하지 않음
      ws: (id: string | number) => `${WS_BASE}/api/meetings/${id}/stt-stream/`,
    },
  },
  analytics: {
    // 서버 명세에 맞춰 사용 (필수 쿼리 붙이기)
    // 예) /api/analytics/industry-metrics/?gu=서대문구&industry=음식점업
    industryMetrics: `${API_URL}/api/analytics/industry-metrics/`,
    salesEstimates: `${API_URL}/api/analytics/sales-estimates/`,
  },
  geo: {
    sig: `${API_URL}/geo/sig/`,
    regionInfo: (gu: string) => `${API_URL}/regions/info/?gu=${encodeURIComponent(gu)}`,
  },
};
