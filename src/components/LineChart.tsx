// src/components/LineChart.tsx
"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

type Item = { label: string; value: number };
export default function LineChart({ data, title = "시간대별 매출 현황" }: { data: Item[] | null; title?: string }) {
  if (!data || !data.length) return <p className="text-sm text-neutral-500">데이터 없음</p>;

  return (
    <Line
      data={{
        labels: data.map(d => d.label),
        datasets: [{ fill: true, label: title, data: data.map(d => d.value), borderColor: "rgb(53,162,235)", backgroundColor: "rgba(53,162,235,.4)", tension: .4 }],
      }}
      options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: title } } }}
    />
  );
}
