import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/card";
import type { VillageSummary } from "@/lib/types";

export function VillageCard({ village }: { village: VillageSummary }) {
  return (
    <Link
      href={`/v/${village.slug}`}
      className="group block rounded-[var(--radius-blob)] bg-white border border-line/80 shadow-[var(--shadow-card)] overflow-hidden hover:-translate-y-1 transition-transform"
      style={
        village.accentColor
          ? ({ ["--accent" as string]: village.accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <div className="relative aspect-[16/10] bg-green-100">
        {village.heroUrl ? (
          <Image
            src={village.heroUrl}
            alt={village.name}
            fill
            sizes="(max-width:640px) 100vw, 380px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="grid h-full place-items-center font-display text-3xl text-green-700/30">
            {village.name}
          </div>
        )}
        {village.isLive && (
          <span className="absolute top-3 left-3">
            <Badge tone="accent">🟢 새 소식</Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <MapPin size={12} /> {village.region}
        </div>
        <h3 className="mt-1 font-display text-xl">{village.name}</h3>
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">{village.oneLiner}</p>
      </div>
    </Link>
  );
}
