"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { bookingInputSchema } from "@/lib/schemas";
import { formatPrice } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition";
const label = "block text-sm font-semibold text-ink-900 mb-1.5";

export function BookingForm({
  villageId,
  slug,
  productId,
  productTitle,
  price,
  capacityMin,
  capacityMax,
}: {
  villageId: string;
  slug: string;
  productId: string;
  productTitle: string;
  price: number;
  capacityMin: number;
  capacityMax: number;
}) {
  const [headcount, setHeadcount] = useState(capacityMin);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      productId,
      date: String(fd.get("date") ?? ""),
      headcount: Number(fd.get("headcount") ?? 0),
      applicantName: String(fd.get("applicantName") ?? ""),
      applicantPhone: String(fd.get("applicantPhone") ?? ""),
      memo: String(fd.get("memo") ?? ""),
      privacyAgreed: fd.get("privacyAgreed") === "on",
    };
    const parsed = bookingInputSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, ...parsed.data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "예약 신청에 실패했어요.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-8 text-center shadow-[var(--shadow-card)]">
        <CheckCircle2 size={56} className="mx-auto text-green-600" />
        <h2 className="mt-4 font-display text-2xl">예약 신청이 접수됐어요!</h2>
        <p className="mt-2 text-ink-700">
          마을 운영자가 확인 후 연락드릴 예정이에요. 확정 전까지는 신청 상태예요.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href={`/v/${slug}`} variant="soft">
            마을 홈으로
          </ButtonLink>
          <ButtonLink href="/villages" variant="outline">
            다른 마을 보기
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-6 shadow-[var(--shadow-card)] space-y-5"
    >
      <div>
        <label className={label} htmlFor="date">
          희망 날짜
        </label>
        <input id="date" name="date" type="date" min={today} required className={field} />
      </div>

      <div>
        <label className={label} htmlFor="headcount">
          인원 ({capacityMin}~{capacityMax}인)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="headcount"
            name="headcount"
            type="number"
            min={1}
            max={capacityMax}
            value={headcount}
            onChange={(e) => setHeadcount(Number(e.target.value))}
            required
            className={field}
          />
          <span className="shrink-0 font-display text-lg text-[var(--accent)]">
            {formatPrice(price * (headcount || 0))}
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="applicantName">
            신청자 이름
          </label>
          <input id="applicantName" name="applicantName" required placeholder="홍길동" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="applicantPhone">
            연락처
          </label>
          <input
            id="applicantPhone"
            name="applicantPhone"
            type="tel"
            required
            placeholder="010-1234-5678"
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="memo">
          요청사항 (선택)
        </label>
        <textarea id="memo" name="memo" rows={3} placeholder="궁금한 점이나 요청사항을 적어주세요." className={field} />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-700">
        <input type="checkbox" name="privacyAgreed" required className="mt-0.5 h-4 w-4 accent-green-700" />
        <span>
          개인정보 수집·이용에 동의합니다. (수집 항목: 이름·연락처 / 목적: 예약 접수·안내 /
          보관: 예약 처리 후 파기)
        </span>
      </label>

      {error && (
        <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent)] font-semibold">
          {error}
        </p>
      )}

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
        {submitting ? "신청 중…" : `${productTitle} 예약 신청`}
      </Button>
      <p className="text-center text-xs text-ink-500">
        지금은 결제 없이 <b>신청</b>만 접수돼요. 마을 확정 후 안내드려요.
      </p>
    </form>
  );
}
