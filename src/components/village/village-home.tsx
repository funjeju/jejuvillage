"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, Sparkles } from "lucide-react";
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
import type { VillageBundle, FeedPost } from "@/lib/types";
import type { CSSProperties } from "react";

const STORY_LABEL: Record<string, string> = {
  history: "마을의 역사",
  legend: "전해오는 이야기",
  resource: "마을의 보물",
};

/**
 * 마을 홈 템플릿 (S3) — "데이터만 바뀌면 어느 마을이든 렌더링".
 * - 모든 콘텐츠는 bundle(DB)에서 주입, 하드코딩 없음
 * - 빈 섹션은 자동 숨김 (FR-VIL-01)
 * - 테마 색상은 CSS 변수로 스와핑
 */
export function VillageHome({ bundle }: { bundle: VillageBundle }) {
  const { village, theme, stories, products } = bundle;
  const [posts, setPosts] = useState<FeedPost[]>(bundle.posts);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsub = listenVillageFeed(village.id, (next) => setPosts(next), 30);
    return () => unsub();
  }, [village.id]);

  // 마을별 테마 스와핑 (7.2 테마 연동)
  const themeVars: CSSProperties = theme
    ? ({
        ["--accent"]: theme.colorAccent,
        ["--color-primary"]: theme.colorPrimary,
        ["--color-bg"]: theme.colorBg,
      } as CSSProperties)
    : {};

  const heroUrl = theme?.heroUrl;
  const hasMascot = Boolean(theme?.mascotUrl || theme?.mascotName);

  return (
    <div style={themeVars} className="bg-[var(--color-bg)]">
      {/* ① 히어로 */}
      <section className="relative overflow-hidden">
        <div className="relative h-[52vh] min-h-[360px] w-full bg-green-700">
          {heroUrl ? (
            <Image
              src={heroUrl}
              alt={village.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
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
            {theme?.bgmUrl && (
              <div className="mt-4">
                <BgmPlayer src={theme.bgmUrl} loop={theme.bgmLoop} villageId={village.id} />
              </div>
            )}
          </Container>
        </div>
      </section>

      {/* ② 마을 스토리 (빈 경우 숨김) */}
      {stories.length > 0 && (
        <Container className="py-12">
          <SectionHeading eyebrow="📖 마을 이야기" title="느린 마을, 깊은 이야기" />
          <div className="grid gap-5 md:grid-cols-3">
            {stories.map((s, i) => (
              <Postit key={s.id} tilt={i % 2 ? "right" : "left"} color={i % 2 ? "sky" : "cream"}>
                <h3 className="font-display text-lg text-ink-900">
                  {s.title || STORY_LABEL[s.sectionKey] || "이야기"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700 whitespace-pre-line">
                  {s.body}
                </p>
              </Postit>
            ))}
          </div>
        </Container>
      )}

      <FenceDivider />

      {/* ③ 소식 피드 (빈 경우 안내) */}
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

      {/* ④ 체험상품 (빈 경우 숨김) */}
      {products.length > 0 && (
        <>
          <FenceDivider />
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
        </>
      )}

      {/* ⑤ 마스코트 (미등록 시 숨김) */}
      {hasMascot && (
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
              {theme?.mascotDesc && (
                <p className="mt-2 max-w-md text-ink-700">{theme.mascotDesc}</p>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* ⑥ 오시는 길 */}
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
      <GrassBand />
    </div>
  );
}
