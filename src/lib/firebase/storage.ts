"use client";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { clientStorage } from "@/lib/firebase/client";

/**
 * 이미지 업로드.
 * 기획서 8.1의 파이프라인(리사이즈·썸네일)을 Cloud Function 대신
 * 클라이언트 canvas 리사이즈로 대체해 MVP에서 즉시 동작하도록 한다.
 *  - display: 최대 1600px 장변, WebP
 *  - thumb: 최대 480px 장변, WebP
 * EXIF GPS 는 canvas 재인코딩 과정에서 자연 제거된다(개인정보 보호).
 */

export interface UploadedImage {
  assetId: string;
  url: string; // display
  thumbUrl: string;
  width: number;
  height: number;
}

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // imageOrientation: EXIF 회전 반영 (8.1)
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fallthrough */
    }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function resize(
  file: File,
  maxEdge: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await loadBitmap(file);
  const iw = "width" in bmp ? bmp.width : 0;
  const ih = "height" in bmp ? bmp.height : 0;
  const scale = Math.min(1, maxEdge / Math.max(iw, ih || 1));
  const w = Math.round(iw * scale);
  const h = Math.round(ih * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp as CanvasImageSource, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지 변환 실패"))),
      "image/webp",
      quality
    )
  );
  return { blob, width: w, height: h };
}

export async function uploadFeedImage(
  villageId: string,
  file: File
): Promise<UploadedImage> {
  const id = uid();
  const storage = clientStorage();
  const [display, thumb] = await Promise.all([
    resize(file, 1600, 0.82),
    resize(file, 480, 0.75),
  ]);

  const base = `villages/${villageId}/feed/${id}`;
  const displayRef = ref(storage, `${base}.webp`);
  const thumbRef = ref(storage, `${base}_thumb.webp`);

  await Promise.all([
    uploadBytes(displayRef, display.blob, { contentType: "image/webp" }),
    uploadBytes(thumbRef, thumb.blob, { contentType: "image/webp" }),
  ]);

  const [url, thumbUrl] = await Promise.all([
    getDownloadURL(displayRef),
    getDownloadURL(thumbRef),
  ]);

  return { assetId: id, url, thumbUrl, width: display.width, height: display.height };
}

/** 단일 이미지(대표/마스코트/상품 등) 업로드 */
export async function uploadImageTo(
  path: string,
  file: File,
  maxEdge = 1600
): Promise<UploadedImage> {
  const id = uid();
  const storage = clientStorage();
  const display = await resize(file, maxEdge, 0.85);
  const thumb = await resize(file, 480, 0.75);
  const fileRef = ref(storage, `${path}/${id}.webp`);
  const thumbRef = ref(storage, `${path}/${id}_thumb.webp`);
  await Promise.all([
    uploadBytes(fileRef, display.blob, { contentType: "image/webp" }),
    uploadBytes(thumbRef, thumb.blob, { contentType: "image/webp" }),
  ]);
  const [url, thumbUrl] = await Promise.all([
    getDownloadURL(fileRef),
    getDownloadURL(thumbRef),
  ]);
  return { assetId: id, url, thumbUrl, width: display.width, height: display.height };
}

/** 오디오(BGM) 업로드 — 원본 그대로 (형식/용량 검증은 호출측) */
export async function uploadAudio(
  villageId: string,
  file: File
): Promise<{ assetId: string; url: string }> {
  const id = uid();
  const storage = clientStorage();
  const ext = file.name.split(".").pop() ?? "mp3";
  const fileRef = ref(storage, `villages/${villageId}/bgm/${id}.${ext}`);
  await uploadBytes(fileRef, file, { contentType: file.type || "audio/mpeg" });
  const url = await getDownloadURL(fileRef);
  return { assetId: id, url };
}
