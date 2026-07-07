import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { paths } from "@/lib/firebase/paths";

export const maxDuration = 120;

/**
 * OpenAI 이미지 생성(gpt-image) → 마을 고유 배경/마스코트/에셋 생성.
 * 생성 이미지를 Firebase Storage에 저장하고 공개 URL을 반환한다.
 *  - kind: hero(가로 배경) | mascot(정사각 캐릭터) | asset(정사각)
 *  - 모델/품질은 env로 조정: OPENAI_IMAGE_MODEL(기본 gpt-image-1), 품질 low 고정
 */

const STYLE: Record<string, string> = {
  hero: "Wide cinematic hero background. Soft watercolor storybook illustration of Jeju Island Korea, warm, peaceful, cozy, hand-painted picture-book aesthetic. No text, no words, no letters.",
  mascot:
    "Cute friendly mascot character, full body, storybook illustration, simple soft solid background, Jeju Island Korea theme, adorable. No text, no words.",
  asset:
    "Decorative illustration asset, soft watercolor storybook style, Jeju Island Korea theme. No text, no words.",
};

const SIZE: Record<string, string> = {
  hero: "1536x1024",
  mascot: "1024x1024",
  asset: "1024x1024",
};

export async function POST(req: NextRequest) {
  const { villageId, prompt, kind, refImageBase64, refMediaType } = (await req
    .json()
    .catch(() => ({}))) as {
    villageId?: string;
    prompt?: string;
    kind?: "hero" | "mascot" | "asset";
    /** 참조 이미지(캐릭터시트 등) base64 — 있으면 image-to-image(edits)로 생성 */
    refImageBase64?: string;
    refMediaType?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (!prompt || prompt.trim().length < 4) {
    return NextResponse.json({ error: "생성할 이미지를 설명해 주세요." }, { status: 422 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았어요. .env.local에 키를 넣어주세요." },
      { status: 400 }
    );
  }

  const k = kind ?? "hero";
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "medium";
  const size = SIZE[k] ?? "1024x1024";
  const composed = `${prompt.trim()}\n\n${STYLE[k] ?? STYLE.asset}`;

  try {
    let res: Response;
    if (refImageBase64) {
      // 참조 이미지 기반 생성 (gpt-image-2 image-to-image, /v1/images/edits)
      const refPrompt =
        `${prompt.trim()}\n\nUse the attached image as the exact visual reference. ` +
        `Reproduce the SAME character/subject faithfully — identical design, colors, outfit, face, proportions and art style. ` +
        (k === "mascot"
          ? "Isolate the single main mascot as ONE full-body, front-facing figure, centered on a clean soft pastel background. Remove any character-sheet grid, turnaround poses, color swatches, labels and text."
          : "Keep it faithful to the reference. No text, no words.");
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", refPrompt);
      form.append("size", size);
      form.append("quality", quality);
      form.append("n", "1");
      const refBuf = Buffer.from(refImageBase64, "base64");
      form.append(
        "image",
        new Blob([refBuf], { type: refMediaType || "image/png" }),
        "reference.png"
      );
      res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      // 텍스트 프롬프트 기반 생성 (text-to-image)
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, prompt: composed, size, quality, n: 1 }),
      });
    }
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "이미지 생성 실패", model },
        { status: 502 }
      );
    }
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "생성 결과가 비어 있어요." }, { status: 502 });
    }

    // 2) Firebase Storage 업로드
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const objectPath = `villages/${villageId}/generated/${k}-${id}.png`;
    const buffer = Buffer.from(b64, "base64");
    await getStorage()
      .bucket(bucketName)
      .file(objectPath)
      .save(buffer, { contentType: "image/png", resumable: false });

    // 3) 공개 다운로드 URL (Storage 규칙이 villages/** 공개 읽기 허용)
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
      objectPath
    )}?alt=media`;

    // 4) media_assets 기록 (선택)
    await adminDb()
      .collection(paths.mediaAssets)
      .add({
        villageId,
        type: "image",
        url,
        source: "openai",
        kind: k,
        createdAt: Date.now(),
      })
      .catch(() => {});

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: "이미지 생성 중 오류", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
