"use client";

import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { ExternalLink } from "lucide-react";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";

/** 단일 위치 지도 (마을홈 '오시는 길'). 키 없으면 좌표+외부링크 폴백. */
export function LocationMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const [loading, error] = useKakaoLoader({ appkey: KAKAO_KEY });
  const kakaoLink = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;

  if (!KAKAO_KEY || error) {
    return (
      <div className="rounded-[var(--radius-blob)] border border-line/80 bg-sky-100 p-6 text-sm">
        <p className="text-ink-700">
          위도 {lat.toFixed(5)}, 경도 {lng.toFixed(5)}
        </p>
        <a
          href={kakaoLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-semibold text-green-700 hover:underline"
        >
          카카오맵에서 열기 <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-[var(--radius-blob)] border border-line/80">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-sky-100 text-green-700">
          지도 불러오는 중…
        </div>
      )}
      <Map center={{ lat, lng }} level={4} style={{ width: "100%", height: "100%" }}>
        <MapMarker position={{ lat, lng }} title={name} />
      </Map>
    </div>
  );
}
