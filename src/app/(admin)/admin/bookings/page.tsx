"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, Check, X, RotateCcw } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenBookings, updateBookingStatus } from "@/lib/repo/client";
import type { Booking, BookingStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const STATUS_META: Record<BookingStatus, { label: string; tone: "green" | "accent" | "sky" | "neutral" }> = {
  REQUESTED: { label: "신청", tone: "accent" },
  CONFIRMED: { label: "확정", tone: "green" },
  REJECTED: { label: "거절", tone: "neutral" },
  CANCELED: { label: "취소", tone: "neutral" },
};

const FILTERS: { key: BookingStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "REQUESTED", label: "신청" },
  { key: "CONFIRMED", label: "확정" },
  { key: "REJECTED", label: "거절" },
  { key: "CANCELED", label: "취소" },
];

export default function AdminBookingsPage() {
  const { village } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return listenBookings(village.id, setBookings);
  }, [village.id]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: bookings.length };
    bookings.forEach((b) => (c[b.status] = (c[b.status] ?? 0) + 1));
    return c;
  }, [bookings]);

  const list = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <PageTitle title="예약 관리" desc="신청을 확인하고 확정 또는 거절하세요." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f.key ? "bg-green-700 text-white" : "bg-white border border-line text-ink-700 hover:bg-green-100"
            )}
          >
            {f.label} {counts[f.key] ? `(${counts[f.key]})` : ""}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid gap-3">
          {list.map((b) => {
            const meta = STATUS_META[b.status];
            return (
              <Panel key={b.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <h3 className="font-display text-lg truncate">{b.productTitle}</h3>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
                      <span>📅 {b.date}</span>
                      <span>👥 {b.headcount}인</span>
                      <span className="font-semibold">{b.applicantName}</span>
                      <a href={`tel:${b.applicantPhone}`} className="inline-flex items-center gap-1 text-green-700 hover:underline">
                        <Phone size={13} /> {b.applicantPhone}
                      </a>
                    </div>
                    {b.memo && <p className="mt-1.5 rounded-lg bg-cream-100 px-3 py-1.5 text-sm text-ink-700">{b.memo}</p>}
                    <p className="mt-1 text-xs text-ink-500">{timeAgo(b.createdAt)} 신청</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {b.status === "REQUESTED" && (
                      <>
                        <ActionBtn tone="green" onClick={() => updateBookingStatus(village.id, b.id, "CONFIRMED")}>
                          <Check size={15} /> 확정
                        </ActionBtn>
                        <ActionBtn tone="muted" onClick={() => updateBookingStatus(village.id, b.id, "REJECTED")}>
                          <X size={15} /> 거절
                        </ActionBtn>
                      </>
                    )}
                    {(b.status === "CONFIRMED" || b.status === "REJECTED") && (
                      <ActionBtn tone="muted" onClick={() => updateBookingStatus(village.id, b.id, "REQUESTED")}>
                        <RotateCcw size={15} /> 신청상태로
                      </ActionBtn>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel className="py-16 text-center text-ink-500">
          {filter === "ALL" ? "아직 예약 신청이 없어요." : "해당 상태의 예약이 없어요."}
        </Panel>
      )}
    </div>
  );
}

function ActionBtn({
  tone,
  onClick,
  children,
}: {
  tone: "green" | "muted";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
        tone === "green"
          ? "bg-green-700 text-white hover:bg-green-800"
          : "border border-line text-ink-700 hover:bg-black/5"
      )}
    >
      {children}
    </button>
  );
}
