"use client";

import { useState } from "react";
import { Loader2, Wand2, ExternalLink, Globe } from "lucide-react";
import type { AdminVillage } from "@/lib/admin/admin-context";
import { PageTitle, Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import type { LandingBlueprint } from "@/lib/types";

/**
 * 참조 URL → AI 랜딩페이지 생성 콘솔.
 * 참조 사이트의 스크린샷을 비전 AI가 분석해 마을 자료로 채운 랜딩을 만든다.
 * 대상 마을은 prop 으로 받는다(/admin 콘솔·독립 /landing 페이지 공용).
 */
export function LandingEditor({ village }: { village: AdminVillage }) {
  const [refUrl, setRefUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LandingBlueprint | null>(null);

  async function generate() {
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId: village.id, refUrl: refUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "생성 실패");
      setResult(data.data as LandingBlueprint);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle
        title="랜딩페이지 만들기"
        desc="참조할 랜딩페이지 주소를 넣으면, AI가 그 디자인 감각을 분석해 우리 마을 자료로 채운 랜딩을 생성합니다."
        action={
          <ButtonLink
            href={`/v/${village.slug}/landing`}
            target="_blank"
            variant="outline"
            size="sm"
          >
            <ExternalLink size={16} /> 랜딩 미리보기
          </ButtonLink>
        }
      />

      <Panel>
        <label className={adminLabel} htmlFor="refUrl">
          참조 랜딩페이지 URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Globe
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              id="refUrl"
              type="url"
              inputMode="url"
              placeholder="https://example.com"
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              className={`${adminField} pl-10`}
              disabled={busy}
            />
          </div>
          <Button onClick={generate} disabled={busy || !refUrl.trim()}>
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 생성 중…
              </>
            ) : (
              <>
                <Wand2 size={18} /> 랜딩 생성
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          스크린샷 캡처 + AI 분석에 20~60초 정도 걸릴 수 있어요.
        </p>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </Panel>

      {result && (
        <Panel className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl">생성 완료 🎉</h2>
            <ButtonLink
              href={`/v/${village.slug}/landing`}
              target="_blank"
              variant="accent"
              size="sm"
            >
              <ExternalLink size={16} /> 랜딩 열기
            </ButtonLink>
          </div>

          {result.designNote && (
            <p className="mt-3 text-sm text-ink-600">{result.designNote}</p>
          )}

          {/* 팔레트 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["배경", result.palette.bg],
                ["글자", result.palette.text],
                ["강조", result.palette.accent],
                ["주색", result.palette.primary],
              ] as const
            ).map(([label, hex]) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs"
              >
                <span
                  className="inline-block h-4 w-4 rounded-full border border-black/10"
                  style={{ backgroundColor: hex }}
                />
                {label} {hex}
              </div>
            ))}
          </div>

          {/* 섹션 순서 */}
          <div className="mt-4">
            <div className={adminLabel}>섹션 구성 ({result.sections.length}개)</div>
            <ol className="flex flex-wrap gap-2">
              {result.sections.map((s, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800"
                >
                  {i + 1}. {s.type}
                  {s.layout ? ` · ${s.layout}` : ""}
                </li>
              ))}
            </ol>
          </div>

          {/* 참조 스크린샷 */}
          {result.screenshotUrl && (
            <div className="mt-4">
              <div className={adminLabel}>참조 스크린샷</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.screenshotUrl}
                alt="참조 스크린샷"
                className="max-h-96 w-full rounded-xl border border-line object-cover object-top"
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
