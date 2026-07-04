import Link from "next/link";
import Image from "next/image";
import { Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** 체험상품 진열 카드 (S1 추천 / S3 마을홈) */
export function ProductCard({ product }: { product: Product }) {
  const img = product.images[0]?.thumbUrl ?? product.images[0]?.url;
  return (
    <Link
      href={`/v/${product.villageSlug}/product/${product.id}`}
      className="group block w-64 shrink-0 rounded-[var(--radius-blob)] bg-white border border-line/80 shadow-[var(--shadow-card)] overflow-hidden hover:-translate-y-1 transition-transform"
    >
      <div className="relative aspect-[4/3] bg-green-100">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="256px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="grid h-full place-items-center text-green-700/40 text-sm">
            이미지 준비중
          </div>
        )}
        {product.seasonal && (
          <span className="absolute top-2 left-2">
            <Badge tone="accent">🌹 시즌 한정</Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-green-700">{product.villageName}</p>
        <h3 className="mt-0.5 font-display text-lg leading-tight line-clamp-1">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-1">{product.concept}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {formatDuration(product.durationMin)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {product.capacityMin}~{product.capacityMax}인
          </span>
        </div>
        <p className="mt-2 font-display text-lg text-[var(--accent)]">
          {formatPrice(product.price)}
          <span className="text-xs text-ink-500 font-sans"> / 1인</span>
        </p>
      </div>
    </Link>
  );
}
