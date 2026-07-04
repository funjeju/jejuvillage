"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  alt,
}: {
  images: ProductImage[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-[var(--radius-blob)] bg-green-100 font-display text-2xl text-green-700/40">
        이미지 준비중
      </div>
    );
  }
  const main = images[active];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-blob)] bg-green-100">
        <Image src={main.url} alt={alt} fill priority sizes="(max-width:768px) 100vw, 640px" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.assetId}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                i === active ? "border-[var(--accent)]" : "border-transparent opacity-70"
              )}
              aria-label={`사진 ${i + 1}`}
            >
              <Image src={img.thumbUrl || img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
