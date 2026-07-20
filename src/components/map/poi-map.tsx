"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poi, PoiCategory } from "@/lib/types";

const LeafletPoi = dynamic(
  () => import("@/components/map/leaflet-poi").then((m) => m.LeafletPoi),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-green-100 rounded-2xl" /> }
);

const CATEGORIES: { key: PoiCategory; emoji: string; label: string; color: string }[] = [
  { key: "restaurant", emoji: "🍽️", label: "식당", color: "#e14b5a" },
  { key: "cafe", emoji: "☕", label: "카페", color: "#d97706" },
  { key: "experience", emoji: "🎒", label: "체험", color: "#2563eb" },
  { key: "tourist_spot", emoji: "📸", label: "관광지", color: "#059669" },
];

export function PoiMap({
  center,
  villageName,
  pois,
}: {
  center: [number, number];
  villageName: string;
  pois: Poi[];
}) {
  const [visible, setVisible] = useState<Set<PoiCategory>>(
    new Set(CATEGORIES.map((c) => c.key))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggle = useCallback((key: PoiCategory) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onSelect = useCallback((poi: Poi | null) => {
    setSelectedId(poi?.id ?? null);
  }, []);

  const categoryChips = (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((c) => {
        const active = visible.has(c.key);
        return (
          <button
            key={c.key}
            onClick={() => toggle(c.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border",
              active
                ? "bg-white text-ink-900 border-line shadow-sm"
                : "bg-white/50 text-ink-400 border-transparent"
            )}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full transition-opacity"
              style={{ background: c.color, opacity: active ? 1 : 0.3 }}
            />
            {c.emoji} {c.label}
            {active && (
              <span className="ml-0.5 text-[10px] text-ink-500">
                {pois.filter((p) => p.category === c.key).length}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-line/80 shadow-[var(--shadow-card)]">
      <div className="relative h-[55vh] min-h-[360px] sm:h-[65vh]">
        <LeafletPoi
          center={center}
          villageName={villageName}
          pois={pois}
          visibleCategories={visible}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        {/* Desktop: 좌상단 카테고리 칩 */}
        <div className="absolute left-3 top-3 z-[1000] hidden sm:block">
          <div className="rounded-xl bg-white/95 backdrop-blur-sm p-2 shadow-lg">
            {categoryChips}
          </div>
        </div>

        {/* Mobile: 햄버거 토글 */}
        <div className="absolute left-3 top-3 z-[1000] sm:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 shadow-lg backdrop-blur-sm"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {menuOpen && (
            <div className="mt-2 rounded-xl bg-white/95 backdrop-blur-sm p-2.5 shadow-lg">
              {categoryChips}
            </div>
          )}
        </div>
      </div>

      {/* 하단 POI 없을 때 안내 */}
      {pois.length === 0 && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="rounded-2xl bg-white/90 backdrop-blur-sm px-6 py-4 text-center shadow-lg pointer-events-auto">
            <p className="text-sm text-ink-600 font-semibold">아직 등록된 장소가 없어요</p>
            <p className="mt-1 text-xs text-ink-400">관리자가 식당·카페·관광지 정보를 추가하면 지도에 표시됩니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
