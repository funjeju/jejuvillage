"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Music, ImagePlus } from "lucide-react";
import { adminField, adminLabel } from "@/components/admin/ui";
import { uploadImageTo, uploadAudio } from "@/lib/firebase/storage";

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
  const heroRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLInputElement>(null);
  const bgmRef = useRef<HTMLInputElement>(null);

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

      {/* 대표 이미지 */}
      <div>
        <label className={adminLabel}>대표(히어로) 이미지</label>
        <div className="flex items-center gap-4">
          <UploadThumb url={value.heroUrl} ratio="h-24 w-40" onClick={() => heroRef.current?.click()} loading={uploading === "hero"} />
          <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage("hero", e.target.files?.[0])} />
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
