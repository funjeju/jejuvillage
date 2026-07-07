"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 마을 배경음악 — 화면 하단 고정 플로팅 플레이어.
 * - 기본 '재생 중' 표시 + 진입 즉시 자동재생 시도. 브라우저 정책으로 막히면
 *   (크롬은 첫 방문 소리 자동재생 차단) 사용자의 첫 터치/클릭/키 입력에 자동 시작.
 * - 버튼은 '의도 기반' 토글: 재생 중 표시일 때 누르면 무조건 정지, 정지 표시일 때 누르면 재생.
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const key = `jv_bgm_off_${villageId}`;
  // 세션에서 직접 끈 적 없으면 기본 '재생 중' 표시
  const [playing, setPlaying] = useState(() =>
    typeof window === "undefined" ? true : sessionStorage.getItem(key) !== "1"
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (sessionStorage.getItem(key) === "1") return; // 이 세션에서 껐음 → 자동재생 안 함

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      window.removeEventListener("pointerdown", onFirstInteract);
      window.removeEventListener("keydown", onFirstInteract);
    };
    const onFirstInteract = (e: Event) => {
      // 플레이어 버튼 위 상호작용은 토글에 맡김 (재생→즉시정지 경쟁 방지)
      if (wrapRef.current && e.target instanceof Node && wrapRef.current.contains(e.target)) return;
      el.play().then(cleanup).catch(() => {});
    };

    el.play().then(cleanup).catch(() => {}); // 즉시 시도 (허용 브라우저면 바로 재생)
    window.addEventListener("pointerdown", onFirstInteract);
    window.addEventListener("keydown", onFirstInteract);

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
      // '재생 중' 표시 상태에서 누름 = 정지 의도 → 무조건 정지
      el.pause();
      setPlaying(false);
      sessionStorage.setItem(key, "1");
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
    <div ref={wrapRef} className="fixed bottom-4 left-4 z-40">
      <audio ref={audioRef} src={src} loop={loop} preload="auto" />
      <button
        type="button"
        onClick={toggle}
        suppressHydrationWarning
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
