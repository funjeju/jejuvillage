import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { paths } from "@/lib/firebase/paths";

export const maxDuration = 120;

/**
 * 마을 성격 + 마스코트를 반영한 대표 배너(히어로) 자동 생성.
 * - 마을명/한줄소개/스토리로 분위기를 파악하고, (있으면) 마스코트 시각 묘사를 합성
 * - 유튜브 배너처럼 "중앙 세이프존"에 핵심을 배치해 PC(와이드)·모바일(센터 크롭) 동시 대응
 * - 와이드(1536x1024) 1장 생성 → Storage 저장 → heroUrl 로 반영
 */

export async function POST(req: NextRequest) {
  const { villageId, mascotVisual } = (await req.json().catch(() => ({}))) as {
    villageId?: string;
    mascotVisual?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았어요." },
      { status: 400 }
    );
  }

  // 마을 정보 수집
  const db = adminDb();
  const [vSnap, storiesSnap] = await Promise.all([
    db.doc(paths.village(villageId)).get(),
    db.collection(paths.stories(villageId)).orderBy("order", "asc").limit(3).get(),
  ]);
  const v = vSnap.data();
  if (!v) return NextResponse.json({ error: "마을을 찾을 수 없어요." }, { status: 404 });

  const name: string = v.name ?? "";
  const oneLiner: string = v.oneLiner ?? "";
  const region: string = v.region ?? "";
  const storyText = storiesSnap.docs
    .map((d) => d.data()?.body ?? "")
    .join(" ")
    .slice(0, 400);

  const mascotClause = mascotVisual
    ? `Feature this village mascot character prominently on one side, kept fully inside the central safe zone: ${mascotVisual}.`
    : "";

  const prompt = `Wide panoramic hero banner illustration for a Korean rural village tourism homepage.
Village: "${name}" in ${region}, South Korea (Jeju Island). Concept: ${oneLiner}. Atmosphere hints: ${storyText}.
${mascotClause}
Style: soft warm watercolor storybook illustration, hand-painted picture-book aesthetic, cozy and inviting, gentle natural light.
Composition: keep ALL important subjects (mascot, focal scenery) within the CENTER 60% safe zone so the image crops well on both wide desktop and tall mobile screens; let the left and right edges be ambient scenery (sky, fields, sea) that is safe to crop.
Absolutely no text, no words, no letters, no logos.`;

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size: "1536x1024", quality: "medium", n: 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "배너 생성 실패", model },
        { status: 502 }
      );
    }
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) return NextResponse.json({ error: "생성 결과가 비어 있어요." }, { status: 502 });

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const objectPath = `villages/${villageId}/generated/banner-${id}.png`;
    await getStorage()
      .bucket(bucketName)
      .file(objectPath)
      .save(Buffer.from(b64, "base64"), { contentType: "image/png", resumable: false });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
      objectPath
    )}?alt=media`;

    // 테마 heroUrl 반영
    await db.doc(paths.themeDoc(villageId)).set({ villageId, heroUrl: url }, { merge: true });

    await db
      .collection(paths.mediaAssets)
      .add({ villageId, type: "image", url, source: "openai", kind: "banner", createdAt: Date.now() })
      .catch(() => {});

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: "배너 생성 중 오류", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
