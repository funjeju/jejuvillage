"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Package, CalendarCheck, ArrowRight } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, StatCard, Panel } from "@/components/admin/ui";
import { HomepagePanel } from "@/components/admin/homepage-panel";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  listenVillageFeed,
  listenProducts,
  listenBookings,
} from "@/lib/repo/client";
import type { FeedPost, Product, Booking } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { village } = useAdmin();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const u1 = listenVillageFeed(village.id, setPosts, 100);
    const u2 = listenProducts(village.id, setProducts);
    const u3 = listenBookings(village.id, setBookings);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [village.id]);

  const requested = bookings.filter((b) => b.status === "REQUESTED").length;
  const published = products.filter((p) => p.status === "published").length;

  return (
    <div>
      <PageTitle
        title={`${village.name} 대시보드`}
        desc="한눈에 보는 마을 운영 현황이에요."
      />

      <HomepagePanel />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="소식" value={posts.length} tone="green" sub="발행된 사진 소식" />
        <StatCard
          label="체험상품"
          value={products.length}
          tone="sky"
          sub={`게시 ${published} · 임시 ${products.length - published}`}
        />
        <StatCard
          label="신규 예약"
          value={requested}
          tone="accent"
          sub={`전체 ${bookings.length}건`}
        />
        <StatCard
          label="확정 예약"
          value={bookings.filter((b) => b.status === "CONFIRMED").length}
          tone="brown"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <QuickAction href="/admin/feed" icon={<Camera />} title="사진 소식 올리기" desc="사진 한 장으로 지금의 마을을 알려요" />
        <QuickAction href="/admin/products" icon={<Package />} title="체험상품 관리" desc="상품을 등록하고 게시해요" />
        <QuickAction href="/admin/bookings" icon={<CalendarCheck />} title="예약 확인" desc={requested ? `${requested}건의 신규 신청` : "새 예약을 확인해요"} highlight={requested > 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="font-display text-lg mb-3">최근 소식</h2>
          {posts.length ? (
            <ul className="space-y-2">
              {posts.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink-700">{p.caption}</span>
                  <time className="shrink-0 text-xs text-ink-500">{timeAgo(p.publishedAt)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">아직 소식이 없어요.</p>
          )}
        </Panel>
        <Panel>
          <h2 className="font-display text-lg mb-3">신규 예약 신청</h2>
          {bookings.filter((b) => b.status === "REQUESTED").length ? (
            <ul className="space-y-2">
              {bookings
                .filter((b) => b.status === "REQUESTED")
                .slice(0, 5)
                .map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink-700">
                      {b.productTitle} · {b.applicantName} ({b.headcount}인)
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">{b.date}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">새 예약 신청이 없어요.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  desc,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-[var(--radius-blob)] border p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 ${
        highlight ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-line/80 bg-white"
      }`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-700 text-white">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-display text-lg">{title}</span>
        <span className="block text-sm text-ink-500">{desc}</span>
      </span>
      <ArrowRight className="text-ink-500 group-hover:translate-x-1 transition-transform" size={18} />
    </Link>
  );
}
