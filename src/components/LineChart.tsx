// src/components/LineChart.tsx
"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { ENDPOINTS } from "@/lib/endpoints";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

type TimeSales = { time: string; value: number };

type Props = {
  /** 기본 사용: gu/category로 ENDPOINTS.analytics.timeSales(gu, category) 호출 */
  gu?: string;
  category?: string;
  /** 커스텀 API URL을 직접 쓰고 싶을 때(절대 URL 권장). 설정 시 gu/category는 무시됨 */
  endpoint?: string;
  title?: string;
};

export default function LineChart({
  gu = "서대문구",
  category = "음식점업",
  endpoint, // 있으면 이 URL을 그대로 사용(절대 URL 권장)
  title = "시간대별 매출 현황",
}: Props) {
  const [data, setData] = useState<TimeSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) endpoint prop이 있으면 그대로 사용
        // 2) 없으면 ENDPOINTS.analytics.timeSales(gu, category)
        const url = endpoint || ENDPOINTS.analytics.timeSales(gu, category);

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // 응답 예시: [{ time: "00~06시", value: 0 }, ...]
        const json = (await res.json()) as TimeSales[];
        setData(json ?? []);
      } catch (e: any) {
        setErr(e?.message || "데이터 불러오기 실패");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [endpoint, gu, category]);

  if (loading) return <p className="text-sm text-neutral-500">시간대 매출 데이터를 불러오는 중…</p>;
  if (err) return <p className="text-sm text-red-600">에러: {err}</p>;
  if (!data.length) return <p className="text-sm text-neutral-500">데이터 없음</p>;

  const chartData = {
    labels: data.map((item) => item.time),
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
      legend: { display: false },
      title: { display: true, text: title },
    },
  };

  return <Line options={chartOptions} data={chartData} />;
}
