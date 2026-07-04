import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/section";
import { BookingForm } from "@/components/booking/booking-form";
import { getVillageBySlug, getProduct } from "@/lib/repo/server";
import { formatPrice, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "예약 신청" };

export default async function BookPage({
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
    <Container className="py-10 max-w-2xl">
      <h1 className="font-display text-3xl mb-1">예약 신청</h1>
      <p className="text-ink-500 mb-6">{product.villageName}</p>

      <div className="mb-6 flex items-center gap-4 rounded-[var(--radius-blob)] bg-green-100/60 p-4">
        <div>
          <p className="font-display text-lg">{product.title}</p>
          <p className="text-sm text-ink-500">
            {formatPrice(product.price)} · {formatDuration(product.durationMin)} ·{" "}
            {product.capacityMin}~{product.capacityMax}인
          </p>
        </div>
      </div>

      <BookingForm
        villageId={village.id}
        slug={slug}
        productId={product.id}
        productTitle={product.title}
        price={product.price}
        capacityMin={product.capacityMin}
        capacityMax={product.capacityMax}
      />
    </Container>
  );
}
