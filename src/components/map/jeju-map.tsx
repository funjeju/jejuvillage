"use client";

import dynamic from "next/dynamic";
import type { VillageSummary } from "@/lib/types";

/**
 * 인터랙티브 제주 지도 (기획서 S1 핵심) — OpenStreetMap(Leaflet).
 * 키·도메인 등록이 필요 없어 어디서든 즉시 표시된다.
 * Leaflet은 window 의존이라 SSR 끄고 클라이언트에서만 로드한다.
 */
const LeafletJeju = dynamic(
  () => import("@/components/map/leaflet-jeju").then((m) => m.LeafletJeju),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-10 grid place-items-center bg-sky-100 text-green-700">
        지도를 불러오는 중…
      </div>
    ),
  }
);

export function JejuMap({
  villages,
  activeId,
  onHover,
}: {
  villages: VillageSummary[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-[var(--radius-blob)] border border-line/80 shadow-[var(--shadow-card)] z-0">
      <LeafletJeju villages={villages} activeId={activeId} onHover={onHover} />
    </div>
  );
}
