import { cn } from "@/lib/utils";

/**
 * 자연 장식 요소 (기획서 7.4) — 구름/잔디/울타리.
 * 섹션 경계 마감용. 콘텐츠 가독성을 위해 과하지 않게, 모바일에선 축소/생략 가능.
 */

/** 상단 하늘 구름 띠 */
export function CloudBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg viewBox="0 0 1200 80" className="w-full h-auto cloud-drift" preserveAspectRatio="none">
        <g fill="#ffffff" opacity="0.9">
          <ellipse cx="150" cy="60" rx="90" ry="34" />
          <ellipse cx="230" cy="66" rx="70" ry="26" />
          <ellipse cx="520" cy="58" rx="110" ry="38" />
          <ellipse cx="620" cy="66" rx="80" ry="28" />
          <ellipse cx="920" cy="60" rx="100" ry="34" />
          <ellipse cx="1010" cy="66" rx="70" ry="26" />
        </g>
      </svg>
    </div>
  );
}

/** 하단 잔디·들꽃 띠 */
export function GrassBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg viewBox="0 0 1200 70" className="w-full h-auto" preserveAspectRatio="none">
        <path
          d="M0 70 L0 34 Q40 10 80 30 Q120 6 160 28 Q210 4 250 30 Q300 8 350 28 Q400 6 450 30 Q510 8 560 28 Q610 6 660 30 Q720 8 770 28 Q820 6 870 30 Q930 8 980 28 Q1040 6 1090 30 Q1140 10 1200 32 L1200 70 Z"
          fill="var(--green-400)"
        />
        <g>
          <circle cx="120" cy="30" r="4" fill="var(--accent)" />
          <circle cx="430" cy="26" r="4" fill="#ffd54f" />
          <circle cx="760" cy="30" r="4" fill="var(--accent)" />
          <circle cx="1010" cy="28" r="4" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

/** 나무 울타리 구분선 (섹션 divider) */
export function FenceDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("w-full overflow-hidden leading-[0] my-2", className)}>
      <svg viewBox="0 0 1200 48" className="w-full h-auto" preserveAspectRatio="none">
        {/* 가로대 */}
        <rect x="0" y="18" width="1200" height="8" rx="4" fill="var(--brown-500)" />
        <rect x="0" y="32" width="1200" height="8" rx="4" fill="var(--brown-600)" />
        {/* 말뚝 */}
        {Array.from({ length: 17 }).map((_, i) => {
          const x = i * 75 + 10;
          return (
            <g key={i} fill="var(--brown-500)">
              <rect x={x} y="6" width="12" height="40" rx="4" />
              <path d={`M${x} 8 L${x + 6} 0 L${x + 12} 8 Z`} fill="var(--brown-600)" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
