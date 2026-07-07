"use client";

import { ArrowUp, ArrowDown, GripVertical, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_META, type SectionLayout } from "@/lib/types";

/**
 * 섹션(모듈) 구성 탭 — 위/아래 순서 변경, on/off(없애기).
 * hero 는 고정(항상 최상단, 끌 수 없음).
 */
export function SectionsTab({
  layout,
  onChange,
}: {
  layout: SectionLayout[];
  onChange: (next: SectionLayout[]) => void;
}) {
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    // hero(0번)와는 자리를 바꾸지 않음
    if (target < 1 || target >= layout.length) return;
    if (layout[index].key === "hero" || layout[target].key === "hero") return;
    const next = [...layout];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function toggle(index: number) {
    if (layout[index].key === "hero") return;
    const next = layout.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s));
    onChange(next);
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-500">
        홈페이지에 보일 섹션을 켜고 끄거나 순서를 바꿔요. 데이터가 없는 섹션은
        공개 화면에서 자동으로 숨겨져요.
      </p>
      <div className="space-y-2">
        {layout.map((s, i) => {
          if (s.key === "mascot") return null; // 마스코트는 히어로 오버레이로 통합됨
          const meta = SECTION_META[s.key];
          const isHero = s.key === "hero";
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                s.enabled ? "border-line bg-white" : "border-dashed border-line bg-black/[0.02] opacity-70"
              )}
            >
              <GripVertical size={18} className="shrink-0 text-ink-500/50" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg">{meta.label}</span>
                  {isHero && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
                      <Lock size={11} /> 고정
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 truncate">{meta.desc}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={isHero || i <= 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-500 hover:text-green-700 disabled:opacity-30"
                  aria-label="위로"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={isHero || i >= layout.length - 1}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-500 hover:text-green-700 disabled:opacity-30"
                  aria-label="아래로"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  onClick={() => toggle(i)}
                  disabled={isHero}
                  className={cn(
                    "ml-1 inline-flex h-8 items-center rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-40",
                    s.enabled ? "bg-green-700 text-white" : "bg-black/10 text-ink-500"
                  )}
                >
                  {s.enabled ? "표시" : "숨김"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
