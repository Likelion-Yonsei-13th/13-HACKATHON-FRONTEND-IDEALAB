// src/components/PieChart.tsx
"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ENDPOINTS } from "@/lib/endpoints";

ChartJS.register(ArcElement, Tooltip, Legend);

type GenderSales = { female: number; male: number };

type Props = {
  /** 기본 사용: gu/category로 ENDPOINTS.analytics.genderSales 호출 */
  gu?: string;
  category?: string;
  /** 커스텀 endpoint URL을 직접 지정하고 싶을 때 (이 값이 있으면 gu/category 무시) */
  endpoint?: string;
  title?: string;
};

export default function PieChart({
  gu = "서대문구",
  category = "음식점업",
  endpoint,
  title = "성별 매출 현황",
}: Props) {
  const [data, setData] = useState<GenderSales | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) endpoint prop 이 있으면 그대로 사용
        // 2) 없으면 ENDPOINTS.analytics.genderSales(gu, category)
        const url = endpoint || ENDPOINTS.analytics.genderSales(gu, category);

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // 응답 예시: { female: 61.7, male: 38.3 }
        const json = (await res.json()) as Partial<GenderSales>;

        const female = Number(json.female ?? 0);
        const male = Number(json.male ?? 0);

        setData({ female, male });
      } catch (e: any) {
        setErr(e?.message || "데이터 로드 실패");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [endpoint, gu, category]);

  if (loading) return <div className="text-sm text-neutral-500">성별 매출 불러오는 중…</div>;
  if (err) return <div className="text-sm text-red-600">에러: {err}</div>;
  if (!data) return null;

  const chartData = {
    labels: ["여성", "남성"],
    datasets: [
      {
        label: "성별 매출 (%)",
        data: [data.female, data.male],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(54, 162, 235, 0.6)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(54, 162, 235, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      title: { display: true, text: title },
      tooltip: { enabled: true },
    },
  };

  return <Pie data={chartData} options={chartOptions} />;
}
