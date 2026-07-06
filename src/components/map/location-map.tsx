"use client";

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";

/** 단일 위치 지도 (마을홈 '오시는 길') — OpenStreetMap(Leaflet). */
const LeafletLocation = dynamic(
  () => import("@/components/map/leaflet-location").then((m) => m.LeafletLocation),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center bg-sky-100 text-green-700">
        지도 불러오는 중…
      </div>
    ),
  }
);

export function LocationMap({
  lat,
  lng,
  name,
}: {
  lat: number;
  lng: number;
  name: string;
}) {
  const directions = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden rounded-[var(--radius-blob)] border border-line/80 z-0">
        <LeafletLocation lat={lat} lng={lng} />
      </div>
      <a
        href={directions}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline"
      >
        {name} 길찾기 (구글지도) <ExternalLink size={14} />
      </a>
    </div>
  );
}
