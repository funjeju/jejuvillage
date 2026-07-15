"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { FeedPost } from "@/lib/types";

/**
 * 대표(featured) 라이브 카드 — 최신 소식을 크게, 카드뉴스처럼 캡션 오버레이.
 */
export function FeaturedFeedCard({
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
        "group relative block overflow-hidden rounded-[var(--radius-blob)] border shadow-[var(--shadow-card)] transition-all",
        active ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40" : "border-line/80"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-green-100">
        {media ? (
          <Image
            src={media.url || media.thumbUrl}
            alt={post.caption}
            fill
            priority
            sizes="(max-width:1024px) 100vw, 640px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-green-700/40">사진</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {post.villageName}
            </span>
            <span className="text-white/60">·</span>
            <time>{timeAgo(post.publishedAt)}</time>
          </div>
          <p className="mt-1.5 font-display text-lg sm:text-2xl leading-snug line-clamp-2 drop-shadow">
            {post.caption}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * 세로 9:16 라이브 카드 (홈 S1 슬라이드 스트립).
 * 사무장이 각 마을 페이지에서 올린 소식을 끌어와, 카드 전체가 해당 마을 홈으로 링크.
 * 부모의 가로 스크롤 컨테이너 안에서 한 번에 2개씩 보이도록 폭을 잡는다.
 */
export function LiveFeedCard({
  post,
  onActivate,
  onDeactivate,
  active,
  onClick,
}: {
  post: FeedPost;
  onActivate?: (villageId: string) => void;
  onDeactivate?: () => void;
  active?: boolean;
  onClick?: (post: FeedPost) => void;
}) {
  const media = post.media[0];
  const shared = cn(
    "group relative block shrink-0 snap-start overflow-hidden rounded-[var(--radius-blob)] border shadow-[var(--shadow-card)] transition-all",
    "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]",
    active ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/40" : "border-line/80"
  );

  const inner = (
    <div className="relative aspect-[9/16] w-full bg-green-100">
      {media ? (
        <Image
          src={media.url || media.thumbUrl}
          alt={post.caption}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full place-items-center text-green-700/40">사진</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
      </span>
      {post.media.length > 1 && (
        <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          +{post.media.length - 1}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{post.villageName}</span>
          <span className="text-white/50">·</span>
          <time className="shrink-0 text-white/70">{timeAgo(post.publishedAt)}</time>
        </div>
        <p className="mt-1 font-display text-sm leading-snug line-clamp-2 drop-shadow">
          {post.caption}
        </p>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={() => onClick(post)}
        onMouseEnter={() => onActivate?.(post.villageId)}
        onMouseLeave={() => onDeactivate?.()}
        className={cn(shared, "text-left cursor-pointer")}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={`/v/${post.villageSlug}#feed`}
      onMouseEnter={() => onActivate?.(post.villageId)}
      onMouseLeave={() => onDeactivate?.()}
      className={shared}
    >
      {inner}
    </Link>
  );
}

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
