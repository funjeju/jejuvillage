"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { productInputSchema } from "@/lib/schemas";
import { createProduct, updateProduct } from "@/lib/repo/client";
import type { UploadedImage } from "@/lib/firebase/storage";
import type { Product, TimelineItem } from "@/lib/types";
import { useAdmin } from "@/lib/admin/admin-context";

export function ProductEditor({
  product,
  onDone,
  onCancel,
}: {
  product: Product | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { village } = useAdmin();
  const [title, setTitle] = useState(product?.title ?? "");
  const [concept, setConcept] = useState(product?.concept ?? "");
  const [hook, setHook] = useState(product?.hook ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [durationMin, setDurationMin] = useState(String(product?.durationMin ?? ""));
  const [capacityMin, setCapacityMin] = useState(String(product?.capacityMin ?? 2));
  const [capacityMax, setCapacityMax] = useState(String(product?.capacityMax ?? 10));
  const [includes, setIncludes] = useState(product?.includes ?? "");
  const [excludes, setExcludes] = useState(product?.excludes ?? "");
  const [notice, setNotice] = useState(product?.notice ?? "");
  const [seasonal, setSeasonal] = useState(product?.seasonal ?? false);
  const [timeline, setTimeline] = useState<TimelineItem[]>(product?.timeline ?? []);
  const [images, setImages] = useState<UploadedImage[]>(
    (product?.images ?? []).map((i) => ({
      assetId: i.assetId,
      url: i.url,
      thumbUrl: i.thumbUrl,
      width: 0,
      height: 0,
    }))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(status: "draft" | "published") {
    setError(null);
    const parsed = productInputSchema.safeParse({
      title,
      concept,
      hook,
      price,
      durationMin,
      capacityMin,
      capacityMax,
      timeline: timeline.filter((t) => t.time || t.desc),
      includes,
      excludes,
      notice,
      images: images.map((i) => ({ assetId: i.assetId, url: i.url, thumbUrl: i.thumbUrl })),
      seasonal,
      status,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      if (product) {
        await updateProduct(village.id, product.id, parsed.data);
      } else {
        await createProduct({ id: village.id, slug: village.slug, name: village.name }, parsed.data);
      }
      onDone();
    } catch (e) {
      setError((e as Error).message || "저장에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <h2 className="font-display text-xl mb-4">{product ? "체험상품 수정" : "새 체험상품"}</h2>
      <div className="space-y-4">
        <div>
          <label className={adminLabel}>대표 사진</label>
          <ImageUploader villageId={village.id} folder="products" value={images} onChange={setImages} max={8} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="상품명" value={title} onChange={setTitle} placeholder="조수리 빌레 지질트레킹" />
          <Field label="한줄 컨셉" value={concept} onChange={setConcept} placeholder="480년 팽나무 아래를 걷는 느린 여행" />
        </div>

        <div>
          <label className={adminLabel}>스토리 훅</label>
          <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={3} className={adminField} placeholder="이 체험만의 매력을 이야기로 풀어주세요." />
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="1인 가격(원)" type="number" value={price} onChange={setPrice} placeholder="25000" />
          <Field label="소요시간(분)" type="number" value={durationMin} onChange={setDurationMin} placeholder="150" />
          <Field label="최소 정원" type="number" value={capacityMin} onChange={setCapacityMin} />
          <Field label="최대 정원" type="number" value={capacityMax} onChange={setCapacityMax} />
        </div>

        {/* 타임라인 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${adminLabel} mb-0`}>체험 구성 (타임라인)</label>
            <button
              type="button"
              onClick={() => setTimeline([...timeline, { time: "", desc: "" }])}
              className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"
            >
              <Plus size={15} /> 순서 추가
            </button>
          </div>
          <div className="space-y-2">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={t.time}
                  onChange={(e) => setTimeline(timeline.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
                  placeholder="0:00"
                  className={`${adminField} w-24 shrink-0`}
                />
                <input
                  value={t.desc}
                  onChange={(e) => setTimeline(timeline.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))}
                  placeholder="빌레용암 위 걷기"
                  className={adminField}
                />
                <button
                  type="button"
                  onClick={() => setTimeline(timeline.filter((_, j) => j !== i))}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink-500 hover:text-[var(--accent)]"
                  aria-label="삭제"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={adminLabel}>포함사항</label>
            <textarea value={includes} onChange={(e) => setIncludes(e.target.value)} rows={3} className={adminField} placeholder="전문 해설사, 다과, 보험" />
          </div>
          <div>
            <label className={adminLabel}>불포함사항</label>
            <textarea value={excludes} onChange={(e) => setExcludes(e.target.value)} rows={3} className={adminField} placeholder="개인 장비, 중식" />
          </div>
        </div>

        <div>
          <label className={adminLabel}>유의사항 · 취소/환불 규정</label>
          <textarea value={notice} onChange={(e) => setNotice(e.target.value)} rows={3} className={adminField} placeholder="우천 시 일정 변경될 수 있어요. 3일 전 취소 시 전액 환불." />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={seasonal} onChange={(e) => setSeasonal(e.target.checked)} className="h-4 w-4 accent-green-700" />
          시즌 한정 상품 (예: 장미철 5~6월)
        </label>

        {error && (
          <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => save("published")} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            게시하기
          </Button>
          <Button onClick={() => save("draft")} variant="soft" disabled={busy}>
            임시저장
          </Button>
          <Button onClick={onCancel} variant="ghost" disabled={busy}>
            취소
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className={adminLabel}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={adminField} />
    </div>
  );
}
