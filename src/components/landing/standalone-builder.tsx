"use client";

import { useState } from "react";
import { Loader2, Wand2, ExternalLink, Globe } from "lucide-react";
import { Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button, ButtonLink } from "@/components/ui/button";
import type { LandingBlueprint } from "@/lib/types";

/**
 * 마을과 무관한 독립 랜딩 빌더.
 * 이름·주소(slug)·소개·참조 URL 만으로 랜딩을 생성한다.
 */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function StandaloneBuilder() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [desc, setDesc] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LandingBlueprint | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function generate() {
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/landing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: effectiveSlug,
          name: name.trim(),
          description: desc.trim(),
          refUrl: refUrl.trim(),
        }),
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

  const canSubmit =
    !!name.trim() && !!effectiveSlug && !!refUrl.trim() && !busy;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl">랜딩페이지 만들기</h1>
        <p className="mt-1 text-sm text-ink-500">
          마을 개설 없이도 만들 수 있어요. 이름·소개·참조할 랜딩 주소만 넣으면
          AI가 그 디자인 감각으로 랜딩을 생성합니다.
        </p>
      </div>

      <Panel className="space-y-4">
        {/* 이름 */}
        <div>
          <label className={adminLabel} htmlFor="name">
            랜딩 이름
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 제주 감귤 농장"
            className={adminField}
            disabled={busy}
          />
        </div>

        {/* slug */}
        <div>
          <label className={adminLabel} htmlFor="slug">
            주소 (slug)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-400">/l/</span>
            <input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="jeju-farm"
              className={adminField}
              disabled={busy}
            />
          </div>
          <p className="mt-1 text-xs text-ink-500">
            영문 소문자·숫자·하이픈만. 이름을 한글로 쓰면 여기에 직접 영문 주소를
            넣어주세요.
          </p>
        </div>

        {/* 소개 */}
        <div>
          <label className={adminLabel} htmlFor="desc">
            소개 (선택)
          </label>
          <textarea
            id="desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="소개·특징·자원 등을 아는 대로 적어주세요. AI가 랜딩 카피로 재구성합니다."
            className={`${adminField} resize-y`}
            disabled={busy}
          />
        </div>

        {/* 참조 URL */}
        <div>
          <label className={adminLabel} htmlFor="refUrl">
            참조 랜딩페이지 URL
          </label>
          <div className="relative">
            <Globe
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              id="refUrl"
              type="url"
              inputMode="url"
              value={refUrl}
              onChange={(e) => setRefUrl(e.target.value)}
              placeholder="https://example.com"
              className={`${adminField} pl-10`}
              disabled={busy}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={generate} disabled={!canSubmit}>
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
          <span className="text-xs text-ink-500">
            스크린샷 + AI 분석에 20~60초 걸릴 수 있어요.
          </span>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </Panel>

      {result && (
        <Panel className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl">생성 완료 🎉</h2>
            <ButtonLink
              href={`/l/${result.slug}`}
              target="_blank"
              variant="accent"
              size="sm"
            >
              <ExternalLink size={16} /> 랜딩 열기
            </ButtonLink>
          </div>

          <p className="mt-2 text-sm text-ink-500">
            공개 주소: <code className="text-ink-800">/l/{result.slug}</code>
          </p>

          {result.designNote && (
            <p className="mt-3 text-sm text-ink-600">{result.designNote}</p>
          )}

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
