"use client";

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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function BarChart({ data, highlightLabel, title }) {
  // 백엔드 데이터 예시:
  // const data = [ { label: "10대", value: 1 }, { label: "20대", value: 32.6 }, ... ];
  // const highlightLabel = "20대";
  // const title = "연령대별 외식업 매출 현황"

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "점포당 평균 (%)",
        data: data.map((item) => item.value),
        // 특정 항목만 다른 색으로 강조
        backgroundColor: data.map(
          (item) =>
            item.label === highlightLabel
              ? "rgba(54, 162, 235, 0.8)" // 강조 색상
              : "rgba(201, 203, 207, 0.8)" // 기본 색상
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return <Bar options={chartOptions} data={chartData} />;
}
