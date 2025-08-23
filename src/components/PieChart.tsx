"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Chart.js에 필요한 요소들을 등록
ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data }) {
  // 백엔드 데이터 예시: const data = { female: 61.7, male: 38.3 };

  const chartData = {
    labels: ["여성", "남성"],
    datasets: [
      {
        label: "성별 매출 (%)",
        data: [data.female, data.male],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // 여성 색상
          "rgba(54, 162, 235, 0.6)", // 남성 색상
        ],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(54, 162, 235, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right", // 범례 위치
      },
      title: {
        display: true,
        text: "성별 매출 현황",
      },
    },
  };

  return <Pie data={chartData} options={chartOptions} />;
}
