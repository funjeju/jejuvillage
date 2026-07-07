"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, BarChart3, Pencil, Check, X, Loader2 } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { Postit } from "@/components/ui/postit";
import { FenceDivider, GrassBand } from "@/components/decor/nature";
import { Mascot } from "@/components/decor/mascot";
import { LiveFeedCard } from "@/components/feed/feed-card";
import { ProductCard } from "@/components/product/product-card";
import { BgmPlayer } from "@/components/village/bgm-player";
import { LocationMap } from "@/components/map/location-map";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenVillageFeed, saveStory, saveThemePartial } from "@/lib/repo/client";
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

/** 히어로 부제용: 마크다운 제거 후 첫 문장만 간결하게 */
function cleanOneLiner(text: string): string {
  const clean = stripMd(text).replace(/\n/g, " ").trim();
  const firstSentence = clean.split(/(?<=[.!?。])\s|·/)[0] ?? clean;
  return firstSentence.slice(0, 60);
}

/** 스토리 카드용: 마크다운 제거 후 앞 2~3문장(최대 180자)만 요약 노출 */
function summarize(text: string, maxLen = 180): string {
  const clean = stripMd(text).replace(/\n+/g, " ").trim();
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
  const active = layout.filter((s) => s.enabled);

  const sections: Record<SectionKey, React.ReactNode> = {
    hero: <HeroSection key="hero" bundle={bundle} isManager={isManager} />,
    story: <StorySection key="story" bundle={bundle} isManager={isManager} />,
    feed: <FeedSection key="feed" posts={posts} />,
    products: <ProductsSection key="products" bundle={bundle} />,
    mascot: <MascotSection key="mascot" bundle={bundle} isManager={isManager} />,
    location: <LocationSection key="location" bundle={bundle} />,
  };

  return (
    <div style={themeVars} className="bg-[var(--color-bg)]">
      {active.map((s, i) => {
        const node = sections[s.key];
        if (!node) return null;
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
        {/* 배너 위 마스코트 안내 (있을 때만) */}
        {theme?.mascotUrl && (
          <div className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 hidden sm:block">
            <Mascot
              src={theme.mascotUrl}
              name={theme.mascotName}
              say={theme.mascotName ? `${theme.mascotName}이 반겨요!` : "어서와요!"}
              size={72}
              flip
            />
          </div>
        )}
        <Container className="relative flex h-full flex-col justify-end pb-10">
          <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
            <MapPin size={14} /> {village.region}
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl text-white drop-shadow">{village.name}</h1>
          {village.oneLiner && (
            <p className="mt-2 max-w-2xl text-white/90 text-base sm:text-lg drop-shadow">{cleanOneLiner(village.oneLiner)}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {theme?.bgmUrl && <BgmPlayer src={theme.bgmUrl} loop={theme.bgmLoop} villageId={village.id} />}
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

  if (!stories.length) return null;

  return (
    <>
      <Container className="py-12">
        <SectionHeading eyebrow="📖 마을 이야기" title="느린 마을, 깊은 이야기" desc="이 마을의 핵심만 세 가지로 골라봤어요." />
        <div className="grid gap-5 md:grid-cols-3">
          {stories.slice(0, 3).map((s, i) => (
            <div key={s.id} className="group/card relative">
              <Postit tilt={i % 2 ? "right" : "left"} color={i % 2 ? "sky" : "cream"}>
                <span className="text-xs font-bold text-[var(--accent)]">
                  {STORY_LABEL[s.sectionKey] || "이야기"}
                </span>
                <h3 className="mt-0.5 font-display text-lg text-ink-900 line-clamp-1">
                  {s.title || STORY_LABEL[s.sectionKey] || "이야기"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700 line-clamp-5">
                  {summarize(s.body)}
                </p>
              </Postit>
              {isManager && (
                <button
                  onClick={() => setEditing(s)}
                  className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-md opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-green-100"
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

/* ── 마스코트 섹션 ── */
function MascotSection({ bundle, isManager }: { bundle: VillageBundle; isManager: boolean }) {
  const { theme, village } = bundle;
  const [name, setName] = useState(theme?.mascotName ?? "");
  const [desc, setDesc] = useState(theme?.mascotDesc ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const hasMascot = Boolean(theme?.mascotUrl || theme?.mascotName);
  if (!hasMascot) return null;

  async function saveMascot() {
    setSaving(true);
    try {
      await saveThemePartial(village.id, { mascotName: name || null, mascotDesc: desc || null });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

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
        {isManager && (
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-md hover:bg-green-100"
          >
            <Pencil size={12} /> 마스코트 편집
          </button>
        )}
      </Container>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditOpen(false)} />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">마스코트 편집</h3>
              <button onClick={() => setEditOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-500 mb-1 block">이름</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-green-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-500 mb-1 block">한줄 소개</label>
                <input value={desc} onChange={(e) => setDesc(e.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-green-600" />
              </div>
              <p className="text-xs text-ink-500">이미지 교체는 <Link href="/admin/homepage" target="_blank" className="text-green-700 underline">홈페이지 만들기 → 디자인</Link> 탭에서 가능해요.</p>
              <div className="flex gap-2 pt-1">
                <button onClick={saveMascot} disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-green-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} 저장
                </button>
                <button onClick={() => setEditOpen(false)} className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
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
