"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FeedCard } from "@/components/feed/feed-card";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenGlobalFeed } from "@/lib/repo/client";
import type { FeedPost } from "@/lib/types";

/** 통합 실시간 피드 (S6) — 마을 필터 + 준실시간 갱신 */
export function FeedClient({ initialPosts }: { initialPosts: FeedPost[] }) {
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [village, setVillage] = useState<string>("all");

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = listenGlobalFeed((next) => {
      if (next.length) setPosts(next);
    }, 60);
    return () => unsub();
  }, []);

  const villages = useMemo(() => {
    const map = new Map<string, string>();
    posts.forEach((p) => map.set(p.villageSlug, p.villageName));
    return Array.from(map, ([slug, name]) => ({ slug, name }));
  }, [posts]);

  const filtered = village === "all" ? posts : posts.filter((p) => p.villageSlug === village);

  return (
    <div>
      {villages.length > 1 && (
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
          <Chip active={village === "all"} onClick={() => setVillage("all")}>
            전체
          </Chip>
          {villages.map((v) => (
            <Chip key={v.slug} active={village === v.slug} onClick={() => setVillage(v.slug)}>
              {v.name}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
          {filtered.map((p) => (
            <FeedCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-20 text-center text-ink-500">
          아직 소식이 없어요.
        </p>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
        active ? "bg-green-700 text-white" : "bg-white text-ink-700 border border-line hover:bg-green-100"
      )}
    >
      {children}
    </button>
  );
}
