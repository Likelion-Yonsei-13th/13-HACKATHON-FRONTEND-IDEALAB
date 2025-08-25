// src/components/BarChart.tsx
"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type BarItem = { label: string; value: number };

export default function BarChart({
  endpoint = "/api/stats/age-sales", // ← 백엔드 경로로 교체
  title = "연령대별 매출 현황",
  highlightLabel, // 선택: 강조 라벨을 외부에서 지정하고 싶을 때
}: {
  endpoint?: string;
  title?: string;
  highlightLabel?: string;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;
  const [data, setData] = useState<BarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_URL}${endpoint}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // 응답 예시: [{ label: "10대", value: 1 }, { label: "20대", value: 32.6 }, ...]
        const json = (await res.json()) as BarItem[];
        setData(json ?? []);
      } catch (e: any) {
        setErr(e.message || "데이터 불러오기 실패");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [API_URL, endpoint]);

  if (loading) return <p className="text-sm text-neutral-500">막대 차트 데이터를 불러오는 중…</p>;
  if (err) return <p className="text-sm text-red-600">에러: {err}</p>;
  if (!data.length) return <p className="text-sm text-neutral-500">데이터 없음</p>;

  // 외부에서 강조 라벨이 없으면 최대값 라벨을 자동 강조
  const autoHighlight =
    highlightLabel ||
    data.reduce((max, cur) => (cur.value > max.value ? cur : max), data[0]).label;

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "점포당 평균 (%)",
        data: data.map((item) => item.value),
        backgroundColor: data.map((item) =>
          item.label === autoHighlight ? "rgba(54, 162, 235, 0.8)" : "rgba(201, 203, 207, 0.8)"
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: title },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return <Bar options={chartOptions as any} data={chartData} />;
}
