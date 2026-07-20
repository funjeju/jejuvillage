"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Newspaper, Compass, Map as MapIcon, ChevronLeft, ChevronRight, Building2, MapPin, ExternalLink } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Mascot } from "@/components/decor/mascot";
import { LiveFeedCard } from "@/components/feed/feed-card";
import { HomeCtaBar } from "@/components/home/home-cta";
import { ProductCard } from "@/components/product/product-card";
import { JejuMap } from "@/components/map/jeju-map";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenGlobalFeed } from "@/lib/repo/client";
import { FeedLightbox } from "@/components/feed/feed-lightbox";
import type { VillageSummary, FeedPost, Product, DailyBriefing } from "@/lib/types";

export function HomeClient({
  villages,
  initialPosts,
  products,
  latestBriefing,
}: {
  villages: VillageSummary[];
  initialPosts: FeedPost[];
  products: Product[];
  latestBriefing: DailyBriefing | null;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<FeedPost | null>(null);
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
          <FeedSlider
            posts={posts}
            activeId={activeId}
            setActiveId={setActiveId}
            onCardClick={setLightbox}
          />
        ) : (
          <EmptyHint icon={<Newspaper />} text="아직 올라온 소식이 없어요. 첫 소식을 기다리는 중!" />
        )}
      </Container>

      {/* ── 데일리 제주마을 브리핑 ── */}
      {latestBriefing && (
        <section className="bg-gradient-to-b from-blue-50/40 to-white py-12">
          <Container>
            <SectionHeading
              eyebrow="📰 데일리 브리핑"
              title="오늘의 제주마을 소식"
              desc="제주도청 소식과 마을별 뉴스를 매일 자동으로 모아드려요."
              action={
                <ButtonLink href="/briefing" variant="soft" size="sm">
                  <Newspaper size={16} /> 전체 브리핑
                </ButtonLink>
              }
            />
            <BriefingPreview briefing={latestBriefing} />
          </Container>
        </section>
      )}

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
      {lightbox && (
        <FeedLightbox
          post={lightbox}
          onClose={() => setLightbox(null)}
          onGoVillage={() => {
            setLightbox(null);
            router.push(`/v/${lightbox.villageSlug}#feed`);
          }}
        />
      )}
    </div>
  );
}

function FeedSlider({
  posts,
  activeId,
  setActiveId,
  onCardClick,
}: {
  posts: FeedPost[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onCardClick: (post: FeedPost) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check, posts.length]);

  function scroll(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="group/slider relative">
      <div
        ref={ref}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6"
      >
        {posts.map((p) => (
          <LiveFeedCard
            key={p.id}
            post={p}
            active={activeId === p.villageId}
            onActivate={setActiveId}
            onDeactivate={() => setActiveId(null)}
            onClick={onCardClick}
          />
        ))}
      </div>

      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 hidden sm:grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-lg text-ink-700 hover:bg-white transition-all opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 hidden sm:grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-lg text-ink-700 hover:bg-white transition-all opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}

function BriefingPreview({ briefing }: { briefing: DailyBriefing }) {
  const [y, m, d] = briefing.date.split("-").map(Number);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dt = new Date(y, m - 1, d);
  const dateLabel = `${m}월 ${d}일 (${days[dt.getDay()]})`;

  const govItems = briefing.governmentNews.slice(0, 3);
  const villageItems = briefing.villageNews.slice(0, 4);

  return (
    <div className="rounded-2xl border border-line/80 bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-line/60 bg-gradient-to-r from-blue-50 to-white px-5 py-3">
        <div>
          <time className="text-xs font-semibold text-blue-600">{dateLabel}</time>
          <h3 className="font-display text-base text-ink-900 mt-0.5">{briefing.headline}</h3>
        </div>
        <Link
          href="/briefing"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          더보기 <ChevronRight size={14} />
        </Link>
      </div>

      <div className="divide-y divide-line/40">
        {govItems.length > 0 && (
          <div className="px-5 py-3.5">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400 mb-2">
              <Building2 size={12} /> 도청 소식
            </h4>
            <ul className="space-y-2">
              {govItems.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-blue-50/60 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </span>
                      {item.summary && (
                        <span className="block mt-0.5 text-xs text-ink-500 line-clamp-1">{item.summary}</span>
                      )}
                    </span>
                    <ExternalLink size={12} className="shrink-0 mt-1 text-ink-300 group-hover:text-blue-600" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {villageItems.length > 0 && (
          <div className="px-5 py-3.5">
            <h4 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-400 mb-2">
              <MapPin size={12} /> 마을 소식
            </h4>
            <ul className="space-y-2">
              {villageItems.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2 rounded-lg p-1.5 -mx-1.5 hover:bg-green-50/60 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink-900 line-clamp-1 group-hover:text-green-700 transition-colors">
                        {item.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-400">
                        {item.villageName && (
                          <span className="font-semibold text-green-700">{item.villageName}</span>
                        )}
                        {item.summary && (
                          <span className="line-clamp-1">{item.summary}</span>
                        )}
                      </span>
                    </span>
                    <ExternalLink size={12} className="shrink-0 mt-1 text-ink-300 group-hover:text-green-600" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
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
