import Image from "next/image";
import {
  Sparkles,
  MapPin,
  ThumbsUp,
  AlertTriangle,
  Quote,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  Gift,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import type { Village, VillageReport } from "@/lib/types";

/**
 * 마을 관광인식 리포트 (안덕면 상창리 리포트 형식) — 웹 가독성 최적화 렌더.
 * 모든 텍스트는 마을별 report 데이터에서 주입된다.
 */
export function VillageReportView({
  village,
  report,
}: {
  village: Village;
  report: VillageReport;
}) {
  const s = report.sentiment;
  return (
    <div className="bg-gradient-to-b from-sky-100/60 to-cream-50">
      {/* 헤더 */}
      <section className="border-b border-line/70 bg-white/70">
        <Container className="py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                <MapPin size={14} /> {village.region}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl">
                {village.name}{" "}
                <span className="text-ink-500 text-xl sm:text-2xl align-middle">
                  {report.reportTitle}
                </span>
              </h1>
              {report.tagline && (
                <p className="mt-2 max-w-2xl text-ink-700">{report.tagline}</p>
              )}
            </div>
            {report.score > 0 && <ScoreRing score={report.score} />}
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-10">
        {/* 핵심 키워드 + 장소 TOP */}
        <div className="grid gap-6 lg:grid-cols-2">
          {report.keywords.length > 0 && (
            <Card title="핵심 키워드" sub="WORD CLOUD">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2">
                {report.keywords.map((k, i) => (
                  <span
                    key={i}
                    className="font-display leading-none"
                    style={{
                      fontSize: `${0.9 + Math.min(Math.max(k.weight, 1), 5) * 0.42}rem`,
                      color: KEYWORD_COLORS[i % KEYWORD_COLORS.length],
                    }}
                  >
                    {k.text}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {report.topPlaces.length > 0 && (
            <Card title="가장 많이 언급되는 장소" sub={`TOP ${report.topPlaces.length}`}>
              <ol className="space-y-3">
                {report.topPlaces.map((p, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-700 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    {p.imageUrl && (
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-green-100">
                        <Image src={p.imageUrl} alt={p.name} fill sizes="56px" className="object-cover" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">{p.name}</p>
                      {p.tags && <p className="text-xs text-ink-500">{p.tags}</p>}
                      {p.quote && (
                        <p className="mt-0.5 text-sm text-ink-700">
                          <Quote size={11} className="mr-1 inline text-green-600" />
                          {p.quote}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        {/* 감성 분석 + 브랜드 이미지 */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {(s.positive || s.neutral || s.negative) > 0 && (
            <Card title="감성 분석" sub="SENTIMENT ANALYSIS">
              <div className="flex flex-wrap items-center gap-8">
                <SentimentDonut positive={s.positive} neutral={s.neutral} negative={s.negative} />
                <ul className="space-y-2 text-sm">
                  <Legend color="#3e8e41" label="긍정 (Positive)" value={s.positive} />
                  <Legend color="#9aa0a6" label="중립 (Neutral)" value={s.neutral} />
                  <Legend color="#e14b5a" label="부정 (Negative)" value={s.negative} />
                </ul>
              </div>
              {report.sentimentNote && (
                <p className="mt-4 text-sm text-ink-700">{report.sentimentNote}</p>
              )}
            </Card>
          )}

          {report.brandKeywords.length > 0 && (
            <Card title="브랜드 이미지" sub="KEYWORDS">
              <div className="space-y-2.5">
                {report.brandKeywords.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-green-100/60 px-4 py-2.5">
                    <span className="font-display text-lg">{b.label}</span>
                    <span className="text-sm text-ink-500">{b.sub}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* 표현 */}
        {report.expressions.length > 0 && (
          <Card title="관광객이 자주 사용하는 표현" sub="VOICE OF CUSTOMER">
            <div className="flex flex-wrap gap-2">
              {report.expressions.map((e, i) => (
                <span key={i} className="rounded-full bg-white border border-line px-3.5 py-2 text-sm text-ink-700 shadow-[var(--shadow-card)]">
                  “{e}”
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 장점 / 아쉬운 점 */}
        {(report.pros.length > 0 || report.cons.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {report.pros.length > 0 && (
              <Card title="장점" sub="STRENGTHS" accent="green">
                <RankList items={report.pros} icon={<ThumbsUp size={14} />} tone="green" />
              </Card>
            )}
            {report.cons.length > 0 && (
              <Card title="아쉬운 점" sub="WEAKNESSES" accent="rose">
                <RankList items={report.cons} icon={<AlertTriangle size={14} />} tone="rose" />
              </Card>
            )}
          </div>
        )}

        {/* SWOT */}
        {(report.swot.strength || report.swot.weakness || report.swot.possibility || report.swot.opportunity) && (
          <Card title="기회 인사이트" sub="OPPORTUNITY INSIGHT">
            <div className="grid gap-4 sm:grid-cols-2">
              <Swot icon={<TrendingUp size={18} />} title="강점" en="Strength" body={report.swot.strength} tone="green" />
              <Swot icon={<AlertTriangle size={18} />} title="약점" en="Weakness" body={report.swot.weakness} tone="rose" />
              <Swot icon={<Lightbulb size={18} />} title="확장 가능성" en="Possibility" body={report.swot.possibility} tone="sky" />
              <Swot icon={<Gift size={18} />} title="관광상품 기회" en="Opportunity" body={report.swot.opportunity} tone="brown" />
            </div>
            {report.strategyKeywords.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink-700">핵심 전략:</span>
                {report.strategyKeywords.map((t, i) => (
                  <span key={i} className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Card>
        )}
      </Container>

      {/* AI 종합 인사이트 & 최종 요약 */}
      {(report.aiInsight || report.brandOneLiner || report.audiencePerception) && (
        <section className="bg-green-800 text-green-100">
          <Container className="py-12">
            <p className="text-center font-display text-2xl text-white flex items-center justify-center gap-2">
              <Sparkles size={20} /> AI 종합 인사이트 &amp; 최종 요약
            </p>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {report.aiInsight && (
                <div>
                  <h3 className="mb-2 font-display text-lg text-white">AI 종합 인사이트</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-green-100/90">
                    {report.aiInsight}
                  </p>
                </div>
              )}
              <div className="text-center">
                {report.brandOneLiner && (
                  <>
                    <h3 className="mb-2 font-display text-lg text-white">한 줄 브랜딩</h3>
                    <p className="font-display text-xl leading-snug text-white">
                      “{report.brandOneLiner}”
                    </p>
                  </>
                )}
                {report.coreValues.length > 0 && (
                  <div className="mt-5 flex justify-center gap-4">
                    {report.coreValues.map((v, i) => (
                      <div key={i} className="rounded-2xl bg-white/10 px-4 py-3">
                        <ShieldCheck size={18} className="mx-auto mb-1" />
                        <p className="font-bold text-white text-sm">{v.label}</p>
                        <p className="text-[11px] text-green-100/70">{v.sub}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {report.audiencePerception && (
                <div>
                  <h3 className="mb-2 font-display text-lg text-white">관광객 인식</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-green-100/90">
                    {report.audiencePerception}
                  </p>
                </div>
              )}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

const KEYWORD_COLORS = ["#2f6b33", "#e14b5a", "#3e8e41", "#0288d1", "#8a5d45", "#5c6bc0", "#4caf50"];

function Card({
  title,
  sub,
  accent,
  children,
}: {
  title: string;
  sub?: string;
  accent?: "green" | "rose";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-baseline gap-2 border-b border-line pb-2">
        <h2 className={`font-display text-xl ${accent === "rose" ? "text-[var(--accent)]" : "text-green-800"}`}>
          {title}
        </h2>
        {sub && <span className="text-[11px] font-bold tracking-wider text-ink-500">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(Math.max(score, 0), 100) / 100);
  const stars = Math.round((score / 100) * 5);
  return (
    <div className="text-center">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e6e2d6" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="#2f6b33" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 grid place-content-center">
          <span className="font-display text-4xl text-green-800">{score}</span>
          <span className="text-center text-[11px] text-ink-500">/ 100</span>
        </div>
      </div>
      <p className="mt-1 text-sm text-amber-500" aria-label={`5점 만점에 ${stars}점`}>
        {"★".repeat(stars)}
        <span className="text-line">{"★".repeat(5 - stars)}</span>
      </p>
    </div>
  );
}

function SentimentDonut({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative || 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  const seg = (v: number) => (v / total) * c;
  const pos = seg(positive);
  const neu = seg(neutral);
  const neg = seg(negative);
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e6e2d6" strokeWidth="18" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#3e8e41" strokeWidth="18" strokeDasharray={`${pos} ${c - pos}`} strokeDashoffset={0} />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#9aa0a6" strokeWidth="18" strokeDasharray={`${neu} ${c - neu}`} strokeDashoffset={-pos} />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e14b5a" strokeWidth="18" strokeDasharray={`${neg} ${c - neg}`} strokeDashoffset={-(pos + neu)} />
    </svg>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="text-ink-700">{label}</span>
      <span className="font-display text-lg" style={{ color }}>{value}%</span>
    </li>
  );
}

function RankList({ items, icon, tone }: { items: string[]; icon: React.ReactNode; tone: "green" | "rose" }) {
  return (
    <ol className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          <span className={`mt-0.5 shrink-0 ${tone === "rose" ? "text-[var(--accent)]" : "text-green-600"}`}>{icon}</span>
          <span className="text-ink-700">
            <b className="text-ink-500">{i + 1}.</b> {it}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Swot({ icon, title, en, body, tone }: { icon: React.ReactNode; title: string; en: string; body: string; tone: "green" | "rose" | "sky" | "brown" }) {
  const tones = {
    green: "bg-green-100/70 text-green-800",
    rose: "bg-[var(--accent-soft)] text-[var(--accent)]",
    sky: "bg-sky-100 text-sky-800",
    brown: "bg-brown-100 text-brown-600",
  } as const;
  if (!body) return null;
  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="flex items-center gap-2 font-display text-lg">
        {icon} {title} <span className="text-xs opacity-70">{en}</span>
      </p>
      <p className="mt-1.5 text-sm text-ink-700 whitespace-pre-line">{body}</p>
    </div>
  );
}
