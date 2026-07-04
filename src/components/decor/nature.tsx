import { cn } from "@/lib/utils";

/**
 * 제주 자연 장식 요소 (기획서 7.4, 제주 로컬 감성 반영).
 *  - CloudBand: 하늘 구름
 *  - JejuHills: 오름 능선 + 한라산 실루엣 (히어로 하단 풍경)
 *  - GrassBand: 오름 능선 띠 (일반 섹션 하단)
 *  - StoneWall: 현무암 돌담(밭담) 구분선  ← 나무 울타리 대체
 *  - Dolharubang: 돌하르방 캐릭터 장식
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

/** 오름 능선 + 한라산 실루엣 (히어로 하단 풍경) */
export function JejuHills({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg
        viewBox="0 0 1200 240"
        preserveAspectRatio="none"
        className="w-full h-36 sm:h-52"
      >
        {/* 한라산 (원경, 푸른 안개 톤) */}
        <path
          d="M0,240 L0,168 Q300,152 520,96 Q545,82 570,88 Q588,74 612,74 Q636,74 654,88 Q680,82 700,98 Q920,152 1200,168 L1200,240 Z"
          fill="#a9c9c1"
          opacity="0.85"
        />
        {/* 백록담 눈 자국 */}
        <path d="M560,92 Q600,78 648,92 Q604,86 560,92 Z" fill="#ffffff" opacity="0.5" />

        {/* 중산간 오름 능선 (중경) */}
        <path
          d="M0,240 L0,196 Q80,150 168,192 Q232,150 320,186 Q420,146 512,188 Q604,150 700,186 Q800,150 900,190 Q1000,152 1104,188 Q1156,172 1200,192 L1200,240 Z"
          fill="var(--green-400)"
        />
        {/* 앞 들판 (근경) */}
        <path
          d="M0,240 L0,214 Q160,198 340,210 Q540,222 740,208 Q940,196 1110,212 Q1160,216 1200,212 L1200,240 Z"
          fill="var(--green-600)"
        />
        {/* 들꽃/유채 포인트 */}
        <g>
          <circle cx="120" cy="216" r="3" fill="#ffd54f" />
          <circle cx="420" cy="214" r="3" fill="var(--accent)" />
          <circle cx="760" cy="214" r="3" fill="#ffffff" opacity="0.8" />
          <circle cx="980" cy="216" r="3" fill="#ffd54f" />
        </g>
      </svg>
    </div>
  );
}

/** 오름 능선 띠 (일반 섹션 하단 마감) */
export function GrassBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none w-full overflow-hidden leading-[0]", className)}
    >
      <svg viewBox="0 0 1200 90" className="w-full h-auto" preserveAspectRatio="none">
        <path
          d="M0,90 L0,52 Q90,26 190,50 Q260,20 360,48 Q470,22 560,50 Q660,24 760,50 Q870,24 970,50 Q1070,26 1150,46 Q1180,52 1200,50 L1200,90 Z"
          fill="var(--green-400)"
        />
        <path
          d="M0,90 L0,66 Q160,52 360,64 Q560,76 760,62 Q960,50 1130,66 Q1170,70 1200,66 L1200,90 Z"
          fill="var(--green-600)"
        />
        <g>
          <circle cx="150" cy="60" r="3.5" fill="#ffd54f" />
          <circle cx="520" cy="58" r="3.5" fill="var(--accent)" />
          <circle cx="880" cy="60" r="3.5" fill="#ffffff" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
}

/**
 * 현무암 돌담(밭담) 구분선.
 * viewBox 없이 픽셀 좌표 + pattern 으로 타일링 → 폭에 상관없이 돌 모양 유지·반복.
 */
export function StoneWall({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("w-full overflow-hidden leading-[0] my-1", className)}>
      <svg width="100%" height="62" role="presentation" className="block">
        <defs>
          <pattern id="jeju-basalt" width="120" height="62" patternUnits="userSpaceOnUse">
            {/* 윗줄 돌 (모서리는 몰탈 간격 → 이음매 자연스럽게) */}
            <g>
              <rect x="3" y="5" width="37" height="24" rx="10" fill="#4b4744" />
              <rect x="44" y="4" width="38" height="25" rx="11" fill="#565150" />
              <rect x="86" y="6" width="31" height="23" rx="9" fill="#423e3c" />
              {/* 기공(현무암 구멍) */}
              <circle cx="16" cy="16" r="2" fill="#35322f" />
              <circle cx="26" cy="21" r="1.4" fill="#35322f" />
              <circle cx="60" cy="15" r="2.1" fill="#3a3633" />
              <circle cx="70" cy="20" r="1.3" fill="#3a3633" />
              <circle cx="100" cy="17" r="1.8" fill="#312e2b" />
              {/* 윗면 하이라이트 */}
              <rect x="3" y="5" width="37" height="4" rx="2" fill="#615b57" opacity="0.6" />
              <rect x="44" y="4" width="38" height="4" rx="2" fill="#6e6763" opacity="0.55" />
              <rect x="86" y="6" width="31" height="4" rx="2" fill="#5b5551" opacity="0.6" />
            </g>
            {/* 아랫줄 돌 (엇갈림) */}
            <g>
              <rect x="3" y="33" width="27" height="24" rx="10" fill="#524d4a" />
              <rect x="34" y="32" width="38" height="25" rx="11" fill="#454140" />
              <rect x="76" y="33" width="41" height="24" rx="11" fill="#5c5653" />
              <circle cx="14" cy="45" r="1.6" fill="#35322f" />
              <circle cx="50" cy="44" r="2" fill="#312e2b" />
              <circle cx="60" cy="49" r="1.3" fill="#312e2b" />
              <circle cx="95" cy="45" r="2.1" fill="#3a3633" />
              <circle cx="104" cy="50" r="1.3" fill="#3a3633" />
              <rect x="3" y="33" width="27" height="4" rx="2" fill="#6b625e" opacity="0.55" />
              <rect x="34" y="32" width="38" height="4" rx="2" fill="#5b5551" opacity="0.6" />
              <rect x="76" y="33" width="41" height="4" rx="2" fill="#6e6763" opacity="0.55" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="62" fill="url(#jeju-basalt)" />
      </svg>
    </div>
  );
}

/** 하위 호환 별칭 (기존 FenceDivider 사용처) */
export const FenceDivider = StoneWall;

/** 돌하르방 캐릭터 장식 (현무암 톤) */
export function Dolharubang({
  size = 92,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={(size * 120) / 92}
      viewBox="0 0 92 120"
      className={className}
    >
      {/* 몸통 */}
      <path d="M20,118 Q18,74 30,70 L62,70 Q74,74 72,118 Z" fill="#5a5551" />
      {/* 손 (배 위) */}
      <ellipse cx="36" cy="98" rx="8" ry="6" fill="#4b4744" />
      <ellipse cx="56" cy="98" rx="8" ry="6" fill="#4b4744" />
      {/* 얼굴 */}
      <ellipse cx="46" cy="46" rx="26" ry="28" fill="#6b645f" />
      {/* 벙거지(모자) */}
      <path d="M20,34 Q22,12 46,12 Q70,12 72,34 Q60,28 46,28 Q32,28 20,34 Z" fill="#4b4744" />
      {/* 눈 */}
      <circle cx="36" cy="44" r="6" fill="#403b38" />
      <circle cx="58" cy="44" r="6" fill="#403b38" />
      <circle cx="37" cy="43" r="1.6" fill="#fff" opacity="0.7" />
      <circle cx="59" cy="43" r="1.6" fill="#fff" opacity="0.7" />
      {/* 코 (길고 뭉툭) */}
      <path d="M44,48 Q42,64 46,66 Q50,64 48,48 Z" fill="#524d4a" />
      {/* 다문 입 */}
      <path d="M38,62 Q46,66 54,62" stroke="#403b38" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 기공 텍스처 */}
      <circle cx="28" cy="54" r="1.4" fill="#4a453f" />
      <circle cx="64" cy="52" r="1.4" fill="#4a453f" />
      <circle cx="34" cy="86" r="1.4" fill="#49443f" />
      <circle cx="60" cy="90" r="1.4" fill="#49443f" />
    </svg>
  );
}
