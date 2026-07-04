"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Save, Music, Check } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/decor/mascot";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getThemeOnce, saveTheme } from "@/lib/repo/client";
import { uploadImageTo, uploadAudio } from "@/lib/firebase/storage";
import { themeInputSchema } from "@/lib/schemas";
import type { ThemePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESETS: { key: ThemePreset; label: string; primary: string; accent: string; bg: string }[] = [
  { key: "warm", label: "감성·따뜻", primary: "#3e8e41", accent: "#e14b5a", bg: "#fffdf5" },
  { key: "clean", label: "깔끔·정보", primary: "#2f6b33", accent: "#0288d1", bg: "#ffffff" },
  { key: "trendy", label: "트렌디·MZ", primary: "#5c6bc0", accent: "#ff7043", bg: "#faf7ff" },
];
const AUDIO_MAX_MB = 8;

export default function AdminThemePage() {
  const { village } = useAdmin();
  const [presetKey, setPresetKey] = useState<ThemePreset>("warm");
  const [colorPrimary, setColorPrimary] = useState("#3e8e41");
  const [colorAccent, setColorAccent] = useState("#e14b5a");
  const [colorBg, setColorBg] = useState("#fffdf5");
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [mascotUrl, setMascotUrl] = useState<string | null>(null);
  const [mascotName, setMascotName] = useState("");
  const [mascotDesc, setMascotDesc] = useState("");
  const [bgmUrl, setBgmUrl] = useState<string | null>(null);
  const [bgmLoop, setBgmLoop] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLInputElement>(null);
  const bgmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getThemeOnce(village.id).then((t) => {
      if (!t) return;
      setPresetKey(t.presetKey);
      setColorPrimary(t.colorPrimary);
      setColorAccent(t.colorAccent);
      setColorBg(t.colorBg);
      setHeroUrl(t.heroUrl ?? null);
      setMascotUrl(t.mascotUrl ?? null);
      setMascotName(t.mascotName ?? "");
      setMascotDesc(t.mascotDesc ?? "");
      setBgmUrl(t.bgmUrl ?? null);
      setBgmLoop(t.bgmLoop);
    });
  }, [village.id]);

  function applyPreset(p: (typeof PRESETS)[number]) {
    setPresetKey(p.key);
    setColorPrimary(p.primary);
    setColorAccent(p.accent);
    setColorBg(p.bg);
  }

  async function pickImage(kind: "hero" | "mascot", file: File | undefined) {
    if (!file) return;
    setUploading(kind);
    try {
      const up = await uploadImageTo(`villages/${village.id}/${kind}`, file, kind === "hero" ? 1920 : 600);
      if (kind === "hero") setHeroUrl(up.url);
      else setMascotUrl(up.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function pickBgm(file: File | undefined) {
    if (!file) return;
    if (file.size > AUDIO_MAX_MB * 1024 * 1024) {
      setError(`음악 파일은 최대 ${AUDIO_MAX_MB}MB까지 올릴 수 있어요.`);
      return;
    }
    setUploading("bgm");
    try {
      const { url } = await uploadAudio(village.id, file);
      setBgmUrl(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setError(null);
    setSaved(false);
    const parsed = themeInputSchema.safeParse({
      presetKey,
      colorPrimary,
      colorAccent,
      colorBg,
      fontKey: "default",
      heroUrl,
      mascotUrl,
      mascotName: mascotName || null,
      mascotDesc: mascotDesc || null,
      bgmUrl,
      bgmLoop,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      await saveTheme(village.id, parsed.data);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageTitle title="테마 · 마스코트 · 음악" desc="마을 홈의 색감과 분위기를 설정해요. 오른쪽에서 미리 볼 수 있어요." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* 프리셋 */}
          <Panel>
            <h2 className="font-display text-lg mb-3">테마 프리셋</h2>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "rounded-xl border-2 p-3 text-sm font-semibold transition-all",
                    presetKey === p.key ? "border-green-600 bg-green-100" : "border-line"
                  )}
                >
                  <span className="mb-2 flex justify-center gap-1">
                    <span className="h-5 w-5 rounded-full" style={{ background: p.primary }} />
                    <span className="h-5 w-5 rounded-full" style={{ background: p.accent }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <ColorField label="주색상" value={colorPrimary} onChange={setColorPrimary} />
              <ColorField label="강조색" value={colorAccent} onChange={setColorAccent} />
              <ColorField label="배경색" value={colorBg} onChange={setColorBg} />
            </div>
          </Panel>

          {/* 대표 이미지 */}
          <Panel>
            <h2 className="font-display text-lg mb-3">대표 이미지</h2>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-40 overflow-hidden rounded-xl bg-green-100">
                {heroUrl && <Image src={heroUrl} alt="" fill sizes="160px" className="object-cover" />}
              </div>
              <div>
                <Button variant="soft" size="sm" onClick={() => heroRef.current?.click()} disabled={uploading === "hero"}>
                  {uploading === "hero" ? <Loader2 size={15} className="animate-spin" /> : null}
                  이미지 선택
                </Button>
                <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage("hero", e.target.files?.[0])} />
              </div>
            </div>
          </Panel>

          {/* 마스코트 */}
          <Panel>
            <h2 className="font-display text-lg mb-3">마스코트</h2>
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-green-100">
                {mascotUrl && <Image src={mascotUrl} alt="" fill sizes="96px" className="object-contain" />}
              </div>
              <div className="flex-1 space-y-3">
                <Button variant="soft" size="sm" onClick={() => mascotRef.current?.click()} disabled={uploading === "mascot"}>
                  {uploading === "mascot" ? <Loader2 size={15} className="animate-spin" /> : null}
                  마스코트 이미지
                </Button>
                <input ref={mascotRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickImage("mascot", e.target.files?.[0])} />
                <input value={mascotName} onChange={(e) => setMascotName(e.target.value)} placeholder="마스코트 이름 (예: 조수이)" className={adminField} />
                <textarea value={mascotDesc} onChange={(e) => setMascotDesc(e.target.value)} rows={2} placeholder="마스코트 소개" className={adminField} />
              </div>
            </div>
          </Panel>

          {/* BGM */}
          <Panel>
            <h2 className="font-display text-lg mb-3 flex items-center gap-2">
              <Music size={18} /> 배경음악
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="soft" size="sm" onClick={() => bgmRef.current?.click()} disabled={uploading === "bgm"}>
                {uploading === "bgm" ? <Loader2 size={15} className="animate-spin" /> : null}
                음악 파일 선택 (MP3)
              </Button>
              <input ref={bgmRef} type="file" accept="audio/mpeg,audio/mp3,audio/aac" className="hidden" onChange={(e) => pickBgm(e.target.files?.[0])} />
              {bgmUrl && <audio src={bgmUrl} controls className="h-9" />}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bgmLoop} onChange={(e) => setBgmLoop(e.target.checked)} className="h-4 w-4 accent-green-700" />
                반복 재생
              </label>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              ⚠️ 업로드하는 음악의 저작권 책임은 업로더(마을)에게 있어요. 상용 음원 무단
              업로드를 삼가 주세요. 자동재생은 되지 않고, 방문자가 버튼을 눌러야 재생돼요.
            </p>
          </Panel>

          {error && <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>}

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={busy} size="lg">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              저장하기
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                <Check size={16} /> 저장됐어요
              </span>
            )}
          </div>
        </div>

        {/* 미리보기 */}
        <div className="lg:sticky lg:top-6 h-fit">
          <p className={adminLabel}>실시간 미리보기</p>
          <div
            className="overflow-hidden rounded-[var(--radius-blob)] border border-line shadow-[var(--shadow-card)]"
            style={{ background: colorBg }}
          >
            <div className="relative h-32" style={{ background: heroUrl ? undefined : colorPrimary }}>
              {heroUrl && <Image src={heroUrl} alt="" fill sizes="360px" className="object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="font-display text-2xl text-white drop-shadow">{village.name}</p>
              </div>
            </div>
            <div className="p-4">
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ background: colorAccent }}
              >
                예약하기
              </button>
              <div className="mt-4">
                <Mascot src={mascotUrl} name={mascotName} say={mascotName ? `안녕! 나는 ${mascotName}!` : "안녕!"} size={72} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-500 mb-1">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-line px-2 py-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-7 shrink-0 cursor-pointer rounded" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-xs outline-none" />
      </div>
    </div>
  );
}
