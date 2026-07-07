"use client";

import { useEffect, useRef, useState } from "react";
import { Music, Loader2, Save, Check, Trash2, Upload } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getThemeOnce, saveThemePartial } from "@/lib/repo/client";
import { uploadAudio } from "@/lib/firebase/storage";

const AUDIO_MAX_MB = 8;

export default function AdminMusicPage() {
  const { village } = useAdmin();
  const [bgmUrl, setBgmUrl] = useState<string | null>(null);
  const [bgmLoop, setBgmLoop] = useState(true);
  const [loaded, setLoaded] = useState(() => !isFirebaseConfigured());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getThemeOnce(village.id).then((t) => {
      if (t) {
        setBgmUrl(t.bgmUrl ?? null);
        setBgmLoop(t.bgmLoop);
      }
      setLoaded(true);
    });
  }, [village.id]);

  async function onFile(file?: File) {
    if (!file) return;
    if (file.size > AUDIO_MAX_MB * 1024 * 1024) {
      setError(`음악 파일은 최대 ${AUDIO_MAX_MB}MB까지 올릴 수 있어요.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadAudio(village.id, file);
      setBgmUrl(url);
      setSaved(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveThemePartial(village.id, { bgmUrl, bgmLoop });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message);
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
    <div className="max-w-2xl">
      <PageTitle
        title="마을 음악"
        desc="마을 홈페이지에 들어오면 배경음악이 자동으로 흘러요. 방문자는 하단 버튼으로 언제든 끌 수 있어요."
      />

      <Panel className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">현재 배경음악</p>
          {bgmUrl ? (
            <div className="space-y-3">
              <audio src={bgmUrl} controls className="w-full" />
              <button
                onClick={() => {
                  setBgmUrl(null);
                  setSaved(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-700 hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Trash2 size={15} /> 음악 제거
              </button>
            </div>
          ) : (
            <p className="rounded-xl border-2 border-dashed border-line bg-white/60 py-8 text-center text-sm text-ink-500">
              아직 등록된 음악이 없어요.
            </p>
          )}
        </div>

        <div>
          <Button variant="soft" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "업로드 중…" : bgmUrl ? "다른 음악으로 교체" : "음악 파일 올리기 (MP3)"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/aac"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <p className="mt-2 text-xs text-ink-500">
            MP3 권장 · 최대 {AUDIO_MAX_MB}MB. ⚠️ 업로드하는 음악의 저작권 책임은 업로더(마을)에게
            있어요. 상용 음원 무단 업로드를 삼가 주세요.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={bgmLoop}
            onChange={(e) => {
              setBgmLoop(e.target.checked);
              setSaved(false);
            }}
            className="h-4 w-4 accent-green-700"
          />
          반복 재생
        </label>

        {error && (
          <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? "저장됨" : "저장하기"}
          </Button>
          <a
            href={`/v/${village.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline"
          >
            <Music size={15} /> 마을 홈에서 확인
          </a>
        </div>
      </Panel>
    </div>
  );
}
