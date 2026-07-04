"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/lib/types";

/**
 * 실시간 사진 소식 카드 (S1/S6).
 * 포스트잇 스타일 캡션 + 마을명 + 시간.
 * onActivate/onDeactivate 로 지도 핀 하이라이트 연동(기획서 보강 아이디어 3).
 */
export function FeedCard({
  post,
  onActivate,
  onDeactivate,
  active,
}: {
  post: FeedPost;
  onActivate?: (villageId: string) => void;
  onDeactivate?: () => void;
  active?: boolean;
}) {
  const media = post.media[0];
  return (
    <Link
      href={`/v/${post.villageSlug}#feed`}
      onMouseEnter={() => onActivate?.(post.villageId)}
      onMouseLeave={() => onDeactivate?.()}
      className={cn(
        "group block break-inside-avoid rounded-[var(--radius-blob)] bg-white border shadow-[var(--shadow-card)] overflow-hidden transition-all hover:-translate-y-1",
        active ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40" : "border-line/80"
      )}
    >
      <div className="relative aspect-square bg-green-100">
        {media ? (
          <Image
            src={media.thumbUrl || media.url}
            alt={post.caption}
            fill
            sizes="(max-width:640px) 50vw, 280px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="grid h-full place-items-center text-green-700/40">사진</div>
        )}
        {post.isPinned && (
          <span className="absolute top-2 right-2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-bold px-2 py-0.5">
            📌 고정
          </span>
        )}
        {post.media.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5">
            +{post.media.length - 1}
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-green-700">
            <MapPin size={12} /> {post.villageName}
          </span>
          <time className="text-ink-500">{timeAgo(post.publishedAt)}</time>
        </div>
        <p className="mt-1.5 text-sm text-ink-900 line-clamp-2">{post.caption}</p>
      </div>
    </Link>
  );
}
