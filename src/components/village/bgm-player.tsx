"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 마을 배경음악 — 화면 하단 고정 플로팅 플레이어.
 * - 페이지 진입 시 자동재생 시도. 브라우저가 막으면(자동재생 정책)
 *   사용자의 첫 터치/클릭/키 입력 순간 자동으로 시작한다.
 * - 하단 좌측 플로팅 버튼으로 언제든 재생/정지.
 * - 사용자가 직접 끄면(sessionStorage) 같은 세션에선 다시 자동재생하지 않는다.
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
  // 기본은 '재생 중' 상태로 표시 (자동재생이 잠시 막혀도 첫 터치에 바로 시작됨)
  const [playing, setPlaying] = useState(true);
  const key = `jv_bgm_off_${villageId}`;

  // 자동재생 시도 → 막히면 첫 상호작용에서 시작
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (sessionStorage.getItem(key) === "1") {
      // 사용자가 이 세션에서 직접 껐음 → 자동재생·재생표시 안 함
      queueMicrotask(() => setPlaying(false));
      return;
    }

    let cleaned = false;
    const tryPlay = () =>
      el
        .play()
        .then(() => {
          setPlaying(true);
          cleanup();
        })
        .catch(() => {});
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };

    tryPlay(); // 즉시 시도
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    window.addEventListener("touchstart", tryPlay);

    return () => {
      cleanup();
      el.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  async function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      sessionStorage.setItem(key, "1"); // 직접 끔 → 이 세션에선 자동재생 중단
    } else {
      try {
        await el.play();
        setPlaying(true);
        sessionStorage.removeItem(key);
      } catch {
        /* 무시 */
      }
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <audio ref={audioRef} src={src} loop={loop} preload="auto" />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "배경음악 정지" : "배경음악 재생"}
        className={cn(
          "flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-[var(--shadow-float)] backdrop-blur-md transition-all active:scale-95",
          playing
            ? "bg-[var(--accent)] text-[var(--accent-fg)]"
            : "bg-white/90 text-ink-900 hover:bg-white"
        )}
      >
        {playing ? (
          <>
            <span className="flex items-end gap-[2px] h-4" aria-hidden>
              <span className="w-[3px] rounded-sm bg-current animate-[eq_0.8s_ease-in-out_infinite]" style={{ height: "60%" }} />
              <span className="w-[3px] rounded-sm bg-current animate-[eq_0.8s_ease-in-out_0.2s_infinite]" style={{ height: "100%" }} />
              <span className="w-[3px] rounded-sm bg-current animate-[eq_0.8s_ease-in-out_0.4s_infinite]" style={{ height: "75%" }} />
            </span>
            <Pause size={16} />
          </>
        ) : (
          <>
            <Music size={16} />
            마을 음악
          </>
        )}
      </button>
    </div>
  );
}
