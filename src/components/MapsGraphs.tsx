"use client";

import { useEffect, useMemo, useState } from "react";
import { Map, Polygon } from "react-kakao-maps-sdk";

export default function MapsGraghs() {
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  //백에서 받아올 가상 데이터
  const dummyGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: "서교동",
          resident_population: 45000,
          district_id: "seogyo-dong",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [126.915, 37.555],
              [126.925, 37.555],
              [126.925, 37.565],
              [126.915, 37.565],
              [126.915, 37.555],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: {
          name: "합정동",
          resident_population: 25000,
          district_id: "hapjeong-dong",
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [126.905, 37.545],
              [126.915, 37.545],
              [126.915, 37.555],
              [126.905, 37.555],
              [126.905, 37.545],
            ],
          ],
        },
      },
    ],
  };

  //색 반환 함수
  const getColor = (population) => {
    const color =
      population > 50000
        ? "#006837"
        : population > 40000
        ? "#31a354"
        : population > 30000
        ? "#78c679"
        : population > 20000
        ? "#c2e699"
        : "#f7fcb9";

    return color;
  };
  useEffect(() => {
    //실제로는 여기서 fetch로 받아옴

    const timer = setTimeout(() => {
      setGeojsonData(dummyGeoJSON);

      //좌표 중심 구하기
      let totalLat = 0;
      let totalLng = 0;
      let coordCount = 0;

      dummyGeoJSON.features.forEach((feature) => {
        feature.geometry.coordinates[0].forEach((coord) => {
          totalLng += coord[0];
          totalLat += coord[1];
          coordCount++;
        });
      });

      const centerLng = totalLng / coordCount;
      const centerLat = totalLat / coordCount;

      setMapCenter({ lat: centerLat, lng: centerLng });
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
    }, []);

    return () => clearInterval(checkKakaoLoaded);
  }, []);

  //데이터가 변경될 때 폴리곤 다시 계산
  const polygons = useMemo(() => {
    if (!geojsonData || !isLoaded) return [];

    return geojsonData.features.map((feature, index) => {
      const path = feature.geometry.coordinates.map((coord) => ({
        lat: coord,
        lng: coord,
      }));

      return (
        <Polygon
          key={index}
          path={path}
          strokeWeight={2}
          strokeColor="#004c80"
          strokeOpacity={0.8}
          fillColor={getColor(feature.properties.resident_population)}
          fillOpacity={0.7}
        />
      );
    });
  }, [geojsonData, isLoaded]);

  if (!isLoaded || !geojsonData || !mapCenter) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Map
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={3}
      >
        {polygons}
      </Map>
    </div>
  );
}

// 커밋이 왜 또 안될까
