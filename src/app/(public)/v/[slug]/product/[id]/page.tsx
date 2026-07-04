import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Users, Wallet, CalendarDays, Check, X, AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ProductGallery } from "@/components/product/product-gallery";
import { getVillageBySlug, getProduct } from "@/lib/repo/server";
import { formatPrice, formatDuration } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const village = await getVillageBySlug(slug);
  if (!village) return { title: "상품을 찾을 수 없어요" };
  const product = await getProduct(village.id, id);
  return { title: product?.title ?? "체험상품", description: product?.concept };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const village = await getVillageBySlug(slug);
  if (!village) notFound();
  const product = await getProduct(village.id, id);
  if (!product || product.status !== "published") notFound();

  return (
    <div className="pb-24">
      <Container className="py-8">
        <nav className="mb-4 text-sm text-ink-500">
          <Link href={`/v/${slug}`} className="hover:text-green-700 font-semibold">
            {product.villageName}
          </Link>
          <span className="mx-1.5">›</span>
          <span>체험</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery images={product.images} alt={product.title} />

          <div>
            {product.seasonal && <Badge tone="accent">🌹 시즌 한정</Badge>}
            <h1 className="mt-2 font-display text-3xl">{product.title}</h1>
            {product.concept && <p className="mt-2 text-ink-700">{product.concept}</p>}

            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Fact icon={<Wallet size={18} />} label="가격" value={formatPrice(product.price)} />
              <Fact icon={<Clock size={18} />} label="소요시간" value={formatDuration(product.durationMin)} />
              <Fact
                icon={<Users size={18} />}
                label="정원"
                value={`${product.capacityMin}~${product.capacityMax}인`}
              />
            </div>

            <div className="mt-4 rounded-xl bg-cream-100 border border-line/70 p-3 text-xs text-ink-700">
              <AlertTriangle size={14} className="inline mr-1 text-brown-500" />
              가격은 세금 포함 여부·취소환불 규정이 마을마다 다를 수 있어요. 최종 확인은
              마을에 문의해 주세요.
            </div>

            <div className="mt-5 hidden md:block">
              <ButtonLink
                href={`/v/${slug}/product/${id}/book`}
                variant="accent"
                size="lg"
                className="w-full"
              >
                <CalendarDays size={20} /> 예약 신청하기
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* 스토리 훅 */}
        {product.hook && (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-display text-2xl">이런 경험이에요</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-700">{product.hook}</p>
          </section>
        )}

        {/* 타임라인 */}
        {product.timeline.length > 0 && (
          <section className="mt-10 max-w-3xl">
            <h2 className="font-display text-2xl">체험 구성</h2>
            <ol className="mt-4 space-y-3">
              {product.timeline.map((t, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-16 text-right font-display text-green-700">
                    {t.time}
                  </span>
                  <span className="relative flex-1 border-l-2 border-green-300 pl-4 pb-1 text-ink-700">
                    {t.desc}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 포함/불포함 */}
        {(product.includes || product.excludes) && (
          <section className="mt-10 grid gap-5 sm:grid-cols-2 max-w-3xl">
            {product.includes && (
              <div className="rounded-[var(--radius-blob)] bg-green-100/60 p-5">
                <h3 className="font-display text-lg flex items-center gap-2">
                  <Check size={18} className="text-green-700" /> 포함
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{product.includes}</p>
              </div>
            )}
            {product.excludes && (
              <div className="rounded-[var(--radius-blob)] bg-black/[0.03] p-5">
                <h3 className="font-display text-lg flex items-center gap-2">
                  <X size={18} className="text-ink-500" /> 불포함
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{product.excludes}</p>
              </div>
            )}
          </section>
        )}

        {/* 유의사항 */}
        {product.notice && (
          <section className="mt-10 max-w-3xl">
            <h2 className="font-display text-2xl">유의사항 · 취소/환불</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {product.notice}
            </p>
          </section>
        )}
      </Container>

      {/* 모바일 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur p-3 md:hidden">
        <Container className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="font-display text-lg text-[var(--accent)]">{formatPrice(product.price)}</p>
            <p className="text-[11px] text-ink-500">1인 기준</p>
          </div>
          <ButtonLink
            href={`/v/${slug}/product/${id}/book`}
            variant="accent"
            size="md"
            className="flex-1"
          >
            예약 신청
          </ButtonLink>
        </Container>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-line/70 p-3 text-center">
      <div className="flex justify-center text-green-700">{icon}</div>
      <p className="mt-1 text-[11px] text-ink-500">{label}</p>
      <p className="font-semibold text-ink-900">{value}</p>
    </div>
  );
}
