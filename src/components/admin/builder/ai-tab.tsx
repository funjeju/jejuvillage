"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, Wand2 } from "lucide-react";
import { adminField } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { applyGeneratedHomepage } from "@/lib/repo/client";

interface Generated {
  oneLiner: string;
  stories: { sectionKey: string; title: string; body: string }[];
  mascotName: string;
  mascotDesc: string;
  colorAccent: string;
  source: "ai" | "heuristic";
}

/**
 * AI 자동 구성 탭 — 마을 정보 원문을 붙여넣으면 홈페이지 콘텐츠로 구성한다.
 */
export function AiTab({
  villageId,
  villageName,
  onApplied,
}: {
  villageId: string;
  villageName: string;
  onApplied: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Generated | null>(null);

  async function generate() {
    setError(null);
    setDone(false);
    setResult(null);
    if (raw.trim().length < 20) {
      setError("마을 정보를 20자 이상 입력해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, villageName, rawText: raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "구성 실패");
      setResult(data.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!result) return;
    setApplying(true);
    try {
      await applyGeneratedHomepage(villageId, result);
      setDone(true);
      onApplied();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-green-100 to-sky-100 p-4">
        <p className="flex items-center gap-2 font-display text-lg">
          <Wand2 size={18} className="text-green-700" /> 마을 정보로 홈페이지 자동 구성
        </p>
        <p className="mt-1 text-sm text-ink-700">
          마을 소개·역사·설화·자원·특산물 등을 아는 대로 통째로 붙여넣으면, 한줄 소개와
          이야기 섹션·마스코트·강조색을 자동으로 만들어요. 결과는 미리 보고 적용해요.
        </p>
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder="예) 조수리는 물이 귀해 주민들이 직접 물통을 파 식수를 마련한 데서 이름이 유래했다. 파호이호이 빌레용암 사장밭, 480년 팽나무 당산나무, 봄철 장미돌담길이 유명하다..."
        className={adminField}
      />

      <div className="flex items-center gap-3">
        <Button onClick={generate} disabled={busy} size="lg">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {busy ? "구성 중…" : "자동 구성하기"}
        </Button>
        {result && (
          <span className="text-xs text-ink-500">
            {result.source === "ai" ? "AI 구성 결과예요." : "간단 구성 결과예요(AI 키 미설정)."}
          </span>
        )}
      </div>

      {error && <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>}

      {result && (
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="mb-3 font-display text-lg">구성 미리보기</p>

          <div className="space-y-3 text-sm">
            <Field label="한줄 소개" value={result.oneLiner} />
            {result.stories.map((s) => (
              <div key={s.sectionKey}>
                <p className="font-semibold text-ink-900">{s.title || s.sectionKey}</p>
                <p className="whitespace-pre-line text-ink-700">{s.body}</p>
              </div>
            ))}
            {result.mascotName && <Field label="마스코트" value={`${result.mascotName} — ${result.mascotDesc}`} />}
            <div className="flex items-center gap-2">
              <span className="text-ink-500">강조색</span>
              <span className="inline-block h-5 w-5 rounded-full border" style={{ background: result.colorAccent }} />
              <code className="text-xs">{result.colorAccent}</code>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={apply} disabled={applying} variant="accent">
              {applying ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              이대로 적용하기
            </Button>
            {done && <span className="text-sm font-semibold text-green-700">적용됐어요! 미리보기로 확인해 보세요.</span>}
          </div>
          <p className="mt-2 text-xs text-ink-500">
            적용하면 한줄 소개·이야기 섹션·마스코트 정보가 채워져요. 이미지는 [디자인] 탭에서 올려주세요.
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-ink-500">{label}</span>
      <p className="text-ink-900">{value || "-"}</p>
    </div>
  );
}
