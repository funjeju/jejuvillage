"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, BarChart3 } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Postit } from "@/components/ui/postit";
import { FenceDivider, GrassBand } from "@/components/decor/nature";
import { Mascot } from "@/components/decor/mascot";
import { FeedCard } from "@/components/feed/feed-card";
import { ProductCard } from "@/components/product/product-card";
import { BgmPlayer } from "@/components/village/bgm-player";
import { LocationMap } from "@/components/map/location-map";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenVillageFeed } from "@/lib/repo/client";
import { DEFAULT_LAYOUT } from "@/lib/types";
import type { VillageBundle, FeedPost, SectionKey } from "@/lib/types";
import type { CSSProperties } from "react";

const STORY_LABEL: Record<string, string> = {
  history: "마을의 역사",
  legend: "전해오는 이야기",
  resource: "마을의 보물",
};

/**
 * 마을 홈 템플릿 (S3) — "데이터만 바뀌면 어느 마을이든 렌더링".
 * 섹션은 village.layout(빌더 설정) 순서·활성에 따라 모듈로 렌더된다.
 * 데이터가 비면 자동 숨김. 테마 색상은 CSS 변수로 스와핑.
 */
export function VillageHome({ bundle }: { bundle: VillageBundle }) {
  const { village, theme } = bundle;
  const [posts, setPosts] = useState<FeedPost[]>(bundle.posts);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = listenVillageFeed(village.id, (next) => setPosts(next), 30);
    return () => unsub();
  }, [village.id]);

  const themeVars: CSSProperties = theme
    ? ({
        ["--accent"]: theme.colorAccent,
        ["--color-primary"]: theme.colorPrimary,
        ["--color-bg"]: theme.colorBg,
      } as CSSProperties)
    : {};

  const layout = village.layout?.length ? village.layout : DEFAULT_LAYOUT;
  const active = layout.filter((s) => s.enabled);

  const sections: Record<SectionKey, React.ReactNode> = {
    hero: <HeroSection key="hero" bundle={bundle} />,
    story: <StorySection key="story" bundle={bundle} />,
    feed: <FeedSection key="feed" posts={posts} />,
    products: <ProductsSection key="products" bundle={bundle} />,
    mascot: <MascotSection key="mascot" bundle={bundle} />,
    location: <LocationSection key="location" bundle={bundle} />,
  };

  return (
    <div style={themeVars} className="bg-[var(--color-bg)]">
      {active.map((s, i) => {
        const node = sections[s.key];
        if (!node) return null;
        // 히어로 외 섹션 사이에 울타리 divider
        const divider =
          i > 0 && s.key !== "hero" && active[i - 1].key !== "hero" ? (
            <FenceDivider key={`div-${i}`} />
          ) : null;
        return (
          <div key={s.key}>
            {divider}
            {node}
          </div>
        );
      })}
      <GrassBand />
    </div>
  );
}

/* ── 개별 섹션 모듈 (데이터 없으면 각자 null 반환 → 자동 숨김) ── */

function HeroSection({ bundle }: { bundle: VillageBundle }) {
  const { village, theme } = bundle;
  const heroUrl = theme?.heroUrl;
  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[52vh] min-h-[360px] w-full bg-green-700">
        {heroUrl ? (
          <Image src={heroUrl} alt={village.name} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-green-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <Container className="relative flex h-full flex-col justify-end pb-10">
          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
            <MapPin size={14} /> {village.region}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl text-white drop-shadow">
            {village.name}
          </h1>
          {village.oneLiner && (
            <p className="mt-2 max-w-2xl text-white/90 text-base sm:text-lg drop-shadow">
              {village.oneLiner}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {theme?.bgmUrl && (
              <BgmPlayer src={theme.bgmUrl} loop={theme.bgmLoop} villageId={village.id} />
            )}
            {bundle.reportEnabled && (
              <Link
                href={`/v/${village.slug}/report`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-green-800 shadow-[var(--shadow-card)] backdrop-blur-sm hover:bg-white"
              >
                <BarChart3 size={16} /> 관광 리포트 보기
              </Link>
            )}
          </div>
        </Container>
      </div>
    </section>
  );
}

function StorySection({ bundle }: { bundle: VillageBundle }) {
  const { stories } = bundle;
  if (!stories.length) return null;
  return (
    <Container className="py-12">
      <SectionHeading eyebrow="📖 마을 이야기" title="느린 마을, 깊은 이야기" />
      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((s, i) => (
          <Postit key={s.id} tilt={i % 2 ? "right" : "left"} color={i % 2 ? "sky" : "cream"}>
            <h3 className="font-display text-lg text-ink-900">
              {s.title || STORY_LABEL[s.sectionKey] || "이야기"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700 whitespace-pre-line">{s.body}</p>
          </Postit>
        ))}
      </div>
    </Container>
  );
}

function FeedSection({ posts }: { posts: FeedPost[] }) {
  return (
    <Container id="feed" className="py-12 scroll-mt-20">
      <SectionHeading
        eyebrow="🌱 마을 소식"
        title="지금 마을에서는"
        desc="마을이 직접 전하는 실시간 사진 소식이에요."
      />
      {posts.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {posts.map((p) => (
            <FeedCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-12 text-center text-ink-500">
          아직 올라온 소식이 없어요.
        </p>
      )}
    </Container>
  );
}

function ProductsSection({ bundle }: { bundle: VillageBundle }) {
  const { products } = bundle;
  if (!products.length) return null;
  return (
    <Container className="py-12">
      <SectionHeading eyebrow="🥾 마을 체험" title="이 마을에서만 할 수 있는 것" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <div key={p.id} className="[&>a]:w-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </Container>
  );
}

function MascotSection({ bundle }: { bundle: VillageBundle }) {
  const { theme } = bundle;
  const hasMascot = Boolean(theme?.mascotUrl || theme?.mascotName);
  if (!hasMascot) return null;
  return (
    <section className="bg-green-100/50 py-12">
      <Container className="flex flex-col items-center text-center gap-4">
        <Mascot
          src={theme?.mascotUrl}
          name={theme?.mascotName}
          say={theme?.mascotName ? `안녕! 나는 ${theme.mascotName}!` : undefined}
          size={120}
        />
        <div>
          <h2 className="font-display text-2xl inline-flex items-center gap-2">
            <Sparkles size={20} className="text-[var(--accent)]" />
            {theme?.mascotName ?? "마을 친구"}
          </h2>
          {theme?.mascotDesc && <p className="mt-2 max-w-md text-ink-700">{theme.mascotDesc}</p>}
        </div>
      </Container>
    </section>
  );
}

function LocationSection({ bundle }: { bundle: VillageBundle }) {
  const { village } = bundle;
  return (
    <Container className="py-12">
      <SectionHeading eyebrow="🚗 오시는 길" title={`${village.name} 찾아오기`} />
      <div className="grid gap-5 md:grid-cols-[1fr_1.4fr] items-start">
        <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-5 shadow-[var(--shadow-card)]">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-ink-500">지역</dt>
              <dd className="font-semibold text-ink-900">{village.region}</dd>
            </div>
            <div>
              <dt className="text-ink-500">한줄 소개</dt>
              <dd className="text-ink-900">{village.oneLiner || "-"}</dd>
            </div>
          </dl>
        </div>
        <LocationMap lat={village.lat} lng={village.lng} name={village.name} />
      </div>
    </Container>
  );
}
