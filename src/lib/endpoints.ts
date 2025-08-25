// src/lib/endpoints.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!; // 예: http://65.0.101.130:8000
const WS_BASE = API_URL ? API_URL.replace(/^http(s?):/, "ws$1:") : "";

export const ENDPOINTS = {

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
      ws: (id: string | number) => `${WS_BASE}/api/meetings/${id}/stt-stream/`,
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

  analytics: {
    storeCounts: `${API_URL}/api/analytics/store-counts/`,
    changeIndex: `${API_URL}/api/analytics/change-index/`,
    closures: `${API_URL}/api/analytics/closures/`,
    industryMetrics: `${API_URL}/api/analytics/industry-metrics/`,
    salesEstimates: `${API_URL}/api/analytics/sales-estimates/`,
  },

blocks: {
    list:   `${API_URL}/api/blocks/`,
    create: `${API_URL}/api/blocks/`,
    detail: (id: string|number) => `${API_URL}/api/blocks/${id}/`,
    update: (id: string|number) => `${API_URL}/api/blocks/${id}/`, // ⬅️ 여기로 저장
    reorder: (id: string|number) => `${API_URL}/api/blocks/${id}/reorder/`,
    revisions: (id: string|number) => `${API_URL}/api/blocks/${id}/revisions/`,
    restore: (id: string|number) => `${API_URL}/api/blocks/${id}/restore/`,
    updateCell: (id: string|number) => `${API_URL}/api/blocks/${id}/update_cell/`,
    insertRow:  (id: string|number) => `${API_URL}/api/blocks/${id}/insert_row/`,
    deleteRow:  (id: string|number) => `${API_URL}/api/blocks/${id}/delete_row/`,
    insertCol:  (id: string|number) => `${API_URL}/api/blocks/${id}/insert_col/`,
    deleteCol:  (id: string|number) => `${API_URL}/api/blocks/${id}/delete_col/`,
    renameCol:  (id: string|number) => `${API_URL}/api/blocks/${id}/rename_col/`,
    setColWidth:(id: string|number) => `${API_URL}/api/blocks/${id}/set_col_width/`,
  },

  attachments: {
    list:   `${API_URL}/api/attachments/`,
    create: `${API_URL}/api/attachments/`,
  },
};