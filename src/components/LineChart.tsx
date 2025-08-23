"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler, // 영역을 채우기 위해 Filler를 임포트
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function LineChart({ data }) {
  // 백엔드 데이터 예시:
  // const data = [
  //   { time: "00~06시", value: 0 }, { time: "06~11시", value: 8.3 }, ...
  // ];

  const chartData = {
    labels: data.map((item) => item.time), // ["00~06시", "06~11시", ...]
    datasets: [
      {
        fill: true,
        label: "시간대별 매출 비율(%)",
        data: data.map((item) => item.value),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        tension: 0.4,
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
        text: "시간대별 매출 현황",
      },
    },
  };

  return <Line options={chartOptions} data={chartData} />;
}
