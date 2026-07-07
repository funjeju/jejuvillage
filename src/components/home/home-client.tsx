"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Newspaper, Compass, Map as MapIcon } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { FenceDivider } from "@/components/decor/nature";
import { Mascot } from "@/components/decor/mascot";
import { LiveFeedCard } from "@/components/feed/feed-card";
import { HomeCtaBar } from "@/components/home/home-cta";
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

  return (
    <div>
      {/* ── 히어로: 한라산·돌담 파노라마 배경 + 검색 + 마스코트 ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/decor/jeju-hero.png"
            alt="제주 한라산과 돌담 풍경"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/25 to-cream-50" />
        </div>
        <Container className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
          <h1 className="font-display text-3xl sm:text-5xl leading-tight text-ink-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
            제주 마을,
            <br className="sm:hidden" /> 지금 이 순간을 만나요
          </h1>
          <p className="mt-3 text-ink-800 text-base sm:text-lg drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
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
            <Mascot say="안녕! 나랑 제주 마을 구경 갈래?" size={84} />
          </div>
        </Container>
      </section>

      {/* ── LIVE: 사무장이 사진 한 장으로 올리는 카드뉴스형 실시간 피드 ── */}
      <Container className="py-12">
        <SectionHeading
          eyebrow={
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
              </span>
              LIVE · 지금 마을에서는
            </span>
          }
          title="1년 내내 살아있는 마을 소식"
          desc="사무장이 사진 한 장만 올리면 카드뉴스처럼 예쁘게 보여요. 카드에 올려보면 지도에서 위치가 반짝여요."
          action={
            <ButtonLink href="/feed" variant="soft" size="sm">
              <Newspaper size={16} /> 전체 소식
            </ButtonLink>
          }
        />
        {posts.length ? (
          /* 세로 9:16 카드 · 한 번에 2개 · 좌우 스냅 슬라이드 (각 카드는 해당 마을 페이지로 링크) */
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {posts.map((p) => (
              <LiveFeedCard
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

      {/* ── 지금 예약 가능한 체험 (구매 가능 상품) ── */}
      <Container className="py-12">
        <SectionHeading
          eyebrow="🎫 지금 예약 가능한"
          title="제주 마을 로컬 체험"
          desc="마을이 직접 준비한, 지금 바로 신청할 수 있는 체험이에요."
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

      <HomeCtaBar />
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
