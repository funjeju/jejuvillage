"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Music, ImagePlus, Sparkles, Wand2, ScanFace, ImageIcon } from "lucide-react";
import { adminField, adminLabel } from "@/components/admin/ui";
import {
  uploadImageTo,
  uploadAudio,
  cropAndUploadMascot,
  fileToBase64,
} from "@/lib/firebase/storage";

export interface DesignState {
  colorPrimary: string;
  colorAccent: string;
  colorBg: string;
  heroUrl: string | null;
  mascotUrl: string | null;
  mascotName: string;
  mascotDesc: string;
  bgmUrl: string | null;
  bgmLoop: boolean;
}

const PRESETS = [
  { label: "감성·따뜻", primary: "#3e8e41", accent: "#e14b5a", bg: "#fffdf5" },
  { label: "깔끔·정보", primary: "#2f6b33", accent: "#0288d1", bg: "#ffffff" },
  { label: "트렌디·MZ", primary: "#5c6bc0", accent: "#ff7043", bg: "#faf7ff" },
];
const AUDIO_MAX_MB = 8;

export function DesignTab({
  villageId,
  value,
  onChange,
}: {
  villageId: string;
  value: DesignState;
  onChange: (patch: Partial<DesignState>) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState<null | "hero" | "mascot">(null);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetMsg, setSheetMsg] = useState<string | null>(null);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [mascotVisual, setMascotVisual] = useState("");
  const heroRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);
  const bgmRef = useRef<HTMLInputElement>(null);

  /** 마스코트 캐릭터 시트 → Vision 분석 → 단독 캐릭터 AI 생성(실패 시 시트 크롭) → 자동 채움 */
  async function pickSheet(file?: File) {
    if (!file) return;
    setError(null);
    setSheetMsg(null);
    setSheetBusy(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/admin/analyze-mascot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, imageBase64: base64, mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "시트 분석 실패");
      const a = data.data as {
        mascotName: string;
        mascotDesc: string;
        accentColor: string;
        cropBox: { x: number; y: number; w: number; h: number };
        visualPrompt: string;
      };
      setMascotVisual(a.visualPrompt);

      // 1) 시트를 '참조 이미지'로 넣어 gpt-image-2가 원본에 충실한 단독 캐릭터 생성 (image-to-image)
      let mascotUrl: string | null = null;
      try {
        const gen = await fetch("/api/admin/generate-asset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            villageId,
            kind: "mascot",
            prompt: a.visualPrompt || "this village mascot character, single full-body figure",
            refImageBase64: base64,
            refMediaType: mediaType,
          }),
        });
        const gd = await gen.json();
        if (gen.ok && gd.url) mascotUrl = gd.url;
      } catch {
        /* 생성 실패 시 크롭 폴백 */
      }
      // 2) 폴백: 시트에서 대표 포즈만 크롭
      if (!mascotUrl) {
        const up = await cropAndUploadMascot(villageId, file, a.cropBox);
        mascotUrl = up.url;
      }

      onChange({
        mascotUrl,
        mascotName: a.mascotName || value.mascotName,
        mascotDesc: a.mascotDesc || value.mascotDesc,
        colorAccent: a.accentColor || value.colorAccent,
      });
      setSheetMsg(
        `“${a.mascotName || "마스코트"}” 인식 완료! 단독 캐릭터를 만들어 마스코트로 설정하고 이름·소개·강조색을 채웠어요. 저장을 눌러 반영하세요.`
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSheetBusy(false);
    }
  }

  /** 마을 성격 + 마스코트로 대표 배너 자동 생성 */
  async function generateBanner() {
    setError(null);
    setBannerBusy(true);
    try {
      const res = await fetch("/api/admin/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, mascotVisual: mascotVisual || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "배너 생성 실패");
      onChange({ heroUrl: data.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBannerBusy(false);
    }
  }

  async function generate(kind: "hero" | "mascot") {
    setError(null);
    if (aiPrompt.trim().length < 4) {
      setError("생성할 이미지를 한 줄로 설명해 주세요.");
      return;
    }
    setAiBusy(kind);
    try {
      const res = await fetch("/api/admin/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, prompt: aiPrompt, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "이미지 생성 실패");
      onChange(kind === "hero" ? { heroUrl: data.url } : { mascotUrl: data.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAiBusy(null);
    }
  }

  async function pickImage(kind: "hero" | "mascot", file?: File) {
    if (!file) return;
    setError(null);
    setUploading(kind);
    try {
      const up = await uploadImageTo(`villages/${villageId}/${kind}`, file, kind === "hero" ? 1920 : 600);
      onChange(kind === "hero" ? { heroUrl: up.url } : { mascotUrl: up.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function pickBgm(file?: File) {
    if (!file) return;
    if (file.size > AUDIO_MAX_MB * 1024 * 1024) {
      setError(`음악 파일은 최대 ${AUDIO_MAX_MB}MB까지 올릴 수 있어요.`);
      return;
    }
    setUploading("bgm");
    try {
      const { url } = await uploadAudio(villageId, file);
      onChange({ bgmUrl: url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* AI 이미지 생성 (마을 고유 배경·마스코트) */}
      <div className="rounded-2xl bg-gradient-to-br from-green-100 to-sky-100 p-4">
        <p className="flex items-center gap-2 font-display text-lg">
          <Sparkles size={18} className="text-green-700" /> AI로 마을 고유 이미지 만들기
        </p>
        <p className="mt-1 text-sm text-ink-700">
          우리 마을만의 배경화면·마스코트를 AI로 생성해요. 원하는 장면을 한 줄로 적고
          버튼을 누르면 돼요. (예: “빌레용암 위 장미 돌담길과 팽나무”)
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={2}
          placeholder="예) 봄철 장미가 핀 제주 돌담길, 480년 팽나무, 한라산이 보이는 풍경"
          className={`${adminField} mt-3`}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => generate("hero")}
            disabled={aiBusy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {aiBusy === "hero" ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            배경 생성
          </button>
          <button
            type="button"
            onClick={() => generate("mascot")}
            disabled={aiBusy !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-800 border border-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            {aiBusy === "mascot" ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            마스코트 생성
          </button>
          <span className="self-center text-xs text-ink-500">
            생성엔 몇십 초 걸려요. 결과는 아래 대표/마스코트에 자동 적용돼요.
          </span>
        </div>
      </div>

      {/* 마스코트 캐릭터 시트 자동 인식 */}
      <div className="rounded-2xl border-2 border-dashed border-green-300 bg-green-50/60 p-4">
        <p className="flex items-center gap-2 font-display text-lg">
          <ScanFace size={18} className="text-green-700" /> 마스코트 캐릭터 시트로 자동 설정
        </p>
        <p className="mt-1 text-sm text-ink-700">
          여러 포즈가 그려진 캐릭터 시트를 올리면, AI가 대표 포즈를 추출해 마스코트로 설정하고
          이름·소개·강조색까지 자동으로 채워요. 배너에도 이 마스코트를 활용해요.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => sheetRef.current?.click()}
            disabled={sheetBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {sheetBusy ? <Loader2 size={15} className="animate-spin" /> : <ScanFace size={15} />}
            {sheetBusy ? "인식 중… (몇십 초)" : "캐릭터 시트 올리기"}
          </button>
          <input
            ref={sheetRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickSheet(e.target.files?.[0])}
          />
          {sheetMsg && <span className="text-xs font-semibold text-green-700">{sheetMsg}</span>}
        </div>
      </div>

      {/* 색상 */}
      <div>
        <label className={adminLabel}>테마 색상</label>
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange({ colorPrimary: p.primary, colorAccent: p.accent, colorBg: p.bg })}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:border-green-600"
            >
              <span className="flex gap-0.5">
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.primary }} />
                <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.accent }} />
              </span>
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Color label="주색상" value={value.colorPrimary} onChange={(v) => onChange({ colorPrimary: v })} />
          <Color label="강조색" value={value.colorAccent} onChange={(v) => onChange({ colorAccent: v })} />
          <Color label="배경색" value={value.colorBg} onChange={(v) => onChange({ colorBg: v })} />
        </div>
      </div>

      {/* 대표 이미지(배너) */}
      <div>
        <label className={adminLabel}>대표 배너 이미지</label>
        <div className="flex flex-wrap items-center gap-4">
          <UploadThumb url={value.heroUrl} ratio="h-24 w-40" onClick={() => heroRef.current?.click()} loading={uploading === "hero"} />
          <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage("hero", e.target.files?.[0])} />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={generateBanner}
              disabled={bannerBusy}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {bannerBusy ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              {bannerBusy ? "배너 생성 중…" : "AI 배너 자동 생성"}
            </button>
            <span className="text-xs text-ink-500">
              마을 성격·마스코트를 반영해 배너를 만들어요. 한 장으로 PC·모바일에 맞춰 보여요.
            </span>
          </div>
        </div>
      </div>

      {/* 마스코트 */}
      <div>
        <label className={adminLabel}>마스코트</label>
        <div className="flex items-start gap-4">
          <UploadThumb url={value.mascotUrl} ratio="h-24 w-24" contain onClick={() => mascotRef.current?.click()} loading={uploading === "mascot"} />
          <input ref={mascotRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage("mascot", e.target.files?.[0])} />
          <div className="flex-1 space-y-2">
            <input
              value={value.mascotName}
              onChange={(e) => onChange({ mascotName: e.target.value })}
              placeholder="마스코트 이름 (예: 조수이)"
              className={adminField}
            />
            <textarea
              value={value.mascotDesc}
              onChange={(e) => onChange({ mascotDesc: e.target.value })}
              rows={2}
              placeholder="마스코트 한 줄 소개"
              className={adminField}
            />
          </div>
        </div>
      </div>

      {/* BGM */}
      <div>
        <label className={adminLabel}>
          <Music size={15} className="mr-1 inline" /> 배경음악 (선택)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => bgmRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-300/60"
          >
            {uploading === "bgm" ? <Loader2 size={15} className="animate-spin" /> : <Music size={15} />}
            음악 파일 (MP3)
          </button>
          <input ref={bgmRef} type="file" accept="audio/mpeg,audio/mp3,audio/aac" className="hidden" onChange={(e) => pickBgm(e.target.files?.[0])} />
          {value.bgmUrl && <audio src={value.bgmUrl} controls className="h-9" />}
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={value.bgmLoop} onChange={(e) => onChange({ bgmLoop: e.target.checked })} className="h-4 w-4 accent-green-700" />
            반복
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          ⚠️ 저작권 책임은 업로더에게 있어요. 자동재생 없이 방문자가 눌러야 재생돼요.
        </p>
      </div>

      {error && <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>}
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-ink-500 mb-1">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-7 shrink-0 cursor-pointer rounded" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-xs outline-none" />
      </div>
    </div>
  );
}

function UploadThumb({
  url,
  ratio,
  contain,
  onClick,
  loading,
}: {
  url: string | null;
  ratio: string;
  contain?: boolean;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative ${ratio} grid place-items-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-green-100 hover:border-green-600`}
    >
      {url ? (
        <Image src={url} alt="" fill sizes="160px" className={contain ? "object-contain" : "object-cover"} />
      ) : (
        <ImagePlus className="text-ink-500" />
      )}
      {loading && (
        <span className="absolute inset-0 grid place-items-center bg-white/60">
          <Loader2 className="animate-spin text-green-700" />
        </span>
      )}
    </button>
  );
}
