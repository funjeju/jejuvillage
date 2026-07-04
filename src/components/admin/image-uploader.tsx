"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageTo, type UploadedImage } from "@/lib/firebase/storage";

const MAX_MB = 10; // 장당 최대 (기획서 8.1)

/**
 * 다중 이미지 업로더 (A2/A3/A5 공용).
 * - 모바일 카메라 직접 촬영 지원(capture 속성, FR-ADM-FEED-01)
 * - 업로드 시 클라이언트 리사이즈(1600/480) → Storage → url/thumb 반환
 */
export function ImageUploader({
  villageId,
  folder,
  value,
  onChange,
  max = 10,
}: {
  villageId: string;
  folder: "feed" | "products" | "hero" | "mascot";
  value: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);

    const tooBig = picked.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) {
      setError(`이미지 1장당 최대 ${MAX_MB}MB까지 올릴 수 있어요.`);
      return;
    }

    setBusy(true);
    try {
      const uploaded: UploadedImage[] = [];
      for (const f of picked) {
        uploaded.push(await uploadImageTo(`villages/${villageId}/${folder}`, f));
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError((e as Error).message || "업로드에 실패했어요.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(assetId: string) {
    onChange(value.filter((v) => v.assetId !== assetId));
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {value.map((img) => (
          <div key={img.assetId} className="relative aspect-square overflow-hidden rounded-xl border border-line">
            <Image src={img.thumbUrl || img.url} alt="" fill sizes="120px" className="object-cover" />
            <button
              type="button"
              onClick={() => remove(img.assetId)}
              className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
              aria-label="사진 제거"
            >
              <X size={13} />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-ink-500 transition-colors hover:border-green-600 hover:text-green-700",
              busy && "pointer-events-none opacity-60"
            )}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
        <Camera size={13} />
        모바일에선 카메라로 바로 촬영할 수 있어요. 최대 {max}장 · 장당 {MAX_MB}MB
      </div>
      {error && <p className="mt-1 text-xs font-semibold text-[var(--accent)]">{error}</p>}
    </div>
  );
}
