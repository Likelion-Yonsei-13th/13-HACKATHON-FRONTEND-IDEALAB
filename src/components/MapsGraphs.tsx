"use client";

import { useEffect, useState, JSX } from "react";
import { Map, Polygon } from "react-kakao-maps-sdk";
import { ENDPOINTS } from "@/lib/endpoints";

interface MapData {
  center: { lat: number; lng: number };
  bounds: any;
  polygons: JSX.Element[];
}

export default function MapsGraphs({ selectedGu }: { selectedGu: string }) {
  const [sigData, setSigData] = useState<any>(null); // 행정구 경계 GeoJSON
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);

  // 1) GeoJSON 불러오기 (백엔드 우선, 실패하면 public/SIG.json fallback)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        let res = await fetch(ENDPOINTS.regions.sig, { signal: ac.signal, mode: "cors" });
        if (!res.ok) {
          // fallback
          res = await fetch("/SIG.json", { signal: ac.signal });
        }
        const data = await res.json();
        setSigData(data);
      } catch (e) {
        console.error("Failed to fetch region data", e);
      }
    })();
    return () => ac.abort();
  }, []);

  // 2) 카카오맵 로드 체크
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).kakao?.maps) {
        (window as any).kakao.maps.load(() => setIsLoaded(true));
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  // 3) 선택된 구에 맞춰 폴리곤 그리기
  useEffect(() => {
    if (!isLoaded || !sigData || !selectedGu) return;

    // (선택) 구별 상세 정보 호출 예시
    // (색상, 강조 옵션 등 커스터마이징에 활용 가능)
    // fetch(ENDPOINTS.regions.info(selectedGu))
    //   .then(r => r.json())
    //   .then(info => console.log("지역 info:", info))
    //   .catch(() => {});

    const matchingFeature = sigData.features.find((feature: any) => {
      if (selectedGu === "중구") {
        return feature.properties.SIG_CD === "11140"; // 서울 중구 고정
      }
      return feature.properties.SIG_KOR_NM === selectedGu;
    });

    if (!matchingFeature) {
      console.error(`${selectedGu}에 해당하는 지역 데이터를 찾을 수 없습니다.`);
      return;
    }

    // 좌표 → LatLng 경로
    const polygonPaths = matchingFeature.geometry.coordinates[0].map(
      (coord: number[]) => ({ lat: coord[1], lng: coord[0] })
    );
    if (!polygonPaths.length) return;

    // 중심/범위 계산
    const total = polygonPaths.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );
    const center = {
      lat: total.lat / polygonPaths.length,
      lng: total.lng / polygonPaths.length,
    };

    const bounds = new (window as any).kakao.maps.LatLngBounds();
    polygonPaths.forEach(p => bounds.extend(new (window as any).kakao.maps.LatLng(p.lat, p.lng)));

    const polygons = [
      <Polygon
        key={selectedGu}
        path={polygonPaths}
        strokeWeight={3}
        strokeColor="#ff0000"
        strokeOpacity={1}
        fillColor="#ff0000"
        fillOpacity={0.2}
      />,
    ];

    setMapData({ center, bounds, polygons });
  }, [isLoaded, sigData, selectedGu]);

  if (!mapData) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Map
        center={mapData.center}
        // bounds={mapData.bounds} // 원하면 bounds로 자동 맞춤
        style={{ width: "100%", height: "100%" }}
        level={7}
      >
        {mapData.polygons}
      </Map>
    </div>
  );
}
