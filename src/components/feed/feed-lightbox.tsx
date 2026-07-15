"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/lib/types";

export function FeedLightbox({
  post,
  onClose,
  onGoVillage,
}: {
  post: FeedPost;
  onClose: () => void;
  onGoVillage?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const media = post.media;
  const current = media[idx];

  useEffect(() => {
    setIdx(0);
  }, [post.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && idx > 0) setIdx(idx - 1);
      if (e.key === "ArrowRight" && idx < media.length - 1) setIdx(idx + 1);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, idx, media.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30 transition-colors"
      >
        <X size={22} />
      </button>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-4">
        <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
          <div className="relative aspect-[9/16] w-full">
            {current ? (
              <Image
                src={current.url || current.thumbUrl}
                alt={post.caption}
                fill
                sizes="(max-width:640px) 100vw, 512px"
                className="object-contain"
                priority
              />
            ) : (
              <div className="grid h-full place-items-center text-white/40">사진 없음</div>
            )}
          </div>

          {media.length > 1 && (
            <>
              {idx > 0 && (
                <button
                  onClick={() => setIdx(idx - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {idx < media.length - 1 && (
                <button
                  onClick={() => setIdx(idx + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 w-full rounded-2xl bg-white/10 backdrop-blur-md p-4 text-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
            <MapPin size={13} className="shrink-0" />
            <span>{post.villageName}</span>
            <span className="text-white/40">·</span>
            <time>{timeAgo(post.publishedAt)}</time>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed">{post.caption}</p>

          {onGoVillage && (
            <button
              onClick={onGoVillage}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              {post.villageName} 마을 가기 <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
