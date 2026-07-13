import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { paths } from "@/lib/firebase/paths";

export const maxDuration = 120;

const HISTORY_MAX = 8;

// 어떤 결과가 나와도 '명백히 제주'로 보이게 하는 고정 앵커
const JEJU_ANCHOR =
  "This MUST look unmistakably like Jeju Island, South Korea — real Jeju signatures: black basalt (volcanic) dry-stone walls (돌담/밭담), low stone or grey-tile roofed rural houses, tangerine (감귤) groves, green oreum (volcanic cones) and the silhouette of Hallasan mountain, and if coastal, dark volcanic rock shorelines. " +
  "Absolutely NOT generic European/American/tropical scenery, NO snowy alps, NO palm-tree beaches, NO western cottages, NO skyscrapers.";

/**
 * 마을 사실(한줄소개·스토리)을 근거로, 제주에 실재하는 구체적 장면 브리프를 만든다.
 * 텍스트 모델(gpt-5-mini)로 '실제 이 마을에 있을 법한' 요소만 뽑아 뜬금없는 그림을 방지.
 * 실패하면 null → 호출측이 기본 템플릿으로 폴백.
 */
async function buildSceneBrief(
  apiKey: string,
  facts: { name: string; region: string; oneLiner: string; storyText: string }
): Promise<string | null> {
  const textModel = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  const sys =
    "You are an art director for a Jeju Island (제주도) village tourism site. " +
    "From the given Korean village facts, write ONE concise English paragraph (max 60 words) describing a background scenery illustration that is FAITHFUL to this specific village. " +
    "Only include concrete visual elements that are grounded in the facts (named landmarks, local resources, terrain, crops, sea/mountain). " +
    "If facts are thin, fall back to authentic generic Jeju rural scenery. Do NOT invent famous foreign landmarks. No people-as-focus, no mascot, no text in the image.";
  const usr = `Village: ${facts.name} (${facts.region}, Jeju Island).\nOne-liner: ${facts.oneLiner}\nStories/resources: ${facts.storyText}`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: textModel,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
      }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    const brief: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return brief.length > 10 ? brief.slice(0, 600) : null;
  } catch {
    return null;
  }
}

/**
 * 마을 성격 + 마스코트를 반영한 대표 배너(히어로) 자동 생성.
 * - 마을명/한줄소개/스토리로 분위기를 파악하고, (있으면) 마스코트 시각 묘사를 합성
 * - 유튜브 배너처럼 "중앙 세이프존"에 핵심을 배치해 PC(와이드)·모바일(센터 크롭) 동시 대응
 * - 와이드(1536x1024) 1장 생성 → Storage 저장 → heroUrl 로 반영
 */

// 배너 그림풍 프리셋. 기본은 지브리 혼합 애니메이션풍.
const STYLE_PROMPT: Record<string, string> = {
  anime:
    "Style: Studio Ghibli-inspired anime background art blended ~50-60% with clean modern anime film aesthetic — soft cel shading, hand-painted anime scenery, lush and warm, gentle cinematic lighting, painterly skies and foliage.",
  watercolor:
    "Style: soft warm watercolor storybook illustration, hand-painted picture-book aesthetic, cozy and inviting, gentle natural light.",
};

export async function POST(req: NextRequest) {
  const { villageId, refImageBase64, refMediaType, style } = (await req
    .json()
    .catch(() => ({}))) as {
    villageId?: string;
    refImageBase64?: string; // 실제 사진(참조) → 그대로 리페인트
    refMediaType?: string;
    style?: string; // "anime" | "watercolor"
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

  // AI 이미지 재생성 게이트: 슈퍼관리자거나 게시 승인(published)된 마을만.
  // 단, 아직 배너가 없는 최초 생성(온보딩)은 허용.
  const themeSnapEarly = await db.doc(paths.themeDoc(villageId)).get();
  const hasBanner = Boolean(themeSnapEarly.data()?.heroUrl);
  const isSuper = user?.role === "platform_admin";
  const approved = v.status === "published";
  if (!isSuper && !approved && hasBanner) {
    return NextResponse.json(
      { error: "게시 승인 후 배너를 다시 생성할 수 있어요. 대시보드에서 게시 요청을 해주세요.", locked: true },
      { status: 403 }
    );
  }

  const name: string = v.name ?? "";
  const oneLiner: string = v.oneLiner ?? "";
  const region: string = v.region ?? "";
  // 스타일: 요청값 → 테마 저장값 → 기본(anime)
  const styleKey = style || (themeSnapEarly.data()?.bannerStyle as string) || "anime";
  const stylePrompt = STYLE_PROMPT[styleKey] ?? STYLE_PROMPT.anime;
  const storyText = storiesSnap.docs
    .map((d) => d.data()?.body ?? "")
    .join(" ")
    .slice(0, 400);

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "medium";
  const useRef = Boolean(refImageBase64);

  // 참조 사진 없을 때만 마을 사실 기반 장면 브리프 생성
  let brief: string | null = null;
  let prompt: string;
  if (useRef) {
    // 실제 사진을 '그대로' 배너로 리페인트 — 지형/건물/배치를 지어내지 않음
    prompt = `Repaint the attached REAL photograph as an illustrated village tourism homepage banner.
Keep the SAME real scene faithfully: the same terrain, buildings, roads, fields, trees and overall layout as in the photo. Do NOT invent or add anything that is not in the photo — no extra sea, no extra mountains, no new buildings.
${stylePrompt}
Wide panoramic banner composition. Absolutely NO cartoon mascot characters, NO people as the focus, NO text, no words, no letters, no logos.`;
  } else {
    brief = await buildSceneBrief(apiKey, { name, region, oneLiner, storyText });
    const grounded = brief || `Concept: ${oneLiner}. Atmosphere hints: ${storyText}.`;
    prompt = `Wide panoramic hero banner illustration for a Jeju Island (제주도) rural village tourism homepage — BACKGROUND SCENERY ONLY.
Village: "${name}" in ${region}, Jeju Island, South Korea.
Scene (grounded in this real village): ${grounded}
${JEJU_ANCHOR}
${stylePrompt}
Composition: keep the focal scenery within the CENTER 60% safe zone so the image crops well on both wide desktop and tall mobile screens; let the left and right edges be ambient scenery (sky, fields, sea) that is safe to crop. Leave the lower-left area visually calm (dark-friendly) for overlay text, and the right side uncluttered for a character overlay.
Absolutely NO cartoon mascot characters, NO animals in costume, NO text, no words, no letters, no logos.`;
  }

  try {
    let res: Response;
    if (useRef) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("size", "1536x1024");
      form.append("quality", quality);
      form.append("n", "1");
      const refBuf = Buffer.from(refImageBase64!, "base64");
      form.append("image", new Blob([refBuf], { type: refMediaType || "image/png" }), "reference.png");
      res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size: "1536x1024", quality, n: 1 }),
      });
    }
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

    // 배너 히스토리(최신순, 중복 제거, 최대 HISTORY_MAX) 유지 + heroUrl 반영
    const themeSnap = await db.doc(paths.themeDoc(villageId)).get();
    const prevHistory: string[] = Array.isArray(themeSnap.data()?.heroHistory)
      ? themeSnap.data()!.heroHistory
      : [];
    const prevHero: string | undefined = themeSnap.data()?.heroUrl;
    // 기존 heroUrl 도 히스토리에 포함해 나중에 되돌릴 수 있게
    const history = [url, ...(prevHero ? [prevHero] : []), ...prevHistory]
      .filter((u, i, arr) => u && arr.indexOf(u) === i)
      .slice(0, HISTORY_MAX);

    await db
      .doc(paths.themeDoc(villageId))
      .set({ villageId, heroUrl: url, heroHistory: history, bannerStyle: styleKey }, { merge: true });

    await db
      .collection(paths.mediaAssets)
      .add({ villageId, type: "image", url, source: "openai", kind: "banner", createdAt: Date.now() })
      .catch(() => {});

    return NextResponse.json({ ok: true, url, history, grounded: Boolean(brief) });
  } catch (err) {
    return NextResponse.json(
      { error: "배너 생성 중 오류", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
