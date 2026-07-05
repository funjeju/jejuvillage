import Image from "next/image";
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

/** 한라산·돌담·들판 파노라마 (히어로 풍경 이미지) */
export function JejuHills({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative w-full overflow-hidden leading-[0]", className)}>
      <div className="relative h-44 sm:h-72 w-full">
        <Image
          src="/decor/jeju-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
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

/** 현무암 돌담(밭담) 구분선 — 실제 돌담 이미지 밴드 */
export function StoneWall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative w-full overflow-hidden my-2", className)}
    >
      <div className="relative h-20 w-full">
        <Image
          src="/decor/jeju-stonewall.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 64%" }}
        />
      </div>
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
