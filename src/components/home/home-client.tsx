"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Newspaper, Compass, Map as MapIcon } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { CloudBand, FenceDivider, JejuHills, Dolharubang } from "@/components/decor/nature";
import { Mascot } from "@/components/decor/mascot";
import { FeedCard } from "@/components/feed/feed-card";
import { ProductCard } from "@/components/product/product-card";
import { JejuMap } from "@/components/map/jeju-map";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenGlobalFeed } from "@/lib/repo/client";
import type { VillageSummary, FeedPost, Product } from "@/lib/types";

export function HomeClient({
  villages,
  initialPosts,
  products,
}: {
  villages: VillageSummary[];
  initialPosts: FeedPost[];
  products: Product[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  // 준실시간 피드 갱신 (FR-FEED-02) — Firebase 설정 시에만 리스너 부착
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = listenGlobalFeed((next) => {
      if (next.length) setPosts(next);
    }, 12);
    return () => unsub();
  }, []);

  const seasonVillage = useMemo(
    () => villages.find((v) => v.isLive) ?? villages[0],
    [villages]
  );

  return (
    <div>
      {/* ── 히어로: 제주 중산간 파노라마 + 검색 + 마스코트 (기획서 7.6) ── */}
      <section className="relative bg-gradient-to-b from-sky-100 via-sky-100 to-green-100 overflow-hidden">
        <CloudBand className="absolute top-2 left-0 opacity-80" />
        <Container className="relative pt-16 pb-24 sm:pt-20 text-center">
          <h1 className="font-display text-3xl sm:text-5xl leading-tight text-ink-900">
            제주 마을,
            <br className="sm:hidden" /> 지금 이 순간을 만나요
          </h1>
          <p className="mt-3 text-ink-700 text-base sm:text-lg">
            지도에서 마을을 발견하고, 살아있는 사진 소식으로 오늘의 마을을 보고,
            바로 체험을 예약하세요.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(q.trim() ? `/villages?q=${encodeURIComponent(q.trim())}` : "/villages");
            }}
            className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full bg-white p-2 shadow-[var(--shadow-float)]"
          >
            <Search className="ml-3 text-ink-500 shrink-0" size={20} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="어느 마을이 궁금하세요?"
              className="flex-1 bg-transparent px-1 py-2 outline-none text-ink-900 placeholder:text-ink-500"
              aria-label="마을 검색"
            />
            <button
              type="submit"
              className="rounded-full bg-green-700 px-5 py-2.5 font-display font-semibold text-white hover:bg-green-800 transition-colors"
            >
              찾기
            </button>
          </form>

          <div className="mt-8 flex justify-center">
            <Mascot
              src={seasonVillage?.heroUrl ? null : null}
              say="안녕! 나랑 제주 마을 구경 갈래?"
              size={84}
            />
          </div>
        </Container>
        <div className="relative">
          <JejuHills className="-mb-1" />
          <Dolharubang
            size={78}
            className="absolute bottom-0 left-3 sm:left-10 drop-shadow-[0_6px_8px_rgba(36,48,31,0.25)]"
          />
        </div>
      </section>

      {/* ── 새소식: 실시간 사진 피드 ── */}
      <Container className="py-12">
        <SectionHeading
          eyebrow="🌱 지금 마을에서는"
          title="살아있는 마을 소식"
          desc="마을 운영자가 방금 올린 사진들이에요. 카드에 올려보면 지도에서 위치가 반짝여요."
          action={
            <ButtonLink href="/feed" variant="soft" size="sm">
              <Newspaper size={16} /> 전체 소식
            </ButtonLink>
          }
        />
        {posts.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {posts.slice(0, 8).map((p) => (
              <FeedCard
                key={p.id}
                post={p}
                active={activeId === p.villageId}
                onActivate={setActiveId}
                onDeactivate={() => setActiveId(null)}
              />
            ))}
          </div>
        ) : (
          <EmptyHint icon={<Newspaper />} text="아직 올라온 소식이 없어요. 첫 소식을 기다리는 중!" />
        )}
      </Container>

      <FenceDivider />

      {/* ── 체험 진열 ── */}
      <Container className="py-12">
        <SectionHeading
          eyebrow="🥾 제주에서만"
          title="추천 체험"
          desc="마을이 직접 준비한 체험이에요."
          action={
            <ButtonLink href="/villages" variant="soft" size="sm">
              <Compass size={16} /> 마을별 체험
            </ButtonLink>
          }
        />
        {products.length ? (
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyHint icon={<Compass />} text="체험 상품이 곧 등록될 예정이에요." />
        )}
      </Container>

      {/* ── 한 눈에 보기: 제주 지도 ── */}
      <section className="bg-gradient-to-b from-green-100/50 to-cream-50 py-12">
        <Container>
          <SectionHeading
            eyebrow="🗺️ 한 눈에 보기"
            title="제주 마을 지도"
            desc="핀을 눌러 마을 홈으로 떠나보세요. 초록 링은 최근 소식이 있는 마을이에요."
            action={
              <span className="hidden sm:inline-flex items-center gap-1 text-sm text-ink-500">
                <MapIcon size={16} /> {villages.length}개 마을
              </span>
            }
          />
          <JejuMap villages={villages} activeId={activeId} onHover={setActiveId} />
        </Container>
      </section>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-14 text-center text-ink-500">
      <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-700">
        {icon}
      </div>
      {text}
    </div>
  );
}
