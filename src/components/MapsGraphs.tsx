"use client";

import { features } from "process";
import { useEffect, useMemo, useState, JSX } from "react";
import { Map, Polygon } from "react-kakao-maps-sdk";

interface MapData {
  center: { lat: number; lng: number };
  bounds: any;
  polygons: JSX.Element[];
}

export default function MapsGraphs({ selectedGu }) {
  // const [geojsonData, setGeojsonData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sigData, setSigData] = useState<any>(null);

  const [mapData, setMapData] = useState<MapData | null>(null);

  //백에서 받아올 가상 데이터
  const dummyGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          SIG_KOR_NM: "서초구", // 'SIG.json' 파일의 'SIG_KOR_NM'과 일치하도록 수정
          district_id: "seocho-gu",
        },
      },
    ],
  };

  useEffect(() => {
    //sig 파일 가져오기
    const fetchSigData = async () => {
      try {
        const response = await fetch("/SIG.json");
        const data = await response.json();
        setSigData(data);
      } catch (error) {
        console.error("Failed to fetch SIG.json", error);
      }
    };
    fetchSigData();

    //실제로는 여기서 fetch로 받아옴

    const timer = setTimeout(() => {
      setGeojsonData(dummyGeoJSON);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkKakaoLoaded = setInterval(() => {
      if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
        clearInterval(checkKakaoLoaded);
      }
    }, 100);
    return () => clearInterval(checkKakaoLoaded);
  }, []);

  useEffect(() => {
    if (!isLoaded || !sigData || !selectedGu) return;

    const geojsonData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            SIG_KOR_NM: selectedGu,
            district_id: selectedGu,
          },
        },
      ],
    };

    const recieveGu = geojsonData.features[0].properties.SIG_KOR_NM;

    //geoJSON에서 해당 구 정보 찾기
    const matchingFeature = sigData.features.find(
      (sigFeature: any) => sigFeature.properties.SIG_KOR_NM === recieveGu
    );
    if (!matchingFeature) {
      console.error(`${selectedGu}에 해당하는 지역 데이터를 찾을 수 없습니다.`);
      return;
    }

    //폴리곤 그리기!!
    const polygonPaths = matchingFeature.geometry.coordinates[0].map(
      (coord: number[]) => ({
        lat: coord[1],
        lng: coord[0],
      })
    );

    if (polygonPaths.length === 0) return;

    //지도 중심 계산
    let totalLat = 0;
    let totalLng = 0;
    polygonPaths.forEach((path: { lat: number; lng: number }) => {
      totalLat += path.lat;
      totalLng += path.lng;
    });
    const newCenter = {
      lat: totalLat / polygonPaths.length,
      lng: totalLng / polygonPaths.length,
    };

    //줌 크기 조정
    const newBounds = new window.kakao.maps.LatLngBounds();
    polygonPaths.forEach((path: { lat: number; lng: number }) => {
      newBounds.extend(new window.kakao.maps.LatLng(path.lat, path.lng));
    });

    const newPolygons = [
      <Polygon
        key={recieveGu}
        path={polygonPaths}
        strokeWeight={3}
        strokeColor="#ff0000"
        strokeOpacity={1}
        fillColor="#ff0000"
        fillOpacity={0.2}
      />,
    ];

    setMapData({
      center: newCenter,
      bounds: newBounds,
      polygons: newPolygons,
    });
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
        // bounds={mapData.bounds}
        style={{ width: "100%", height: "100%" }}
        level={7}
      >
        {mapData.polygons}
      </Map>
    </div>
  );
}
