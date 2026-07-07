"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Save, Check, Plus, Trash2, Eye, ImagePlus } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getReportOnce, saveVillageReport } from "@/lib/repo/client";
import { uploadImageTo } from "@/lib/firebase/storage";
import type {
  ReportKeyword,
  ReportPlace,
  ReportBrandKeyword,
  ReportCoreValue,
} from "@/lib/types";

interface State {
  enabled: boolean;
  reportTitle: string;
  tagline: string;
  score: number;
  keywords: ReportKeyword[];
  topPlaces: ReportPlace[];
  positive: number;
  neutral: number;
  negative: number;
  sentimentNote: string;
  brandKeywords: ReportBrandKeyword[];
  expressions: string[];
  pros: string[];
  cons: string[];
  swotStrength: string;
  swotWeakness: string;
  swotPossibility: string;
  swotOpportunity: string;
  strategyKeywords: string[];
  aiInsight: string;
  brandOneLiner: string;
  coreValues: ReportCoreValue[];
  audiencePerception: string;
}

const EMPTY: State = {
  enabled: false,
  reportTitle: "Online Tourism Perception Report",
  tagline: "",
  score: 80,
  keywords: [],
  topPlaces: [],
  positive: 65,
  neutral: 20,
  negative: 15,
  sentimentNote: "",
  brandKeywords: [],
  expressions: [],
  pros: [],
  cons: [],
  swotStrength: "",
  swotWeakness: "",
  swotPossibility: "",
  swotOpportunity: "",
  strategyKeywords: [],
  aiInsight: "",
  brandOneLiner: "",
  coreValues: [],
  audiencePerception: "",
};

export function ReportEditor() {
  const { village } = useAdmin();
  const [st, setSt] = useState<State>(EMPTY);
  const [loaded, setLoaded] = useState(() => !isFirebaseConfigured());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getReportOnce(village.id).then((d) => {
      if (d) {
        const r = d as Record<string, unknown>;
        setSt({
          ...EMPTY,
          ...r,
          positive: (r.sentiment as State["positive"] & { positive?: number })?.positive ?? EMPTY.positive,
          neutral: (r.sentiment as { neutral?: number })?.neutral ?? EMPTY.neutral,
          negative: (r.sentiment as { negative?: number })?.negative ?? EMPTY.negative,
          swotStrength: (r.swot as { strength?: string })?.strength ?? "",
          swotWeakness: (r.swot as { weakness?: string })?.weakness ?? "",
          swotPossibility: (r.swot as { possibility?: string })?.possibility ?? "",
          swotOpportunity: (r.swot as { opportunity?: string })?.opportunity ?? "",
        } as State);
      }
      setLoaded(true);
    }).catch((e) => {
      // 리포트 문서가 없거나 규칙 미배포 등으로 실패해도 빈 폼으로 편집 가능하게
      console.warn("[report] 불러오기 실패:", (e as Error).message);
      setLoaded(true);
    });
  }, [village.id]);

  function set<K extends keyof State>(k: K, v: State[K]) {
    setSt((s) => ({ ...s, [k]: v }));
  }

  async function save(publish?: boolean) {
    setSaving(true);
    setSaved(false);
    const enabled = publish ?? st.enabled;
    try {
      await saveVillageReport(village.id, {
        enabled,
        reportTitle: st.reportTitle,
        tagline: st.tagline,
        score: Number(st.score) || 0,
        keywords: st.keywords,
        topPlaces: st.topPlaces,
        sentiment: { positive: Number(st.positive) || 0, neutral: Number(st.neutral) || 0, negative: Number(st.negative) || 0 },
        sentimentNote: st.sentimentNote,
        brandKeywords: st.brandKeywords,
        expressions: st.expressions,
        pros: st.pros,
        cons: st.cons,
        swot: { strength: st.swotStrength, weakness: st.swotWeakness, possibility: st.swotPossibility, opportunity: st.swotOpportunity },
        strategyKeywords: st.strategyKeywords,
        aiInsight: st.aiInsight,
        brandOneLiner: st.brandOneLiner,
        coreValues: st.coreValues,
        audiencePerception: st.audiencePerception,
      });
      set("enabled", enabled);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="grid place-items-center py-20 text-ink-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="마을 관광 리포트"
        desc="관광 인식 리포트 내용을 입력해요. 공개하면 마을 홈에서 관광 리포트로 볼 수 있어요."
        action={
          <div className="flex items-center gap-2">
            <a href={`/v/${village.slug}/report`} target="_blank" className="inline-flex items-center gap-1.5 rounded-full border-2 border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100">
              <Eye size={16} /> 미리보기
            </a>
            <Button onClick={() => save()} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "저장됨" : "저장"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <Panel className="space-y-4">
          <label className="flex items-center gap-2 font-semibold">
            <input type="checkbox" checked={st.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4 accent-green-700" />
            리포트 공개 (마을 홈에 관광 리포트 링크 노출)
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="리포트 제목" value={st.reportTitle} onChange={(v) => set("reportTitle", v)} />
            <div>
              <label className={adminLabel}>관광 인식 점수 (0~100)</label>
              <input type="number" min={0} max={100} value={st.score} onChange={(e) => set("score", Number(e.target.value))} className={adminField} />
            </div>
          </div>
          <div>
            <label className={adminLabel}>한 줄 부제</label>
            <input value={st.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="사계절 피어나는 꽃과 다채로운 체험이 가득한 마을" className={adminField} />
          </div>
        </Panel>

        <Section title="핵심 키워드 (워드 클라우드)">
          <KeywordEditor value={st.keywords} onChange={(v) => set("keywords", v)} />
        </Section>

        <Section title="가장 많이 언급되는 장소 TOP">
          <PlaceEditor villageId={village.id} value={st.topPlaces} onChange={(v) => set("topPlaces", v)} />
        </Section>

        <Section title="감성 분석 (%)">
          <div className="grid grid-cols-3 gap-3">
            <NumField label="긍정" value={st.positive} onChange={(v) => set("positive", v)} />
            <NumField label="중립" value={st.neutral} onChange={(v) => set("neutral", v)} />
            <NumField label="부정" value={st.negative} onChange={(v) => set("negative", v)} />
          </div>
          <textarea value={st.sentimentNote} onChange={(e) => set("sentimentNote", e.target.value)} rows={2} placeholder="감성 분석 코멘트" className={`${adminField} mt-3`} />
        </Section>

        <Section title="브랜드 이미지 키워드">
          <PairEditor value={st.brandKeywords} onChange={(v) => set("brandKeywords", v as ReportBrandKeyword[])} labelPh="플로럴" subPh="Floral" />
        </Section>

        <Section title="관광객이 자주 사용하는 표현">
          <StringListEditor value={st.expressions} onChange={(v) => set("expressions", v)} ph="막 찍어도 인생샷 건지는 곳!" />
        </Section>

        <div className="grid gap-6 md:grid-cols-2">
          <Section title="장점 TOP">
            <StringListEditor value={st.pros} onChange={(v) => set("pros", v)} ph="사계절 뚜렷한 꽃 테마" />
          </Section>
          <Section title="아쉬운 점 TOP">
            <StringListEditor value={st.cons} onChange={(v) => set("cons", v)} ph="성수기 교통 체증" />
          </Section>
        </div>

        <Section title="기회 인사이트 (SWOT)">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextArea label="강점 (Strength)" value={st.swotStrength} onChange={(v) => set("swotStrength", v)} />
            <TextArea label="약점 (Weakness)" value={st.swotWeakness} onChange={(v) => set("swotWeakness", v)} />
            <TextArea label="확장 가능성 (Possibility)" value={st.swotPossibility} onChange={(v) => set("swotPossibility", v)} />
            <TextArea label="관광상품 기회 (Opportunity)" value={st.swotOpportunity} onChange={(v) => set("swotOpportunity", v)} />
          </div>
          <div className="mt-3">
            <label className={adminLabel}>핵심 전략 방향 태그</label>
            <StringListEditor value={st.strategyKeywords} onChange={(v) => set("strategyKeywords", v)} ph="동선 연결" />
          </div>
        </Section>

        <Section title="AI 종합 인사이트 & 최종 요약">
          <TextArea label="AI 종합 인사이트" value={st.aiInsight} onChange={(v) => set("aiInsight", v)} rows={4} />
          <div className="mt-3">
            <Field label="한 줄 브랜딩" value={st.brandOneLiner} onChange={(v) => set("brandOneLiner", v)} />
          </div>
          <div className="mt-3">
            <label className={adminLabel}>핵심 가치</label>
            <PairEditor value={st.coreValues} onChange={(v) => set("coreValues", v as ReportCoreValue[])} labelPh="심미성" subPh="Aesthetic" />
          </div>
          <div className="mt-3">
            <TextArea label="관광객 인식 요약" value={st.audiencePerception} onChange={(v) => set("audiencePerception", v)} rows={3} />
          </div>
        </Section>

        <div className="flex gap-2 pb-10">
          <Button onClick={() => save(true)} disabled={saving} size="lg">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            저장하고 공개
          </Button>
          <Button onClick={() => save(false)} variant="soft" disabled={saving} size="lg">
            비공개로 저장
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── 헬퍼 ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel>
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      {children}
    </Panel>
  );
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={adminLabel}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={adminField} />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className={adminLabel}>{label}</label>
      <input type="number" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className={adminField} />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className={adminLabel}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={adminField} />
    </div>
  );
}

function RowAdd({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700">
      <Plus size={15} /> 추가
    </button>
  );
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-500 hover:text-[var(--accent)]" aria-label="삭제">
      <Trash2 size={15} />
    </button>
  );
}

function StringListEditor({ value, onChange, ph }: { value: string[]; onChange: (v: string[]) => void; ph: string }) {
  return (
    <div>
      <div className="space-y-2">
        {value.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input value={v} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} placeholder={ph} className={adminField} />
            <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <RowAdd onClick={() => onChange([...value, ""])} />
    </div>
  );
}

function KeywordEditor({ value, onChange }: { value: ReportKeyword[]; onChange: (v: ReportKeyword[]) => void }) {
  return (
    <div>
      <div className="space-y-2">
        {value.map((k, i) => (
          <div key={i} className="flex gap-2">
            <input value={k.text} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder="키워드" className={adminField} />
            <select value={k.weight} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} className={`${adminField} w-28`}>
              {[1, 2, 3, 4, 5].map((w) => (<option key={w} value={w}>크기 {w}</option>))}
            </select>
            <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <RowAdd onClick={() => onChange([...value, { text: "", weight: 3 }])} />
    </div>
  );
}

function PairEditor({ value, onChange, labelPh, subPh }: { value: { label: string; sub: string }[]; onChange: (v: { label: string; sub: string }[]) => void; labelPh: string; subPh: string }) {
  return (
    <div>
      <div className="space-y-2">
        {value.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input value={p.label} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={labelPh} className={adminField} />
            <input value={p.sub} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, sub: e.target.value } : x)))} placeholder={subPh} className={adminField} />
            <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <RowAdd onClick={() => onChange([...value, { label: "", sub: "" }])} />
    </div>
  );
}

function PlaceEditor({ villageId, value, onChange }: { villageId: string; value: ReportPlace[]; onChange: (v: ReportPlace[]) => void }) {
  const [uploading, setUploading] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickIndex = useRef<number>(0);

  async function onFile(file?: File) {
    if (!file) return;
    const i = pickIndex.current;
    setUploading(i);
    try {
      const up = await uploadImageTo(`villages/${villageId}/report`, file, 600);
      onChange(value.map((x, j) => (j === i ? { ...x, imageUrl: up.url } : x)));
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {value.map((p, i) => (
          <div key={i} className="rounded-xl border border-line p-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => { pickIndex.current = i; inputRef.current?.click(); }}
                className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-green-100 text-ink-500"
              >
                {p.imageUrl ? <Image src={p.imageUrl} alt="" fill sizes="64px" className="object-cover" /> : <ImagePlus size={18} />}
                {uploading === i && <span className="absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="animate-spin text-green-700" size={16} /></span>}
              </button>
              <div className="flex-1 space-y-2">
                <input value={p.name} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="장소명 (예: 카멜리아힐)" className={adminField} />
                <input value={p.tags} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, tags: e.target.value } : x)))} placeholder="태그 (예: 사계절 꽃 명소, 인생샷)" className={adminField} />
                <input value={p.quote} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)))} placeholder="관광객 인용" className={adminField} />
              </div>
              <DelBtn onClick={() => onChange(value.filter((_, j) => j !== i))} />
            </div>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <RowAdd onClick={() => onChange([...value, { name: "", tags: "", quote: "", imageUrl: null }])} />
    </div>
  );
}
