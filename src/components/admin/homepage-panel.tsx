"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Eye,
  Rocket,
  EyeOff,
  Copy,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listenVillage, updateVillageStatus } from "@/lib/repo/client";

/**
 * "내 홈페이지" 패널.
 * 이 플랫폼의 홈페이지는 데이터 주입형 템플릿이라, 마을 정보를 채우면
 * /v/{slug} 에 자동 렌더된다. 이 패널에서 상태 확인·미리보기·게시를 한다.
 */
export function HomepagePanel() {
  const { village } = useAdmin();
  const [status, setStatus] = useState<"draft" | "published" | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return listenVillage(village.id, (d) => setStatus(d?.status ?? "draft"));
  }, [village.id]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/v/${village.slug}`;
  const isPublished = status === "published";

  async function togglePublish() {
    setBusy(true);
    try {
      await updateVillageStatus(village.id, isPublished ? "draft" : "published");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-[var(--radius-blob)] border border-line/80 bg-gradient-to-br from-green-100 to-cream-50 shadow-[var(--shadow-card)]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-green-700" />
              <h2 className="font-display text-xl">내 마을 홈페이지</h2>
              {status === null ? (
                <Badge tone="neutral">확인 중…</Badge>
              ) : isPublished ? (
                <Badge tone="green">🟢 게시중 (누구나 볼 수 있어요)</Badge>
              ) : (
                <Badge tone="neutral">준비중 (아직 비공개)</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-700">
              마을 정보·테마·소식·상품을 채우면 홈페이지가 자동으로 만들어져요.
              완성되면 <b>게시</b>해서 공개하세요.
            </p>
          </div>
        </div>

        {/* 주소 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
            <Globe size={15} className="shrink-0 text-ink-500" />
            <span suppressHydrationWarning className="truncate text-sm text-ink-700">
              {url}
            </span>
            <button
              onClick={copy}
              className="ml-auto shrink-0 text-ink-500 hover:text-green-700"
              aria-label="주소 복사"
            >
              {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* 액션 */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/v/${village.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border-2 border-green-700 bg-white/70 px-5 py-2.5 font-display font-semibold text-green-800 hover:bg-green-100"
          >
            <Eye size={18} /> 미리보기
          </Link>

          <Button onClick={togglePublish} disabled={busy || status === null} variant={isPublished ? "outline" : "accent"} size="md">
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPublished ? (
              <EyeOff size={18} />
            ) : (
              <Rocket size={18} />
            )}
            {isPublished ? "비공개로 전환" : "홈페이지 게시하기"}
          </Button>

          {isPublished && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              공개된 홈 열기 <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>

      {/* 준비중일 때 채우기 안내 */}
      {status === "draft" && (
        <div className="border-t border-line/70 bg-white/60 px-5 py-3">
          <p className="text-xs font-semibold text-ink-500 mb-2">홈페이지 완성 체크리스트</p>
          <div className="flex flex-wrap gap-2">
            <StepLink href="/admin/village" label="① 마을 정보" />
            <StepLink href="/admin/homepage" label="② 홈페이지 만들기" />
            <StepLink href="/admin/feed" label="③ 소식 올리기" />
            <StepLink href="/admin/products" label="④ 체험상품" />
          </div>
        </div>
      )}
    </div>
  );
}

function StepLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-green-600 hover:text-green-700"
    >
      {label}
    </Link>
  );
}
