"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, BarChart3, Pencil, Check, X, Loader2, Wand2 } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Postit } from "@/components/ui/postit";
import { GrassBand } from "@/components/decor/nature";
import { LiveFeedCard } from "@/components/feed/feed-card";
import { ProductCard } from "@/components/product/product-card";
import { BgmPlayer } from "@/components/village/bgm-player";
import { LocationMap } from "@/components/map/location-map";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  listenVillageFeed,
  saveStory,
  applyGeneratedHomepage,
  getRawContentOnce,
} from "@/lib/repo/client";
import { DEFAULT_LAYOUT } from "@/lib/types";
import type { VillageBundle, FeedPost, SectionKey, VillageStory } from "@/lib/types";
import type { CSSProperties } from "react";

const STORY_LABEL: Record<string, string> = {
  history: "마을의 역사",
  legend: "전해오는 이야기",
  resource: "마을의 보물",
};

/** 마크다운·기획서 형식 잔재를 제거해 순수 텍스트로 반환 */
function stripMd(text: string): string {
  return text
    .replace(/^#{1,6}\s*/gm, "")                         // ## 헤딩
    .replace(/^\s*\d+[.)]\s+/gm, "")                     // "1. " 번호 매김
    .replace(/^\|[-:\s|]+\|?$/gm, "")                    // 표 구분선
    .replace(/^\|?(.+?)\|$/gm, (_, row: string) =>       // 표 행 → 가운뎃점
      row.split("|").map((c) => c.trim()).filter(Boolean).join(" · ")
    )
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[-–—·•]\s*/gm, "")                        // 목록 기호
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** 기획서 내부 용어가 담긴 줄은 방문자에게 보여주지 않는다 */
const JARGON =
  /기획|상품화|포지셔닝|벤치마크|상징요소|타깃|전략|진단|SWOT|세일즈|재료 요약|리포트 강점/;

function dropJargonLines(text: string): string {
  return text
    .split(/\n/)
    .filter((l) => l.trim() && !JARGON.test(l))
    .join("\n");
}

/** 히어로 부제용: 마크다운·기획 용어 제거 후 첫 문장만. 걸러지면 빈 문자열(숨김) */
function cleanOneLiner(text: string): string {
  const clean = dropJargonLines(stripMd(text)).replace(/\n/g, " ").trim();
  if (!clean) return "";
  const firstSentence = clean.split(/(?<=[.!?。])\s|·/)[0] ?? clean;
  if (JARGON.test(firstSentence)) return "";
  return firstSentence.slice(0, 60);
}

/** 스토리 카드용: 마크다운·기획 용어 제거 후 앞 2~3문장(최대 180자)만 요약 노출 */
function summarize(text: string, maxLen = 140): string {
  const clean = dropJargonLines(stripMd(text)).replace(/\n+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("다 "), cut.lastIndexOf("요 "));
  return (lastStop > 60 ? cut.slice(0, lastStop + 1) : cut).trim() + "…";
}

export function VillageHome({
  bundle,
  isManager = false,
}: {
  bundle: VillageBundle;
  isManager?: boolean;
}) {
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

  // 실제로 콘텐츠가 있는 섹션만 남긴다 (빈 섹션이 divider만 남겨 돌담이 겹치는 문제 방지)
  const hasContent = (key: SectionKey): boolean => {
    switch (key) {
      case "story":
        // 기획 용어만 남은(필터 후 빈) 스토리는 없는 것으로 취급
        return bundle.stories.some((s) => summarize(s.body).length > 0);
      case "products":
        return bundle.products.length > 0;
      case "mascot":
        return Boolean(theme?.mascotUrl || theme?.mascotName);
      default:
        return true; // hero, feed, location 은 항상 노출
    }
  };
  const visible = layout.filter((s) => s.enabled && hasContent(s.key));

  // 마스코트는 별도 섹션 없이 히어로 오버레이로만 노출. 디바이더도 사용하지 않음(깔끔하게).
  const sections: Partial<Record<SectionKey, React.ReactNode>> = {
    hero: <HeroSection key="hero" bundle={bundle} isManager={isManager} />,
    story: <StorySection key="story" bundle={bundle} isManager={isManager} />,
    feed: <FeedSection key="feed" posts={posts} />,
    products: <ProductsSection key="products" bundle={bundle} />,
    location: <LocationSection key="location" bundle={bundle} />,
  };

  return (
    <div style={themeVars} className="bg-[var(--color-bg)]">
      {visible.map((s) => {
        const node = sections[s.key];
        if (!node) return null;
        return <div key={s.key}>{node}</div>;
      })}
      <GrassBand />
      {/* 마을 음악 — 하단 고정 플로팅 플레이어 (진입 시 자동재생 시도) */}
      {theme?.bgmUrl && (
        <BgmPlayer src={theme.bgmUrl} loop={theme.bgmLoop} villageId={village.id} />
      )}
    </div>
  );
}

/* ── 섹션 편집 래퍼 ── */
function EditableSection({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      {children}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-100"
        >
          <Pencil size={12} /> {label} 편집
        </button>
      )}
    </div>
  );
}

/* ── 인라인 텍스트 편집 모달 ── */
function StoryEditModal({
  story,
  villageId,
  onClose,
  onSaved,
}: {
  story: VillageStory;
  villageId: string;
  onClose: () => void;
  onSaved: (title: string, body: string) => void;
}) {
  const [title, setTitle] = useState(story.title);
  const [body, setBody] = useState(story.body);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await saveStory(villageId, story.sectionKey, title, body);
      onSaved(title, body);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">{STORY_LABEL[story.sectionKey] ?? story.sectionKey} 편집</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1 block">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-500 mb-1 block">내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-green-600 resize-none leading-relaxed"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-green-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              저장하기
            </button>
            <button onClick={onClose} className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-700">
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 히어로 섹션 ── */
function HeroSection({ bundle, isManager }: { bundle: VillageBundle; isManager: boolean }) {
  const { village, theme } = bundle;
  const heroUrl = theme?.heroUrl;
  const subtitle = village.oneLiner ? cleanOneLiner(village.oneLiner) : "";

  const content = (
    <section className="relative overflow-hidden">
      <div className="relative h-[52vh] min-h-[360px] w-full bg-green-700">
        {heroUrl ? (
          // 중앙 세이프존 유지: 데스크톱은 와이드 전체, 모바일은 센터 크롭 (한 장 대응)
          <Image
            src={heroUrl}
            alt={village.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-green-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        {/* 마스코트 오버레이 — 배너 우측 하단에 자연스럽게 서 있는 형태 (마을명과 겹치지 않음) */}
        {theme?.mascotUrl && (
          <div className="pointer-events-none absolute bottom-0 right-1 sm:right-8 md:right-14 z-10 h-36 w-36 sm:h-56 sm:w-56 md:h-72 md:w-72">
            <Image
              src={theme.mascotUrl}
              alt={theme.mascotName ?? "마을 마스코트"}
              fill
              sizes="(max-width:640px) 144px, 288px"
              className="object-contain object-bottom drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
            />
          </div>
        )}
        <Container className="relative flex h-full flex-col justify-end pb-10">
          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
            <MapPin size={14} /> {village.region}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl text-white drop-shadow">{village.name}</h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-white/90 text-base sm:text-lg drop-shadow">{subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
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

  if (!isManager) return content;
  return (
    <EditableSection
      label="대표 이미지"
      onEdit={() => window.open("/admin/homepage", "_blank")}
    >
      {content}
    </EditableSection>
  );
}

/* ── 스토리 섹션 ── */
function StorySection({ bundle, isManager }: { bundle: VillageBundle; isManager: boolean }) {
  const { village, stories: initialStories } = bundle;
  const [stories, setStories] = useState(initialStories);
  const [editing, setEditing] = useState<VillageStory | null>(null);
  const [tidying, setTidying] = useState(false);
  const [tidyErr, setTidyErr] = useState<string | null>(null);

  // 기획 용어만 남은 카드는 숨기고, 내용 있는 것만 노출
  const shown = stories.filter((s) => summarize(s.body).length > 0);
  if (!shown.length) return null;

  /** 사무장 원클릭: 저장된 원문 전체를 AI로 재구성 → 한줄소개·스토리 3파트 교체 후 새로고침 */
  async function retidy() {
    setTidyErr(null);
    setTidying(true);
    try {
      const rawText = await getRawContentOnce(village.id);
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId: village.id, villageName: village.name, rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "재구성 실패");
      await applyGeneratedHomepage(village.id, data.data);
      window.location.reload();
    } catch (e) {
      setTidyErr((e as Error).message);
      setTidying(false);
    }
  }

  return (
    <>
      <Container className="py-12">
        <SectionHeading
          eyebrow="📖 마을 이야기"
          title="느린 마을, 깊은 이야기"
          desc="이 마을의 핵심만 세 가지로 골라봤어요."
          action={
            isManager ? (
              <button
                onClick={retidy}
                disabled={tidying}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:opacity-90 disabled:opacity-60"
              >
                {tidying ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                {tidying ? "다듬는 중…" : "AI로 다듬기"}
              </button>
            ) : undefined
          }
        />
        {tidyErr && (
          <p className="mb-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{tidyErr}</p>
        )}
        <div className="grid gap-5 md:grid-cols-3">
          {shown.slice(0, 3).map((s, i) => (
            <div key={s.id} className="group/card relative">
              <Postit tilt={i % 2 ? "right" : "left"} color={i % 2 ? "sky" : "cream"}>
                <span className="text-xs font-bold text-[var(--accent)]">
                  {STORY_LABEL[s.sectionKey] || "이야기"}
                </span>
                <h3 className="mt-0.5 font-display text-lg text-ink-900 line-clamp-2">
                  {s.title || STORY_LABEL[s.sectionKey] || "이야기"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  {summarize(s.body)}
                </p>
              </Postit>
              {isManager && (
                <button
                  onClick={() => setEditing(s)}
                  className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white shadow-md hover:opacity-90"
                >
                  <Pencil size={11} /> 편집
                </button>
              )}
            </div>
          ))}
        </div>
      </Container>
      {editing && (
        <StoryEditModal
          story={editing}
          villageId={village.id}
          onClose={() => setEditing(null)}
          onSaved={(title, body) => {
            setStories((prev) =>
              prev.map((s) => (s.id === editing.id ? { ...s, title, body } : s))
            );
          }}
        />
      )}
    </>
  );
}

/* ── 피드 섹션 ── */
function FeedSection({ posts }: { posts: FeedPost[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  return (
    <Container id="feed" className="py-12 scroll-mt-20">
      <SectionHeading
        eyebrow="🌱 마을 소식"
        title="지금 마을에서는"
        desc="마을이 직접 전하는 실시간 사진 소식이에요."
      />
      {posts.length ? (
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
        <p className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-12 text-center text-ink-500">
          아직 올라온 소식이 없어요.
        </p>
      )}
    </Container>
  );
}

/* ── 체험상품 섹션 ── */
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

/* ── 위치 섹션 ── */
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
