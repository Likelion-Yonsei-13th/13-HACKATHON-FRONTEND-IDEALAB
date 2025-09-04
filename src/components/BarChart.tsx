// src/components/BarChart.tsx
"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Item = { label: string; value: number };
export default function BarChart({
  data, title = "연령대별 매출 현황", highlightLabel,
}: {
  data: Item[] | null;
  title?: string;
  highlightLabel?: string;
}) {
  if (!data || !data.length) return <p className="text-sm text-neutral-500">데이터 없음</p>;

  const autoHL = highlightLabel || data.reduce((m, c) => (c.value > m.value ? c : m), data[0]).label;

  return (
    <Bar
      data={{
        labels: data.map(d => d.label),
        datasets: [{
          label: title,
          data: data.map(d => d.value),
          backgroundColor: data.map(d => (d.label === autoHL ? "rgba(54,162,235,.8)" : "rgba(201,203,207,.8)")),
        }],
      }}
      options={{
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: title } },
        scales: { y: { beginAtZero: true } },
      }}
    />
  );
}
