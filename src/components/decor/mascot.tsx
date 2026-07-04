import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * 마스코트 안내자 (기획서 7.5).
 * theme.mascot_media_id → 이미지 주입, 없으면 기본 그림책 캐릭터(SVG).
 * 섹션마다 2~3 지점에 포인트로 배치. 과다 노출 주의.
 */
export function Mascot({
  src,
  name,
  say,
  size = 96,
  flip = false,
  className,
}: {
  src?: string | null;
  name?: string | null;
  say?: string;
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <div
        className={cn("shrink-0", flip && "scale-x-[-1]")}
        style={{ width: size, height: size }}
      >
        {src ? (
          <Image
            src={src}
            alt={name ? `${name} 마스코트` : "마을 마스코트"}
            width={size}
            height={size}
            className="object-contain drop-shadow-[0_6px_10px_rgba(36,48,31,0.25)]"
          />
        ) : (
          <DefaultMascot size={size} />
        )}
      </div>
      {say && (
        <div
          className={cn(
            "relative mb-2 max-w-[15rem] rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-ink-900",
            "shadow-[var(--shadow-card)]",
            flip && "scale-x-[-1]"
          )}
        >
          <span className={cn(flip && "inline-block scale-x-[-1]")}>{say}</span>
          <span
            aria-hidden
            className="absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 bg-white"
          />
        </div>
      )}
    </div>
  );
}

/** 마을 고유 캐릭터 미등록 시 기본 캐릭터 (물통을 든 새싹 아이 느낌) */
function DefaultMascot({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      {/* 몸 */}
      <ellipse cx="50" cy="66" rx="26" ry="24" fill="var(--green-600)" />
      {/* 얼굴 */}
      <circle cx="50" cy="42" r="24" fill="#fff4e0" />
      {/* 볼 */}
      <circle cx="38" cy="46" r="4" fill="var(--accent)" opacity="0.5" />
      <circle cx="62" cy="46" r="4" fill="var(--accent)" opacity="0.5" />
      {/* 눈 */}
      <circle cx="42" cy="40" r="3" fill="#333" />
      <circle cx="58" cy="40" r="3" fill="#333" />
      {/* 입 */}
      <path d="M44 48 Q50 54 56 48" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 새싹 */}
      <path d="M50 18 Q46 8 40 10 Q44 16 50 18" fill="var(--green-400)" />
      <path d="M50 18 Q54 6 62 10 Q56 16 50 18" fill="var(--green-700)" />
      {/* 장미 포인트 */}
      <circle cx="64" cy="24" r="5" fill="var(--accent)" />
    </svg>
  );
}
