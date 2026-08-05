import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { isFetchableUrl } from "@/lib/screenshot";
import { buildBlueprint, type LandingContent } from "@/lib/landing/generate";
import { FieldValue } from "firebase-admin/firestore";
import type { LandingBlueprint } from "@/lib/types";

export const maxDuration = 120;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * 독립 랜딩페이지 생성 (마을과 무관).
 * 로그인한 사용자가 이름·소개·참조 URL 을 직접 입력하면,
 * 참조 URL 스크린샷을 비전 AI 가 분석해 랜딩 blueprint 를 만들어
 * 최상위 landings/{slug} 에 저장한다. 결과는 /l/{slug} 에서 공개된다.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slug, name, description, refUrl, images } = (await req
    .json()
    .catch(() => ({}))) as {
    slug?: string;
    name?: string;
    description?: string;
    refUrl?: string;
    images?: string[];
  };

  const cleanSlug = String(slug ?? "").trim().toLowerCase();
  if (!cleanSlug || !SLUG_RE.test(cleanSlug)) {
    return NextResponse.json(
      { error: "주소(slug)는 영문 소문자·숫자·하이픈만 사용해 주세요." },
      { status: 422 }
    );
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "랜딩 이름을 입력해 주세요." }, { status: 422 });
  }
  if (!refUrl) {
    return NextResponse.json({ error: "참조 URL을 입력해 주세요." }, { status: 422 });
  }
  const urlCheck = isFetchableUrl(refUrl);
  if (!urlCheck.ok) {
    return NextResponse.json({ error: urlCheck.reason }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았어요." },
      { status: 400 }
    );
  }

  try {
    const ref = adminDb().doc(paths.landingProject(cleanSlug));
    const existing = await ref.get();
    if (existing.exists && existing.data()?.ownerUid !== user.uid) {
      return NextResponse.json(
        { error: "이미 사용 중인 주소예요. 다른 slug를 써주세요." },
        { status: 409 }
      );
    }

    const content: LandingContent = {
      name: name.trim(),
      description: (description ?? "").trim(),
      images: Array.isArray(images) ? images.filter((u) => typeof u === "string").slice(0, 12) : [],
      colors: { primary: "#3e8e41", accent: "#e14b5a", bg: "#ffffff" },
    };

    const bp = await buildBlueprint(key, refUrl, content);

    await ref.set(
      {
        villageId: cleanSlug,
        slug: cleanSlug,
        name: content.name,
        ownerUid: user.uid,
        refUrl,
        screenshotUrl: bp.screenshotUrl,
        designNote: bp.designNote,
        palette: bp.palette,
        fontMood: bp.fontMood,
        sections: bp.sections,
        source: "ai",
        createdAt: existing.exists ? existing.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const now = Date.now();
    const result: LandingBlueprint = {
      villageId: cleanSlug,
      slug: cleanSlug,
      name: content.name,
      ownerUid: user.uid,
      refUrl,
      screenshotUrl: bp.screenshotUrl,
      designNote: bp.designNote,
      palette: bp.palette,
      fontMood: bp.fontMood,
      sections: bp.sections,
      source: "ai",
      createdAt: now,
      updatedAt: now,
    };
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { error: "랜딩 생성 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
