// src/components/PieChart.tsx
"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

type Item = { label: string; value: number };
export default function PieChart({ data, title = "성별 매출 현황" }: { data: Item[] | null; title?: string }) {
  if (!data || !data.length) return <div className="text-sm text-neutral-500">데이터 없음</div>;

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);

  return (
    <Pie
      data={{
        labels,
        datasets: [{ label: title, data: values, backgroundColor: ["#4bc0c0", "#36a2eb", "#ffcd56", "#ff6384"] }],
      }}
      options={{ responsive: true, plugins: { legend: { position: "right" }, title: { display: true, text: title } } }}
    />
  );
}
