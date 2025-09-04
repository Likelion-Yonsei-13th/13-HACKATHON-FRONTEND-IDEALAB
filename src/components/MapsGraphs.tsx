// src/components/MapsGraphs.tsx
"use client";

import { useEffect, useMemo, useRef, useState, JSX } from "react";
import { Map, Polygon } from "react-kakao-maps-sdk";
import { ENDPOINTS } from "@/lib/endpoints";

type GuArg = string | { name?: string; sig?: string; sigungu_cd?: string };

interface MapData {
  center: { lat: number; lng: number };
  bounds: any;
  polygons: JSX.Element[]; // 외곽들
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청 근처

/* ─ util: 구 이름→코드, 인자 정규화 ─ */
function guNameToCode(gu: string) {
  const m: Record<string, string> = {
    종로구:"11110", 중구:"11140", 용산구:"11170", 성동구:"11200", 광진구:"11215",
    동대문구:"11230", 중랑구:"11260", 성북구:"11290", 강북구:"11305", 도봉구:"11320",
    노원구:"11350", 은평구:"11380", 서대문구:"11410", 마포구:"11440", 양천구:"11470",
    강서구:"11500", 구로구:"11530", 금천구:"11545", 영등포구:"11560", 동작구:"11590",
    관악구:"11620", 서초구:"11650", 강남구:"11680", 송파구:"11710", 강동구:"11740",
  };
  return m[gu] || gu || "";
}
function normalizeGu(arg: GuArg) {
  if (typeof arg === "string") return { name: arg, code: guNameToCode(arg) };
  const name = arg?.name || "";
  const code = arg?.sig || arg?.sigungu_cd || (name ? guNameToCode(name) : "");
  return { name: name || code, code: code || "" };
}
function extractRings(geometry: any): number[][][] {
  if (!geometry) return [];
  const { type, coordinates } = geometry;
  if (type === "Polygon") return coordinates?.[0] ? [coordinates[0]] : [];
  if (type === "MultiPolygon")
    return (coordinates as any[])
      ?.map(poly => (Array.isArray(poly) && poly[0] ? poly[0] : null))
      .filter(Boolean) as number[][][];
  return [];
}
const isAbort = (e: any) =>
  e?.name === "AbortError" || String(e?.message||"").toLowerCase().includes("abort");

export default function MapsGraphs({
  selectedGu,
  height = 380,            // ← 기본 높이(숫자(px)나 '40vh' 등 문자열도 가능)
  className = "",
}: {
  selectedGu: GuArg;
  height?: number | string;
  className?: string;
}) {
  const { name: guName, code: guCode } = useMemo(() => normalizeGu(selectedGu), [selectedGu]);

  const [sigData, setSigData] = useState<any>(null);
  const [polys, setPolys] = useState<JSX.Element[] | null>(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  const kakaoReadyRef = useRef(false);

  /* 1) SIG.json 로드(있으면 원격, 없으면 /SIG.json) */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        let data: any | null = null;

        const remoteSig = (ENDPOINTS as any)?.regions?.sig;
        if (remoteSig) {
          try {
            const r = await fetch(remoteSig, { signal: ac.signal, cache: "no-store" });
            if (r.ok) data = await r.json();
          } catch (e) {
            if (!isAbort(e)) console.warn("[MapsGraphs] backend SIG fetch failed; fallback /SIG.json");
          }
        }
        if (!data) {
          const r2 = await fetch("/SIG.json", { signal: ac.signal, cache: "no-store" });
          if (r2.ok) data = await r2.json();
        }
        if (!ac.signal.aborted && data) setSigData(data);
      } catch (e) {
        if (!isAbort(e)) console.warn("[MapsGraphs] SIG.json load failed");
      }
    })();
    return () => ac.abort();
  }, []);

  /* 2) 카카오 SDK 준비 */
  useEffect(() => {
    if (kakaoReadyRef.current) return;
    const id = setInterval(() => {
      const kakao = (window as any)?.kakao;
      if (kakao?.maps) {
        kakao.maps.load(() => {
          kakaoReadyRef.current = true;
          // SDK 준비 완료 — center 는 기본값 유지
        });
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  /* 3) 시군구 폴리곤 만들기 — 실패해도 지도 자체는 항상 보이도록 */
  useEffect(() => {
    if (!sigData || (!guName && !guCode)) {
      setPolys(null);
      setCenter(DEFAULT_CENTER);
      return;
    }

    const feature = (sigData.features || []).find((f: any) => {
      const cd = f?.properties?.SIG_CD;
      const nm = f?.properties?.SIG_KOR_NM;
      return (guCode && cd === guCode) || (!!guName && nm === guName);
    });

    if (!feature) {
      console.warn(`[MapsGraphs] "${guName || guCode}" 매칭 실패 → 기본 지도만 표시`);
      setPolys(null);
      setCenter(DEFAULT_CENTER);
      return;
    }

    const rings = extractRings(feature.geometry);
    if (!rings.length) {
      setPolys(null);
      setCenter(DEFAULT_CENTER);
      return;
    }

    // path들 생성
    const paths = rings.map(ring => ring.map(([lng, lat]) => ({ lat, lng })));

    // 중심 계산
    let sLat = 0, sLng = 0, c = 0;
    paths.forEach(r => r.forEach(p => { sLat += p.lat; sLng += p.lng; c++; }));
    setCenter({ lat: sLat / c, lng: sLng / c });

    // 폴리곤 JSX
    setPolys(paths.map((path, i) => (
      <Polygon
        key={`${guCode || guName}-${i}`}
        path={path}
        strokeWeight={3}
        strokeColor="#0472DE"
        strokeOpacity={1}
        fillColor="#0472DE"
        fillOpacity={0.2}
      />
    )));
  }, [sigData, guName, guCode]);

  const hStyle = typeof height === "number" ? { height: `${height}px` } : { height };

  return (
    <div className={`w-full ${className}`} style={hStyle}>
      <Map
        center={center}
        level={7}
        style={{ width: "100%", height: "100%" }} // ← 부모 높이를 그대로 사용
      >
        {polys /* 폴리곤이 있으면 얹고, 없어도 기본 지도는 항상 보임 */}
      </Map>
    </div>
  );
}
