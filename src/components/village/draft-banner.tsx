"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Send, Check, Loader2 } from "lucide-react";

export function DraftBanner({
  villageId,
  publishRequestedAt,
}: {
  villageId: string;
  publishRequestedAt: number | null;
}) {
  const [requested, setRequested] = useState(Boolean(publishRequestedAt));
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    setLoading(true);
    try {
      await fetch("/api/admin/publish-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId }),
      });
      setRequested(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-brown-500 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Eye size={15} className="shrink-0" />
          <span className="whitespace-nowrap">사무장 전용 미리보기</span>
          <span className="hidden sm:inline text-white/70">·</span>
          <span className="hidden sm:inline text-white/80 text-xs font-normal">아직 비공개예요. 슈퍼관리자 승인 후 게시됩니다.</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin"
            className="whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25 transition-colors"
          >
            대시보드
          </Link>
          {requested ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold whitespace-nowrap">
              <Check size={13} /> 게시 요청됨
            </span>
          ) : (
            <button
              onClick={handleRequest}
              disabled={loading}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-brown-700 shadow-sm hover:bg-green-50 disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              게시 요청하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
