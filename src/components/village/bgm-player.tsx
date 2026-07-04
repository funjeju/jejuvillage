"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 배경음악(BGM) 토글 (기획서 S3 규칙).
 * - 자동재생 금지, 사용자 토글로만 재생
 * - 재생 상태 세션 유지(sessionStorage), 페이지 이탈 시 정지
 * - 접근성: 명확한 label, 키보드 포커스
 */
export function BgmPlayer({
  src,
  loop = true,
  villageId,
}: {
  src: string;
  loop?: boolean;
  villageId: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const key = `jv_bgm_${villageId}`;

  useEffect(() => {
    const el = audioRef.current;
    return () => {
      el?.pause();
    };
  }, []);

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      sessionStorage.setItem(key, "0");
    } else {
      try {
        await el.play();
        setPlaying(true);
        sessionStorage.setItem(key, "1");
      } catch {
        // 사용자 제스처 없이는 재생 불가 — 무시
      }
    }
  }

  return (
    <>
      <audio ref={audioRef} src={src} loop={loop} preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "배경음악 정지" : "배경음악 재생"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-[var(--shadow-card)] transition-all backdrop-blur-sm",
          playing
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "bg-white/85 text-ink-900 hover:bg-white"
        )}
      >
        {playing ? <Pause size={16} /> : <Music size={16} />}
        {playing ? "음악 멈춤" : "마을 음악"}
      </button>
    </>
  );
}
