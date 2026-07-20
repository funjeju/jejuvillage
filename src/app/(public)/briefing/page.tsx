import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Newspaper, Building2, MapPin, ChevronRight } from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { getBriefings } from "@/lib/repo/server";
import type { DailyBriefing, BriefingNewsItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "데일리 제주마을 브리핑 | 제주마을",
  description:
    "제주도청 소식과 마을별 뉴스를 매일 자동 수집하여 한눈에 보여드립니다. 제주 관광, 축제, 행사, 마을 체험 최신 소식.",
  openGraph: {
    title: "데일리 제주마을 브리핑",
    description: "제주도청 소식 + 마을별 뉴스를 매일 자동 요약",
  },
};

export const revalidate = 60;

export default async function BriefingPage() {
  const briefings = await getBriefings(30);

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="📰 데일리 브리핑"
        title="제주마을 뉴스룸"
        desc="제주도청 소식과 마을별 뉴스를 매일 자동 수집해 한눈에 보여드려요."
      />

      {briefings.length === 0 ? (
        <div className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-14 text-center text-ink-500">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-700">
            <Newspaper size={24} />
          </div>
          첫 브리핑이 곧 발행됩니다. 매일 아침 자동으로 업데이트돼요.
        </div>
      ) : (
        <div className="space-y-6">
          {briefings.map((b) => (
            <BriefingCard key={b.id} briefing={b} />
          ))}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "데일리 제주마을 브리핑",
            description: "제주도청 소식과 마을별 뉴스를 매일 자동 수집·요약",
            publisher: { "@type": "Organization", name: "제주마을" },
            mainEntity: briefings.slice(0, 5).map((b) => ({
              "@type": "NewsArticle",
              headline: b.headline,
              datePublished: b.date,
              description: [
                ...b.governmentNews.map((n) => n.summary),
                ...b.villageNews.map((n) => n.summary),
              ]
                .filter(Boolean)
                .slice(0, 3)
                .join(" "),
            })),
          }),
        }}
      />
    </Container>
  );
}

function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const dateLabel = formatDate(briefing.date);
  const total = briefing.governmentNews.length + briefing.villageNews.length;

  return (
    <article className="rounded-2xl border border-line/80 bg-white shadow-[var(--shadow-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-line/60 bg-gradient-to-r from-blue-50 to-white px-5 py-3.5">
        <div>
          <time className="text-xs font-semibold text-blue-600">{dateLabel}</time>
          <h2 className="font-display text-lg text-ink-900 leading-tight mt-0.5">
            {briefing.headline || `${dateLabel} 브리핑`}
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
          {total}건
        </span>
      </div>

      <div className="divide-y divide-line/40">
        {briefing.governmentNews.length > 0 && (
          <div className="px-5 py-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-ink-500 mb-3">
              <Building2 size={13} /> 제주도청 소식
            </h3>
            <ul className="space-y-3">
              {briefing.governmentNews.map((item, i) => (
                <NewsRow key={i} item={item} />
              ))}
            </ul>
          </div>
        )}

        {briefing.villageNews.length > 0 && (
          <div className="px-5 py-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-ink-500 mb-3">
              <MapPin size={13} /> 마을 소식
            </h3>
            <ul className="space-y-3">
              {briefing.villageNews.map((item, i) => (
                <NewsRow key={i} item={item} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function NewsRow({ item }: { item: BriefingNewsItem }) {
  return (
    <li className="group">
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl p-2.5 -mx-2.5 hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {item.title}
            </p>
            {item.summary && (
              <p className="mt-1 text-xs text-ink-500 leading-relaxed line-clamp-2">
                {item.summary}
              </p>
            )}
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-400">
              {item.villageName && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-green-700">
                  <MapPin size={10} /> {item.villageName}
                </span>
              )}
              {item.source === "government" && (
                <span className="font-semibold text-blue-600">도청</span>
              )}
            </div>
          </div>
          <ExternalLink size={14} className="shrink-0 mt-1 text-ink-300 group-hover:text-blue-600 transition-colors" />
        </div>
      </a>
    </li>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dt = new Date(y, m - 1, d);
  return `${y}년 ${m}월 ${d}일 (${days[dt.getDay()]})`;
}
