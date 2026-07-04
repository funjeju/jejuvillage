"use client";

import { useRouter } from "next/navigation";
import {
  Map,
  CustomOverlayMap,
  useKakaoLoader,
} from "react-kakao-maps-sdk";
import { cn } from "@/lib/utils";
import type { VillageSummary } from "@/lib/types";

const JEJU_CENTER = { lat: 33.38, lng: 126.55 };
const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

/**
 * 인터랙티브 제주 지도 (기획서 S1 핵심).
 * - 마을 위치마다 말풍선 라벨 핀
 * - 최근 소식(isLive) 마을은 '살아있는 핀' 링 애니메이션 (FR-MAP-02)
 * - 핀 hover 시 activeId 연동(피드↔지도 하이라이트), click 시 마을 홈 이동
 * API 키 미설정 시 정적 목록 폴백.
 */
export function JejuMap({
  villages,
  activeId,
  onHover,
}: {
  villages: VillageSummary[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const router = useRouter();
  const [loading, error] = useKakaoLoader({
    appkey: KAKAO_KEY,
    libraries: ["services"],
  });

  if (!KAKAO_KEY || error) {
    return <MapFallback villages={villages} activeId={activeId} onHover={onHover} />;
  }

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-[var(--radius-blob)] border border-line/80 shadow-[var(--shadow-card)]">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-sky-100 text-green-700">
          지도를 불러오는 중…
        </div>
      )}
      <Map
        center={JEJU_CENTER}
        level={10}
        style={{ width: "100%", height: "100%" }}
        aria-label="제주 마을 지도"
      >
        {villages.map((v) => {
          const isActive = activeId === v.id;
          return (
            <CustomOverlayMap
              key={v.id}
              position={{ lat: v.lat, lng: v.lng }}
              yAnchor={1.2}
              zIndex={isActive ? 30 : v.isLive ? 20 : 10}
            >
              <button
                type="button"
                onMouseEnter={() => onHover?.(v.id)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => router.push(`/v/${v.slug}`)}
                className="group relative flex flex-col items-center"
                aria-label={`${v.name} 마을 홈으로 이동`}
              >
                <span
                  className={cn(
                    "relative whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold shadow-md transition-all",
                    isActive
                      ? "bg-[var(--accent)] text-white scale-110"
                      : "bg-white text-ink-900 group-hover:bg-green-100"
                  )}
                >
                  {v.isLive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="live-ring absolute inline-flex h-3 w-3 text-[var(--accent)]" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--accent)] border-2 border-white" />
                    </span>
                  )}
                  {v.name}
                </span>
                <span
                  className={cn(
                    "h-3 w-3 rotate-45 -mt-1.5 shadow-md",
                    isActive ? "bg-[var(--accent)]" : "bg-white group-hover:bg-green-100"
                  )}
                />
              </button>
            </CustomOverlayMap>
          );
        })}
      </Map>
    </div>
  );
}

function MapFallback({
  villages,
  activeId,
  onHover,
}: {
  villages: VillageSummary[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-[var(--radius-blob)] border border-line/80 bg-gradient-to-b from-sky-100 to-green-100 p-6">
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-20">
        <p className="font-display text-6xl text-green-800">제주</p>
      </div>
      <p className="relative text-sm text-ink-500 mb-3">
        지도 API 키(<code className="text-green-700">NEXT_PUBLIC_KAKAO_MAP_APP_KEY</code>)를
        설정하면 실제 제주 지도가 표시됩니다. 현재는 마을 목록으로 표시합니다.
      </p>
      <div className="relative flex flex-wrap gap-2">
        {villages.length === 0 && (
          <span className="text-ink-500 text-sm">아직 공개된 마을이 없어요.</span>
        )}
        {villages.map((v) => (
          <a
            key={v.id}
            href={`/v/${v.slug}`}
            onMouseEnter={() => onHover?.(v.id)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-bold shadow transition-all",
              activeId === v.id
                ? "bg-[var(--accent)] text-white scale-105"
                : "bg-white text-ink-900 hover:bg-green-100"
            )}
          >
            {v.isLive && "🟢 "}
            {v.name}
          </a>
        ))}
      </div>
    </div>
  );
}
