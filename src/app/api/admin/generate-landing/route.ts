import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { isFetchableUrl } from "@/lib/screenshot";
import { buildBlueprint, type LandingContent } from "@/lib/landing/generate";
import { FieldValue } from "firebase-admin/firestore";
import type { LandingBlueprint } from "@/lib/types";

export const maxDuration = 120;

/**
 * 마을 종속 랜딩페이지 생성 (관리자 콘솔용).
 * 마을 자료(설명·이미지·색)를 재료로, 참조 URL 의 디자인 감각을 복제한
 * 랜딩을 만들어 villages/{vid}/landing/main 에 저장한다.
 * 독립 랜딩은 /api/landing/generate 를 사용한다.
 */
export async function POST(req: NextRequest) {
  const { villageId, refUrl } = (await req.json().catch(() => ({}))) as {
    villageId?: string;
    refUrl?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
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
    const content = await loadVillageContent(villageId);
    if (!content) {
      return NextResponse.json({ error: "마을을 찾을 수 없어요." }, { status: 404 });
    }

    const bp = await buildBlueprint(key, refUrl, content);

    const now = Date.now();
    await adminDb().doc(paths.landingDoc(villageId)).set(
      {
        villageId,
        refUrl,
        screenshotUrl: bp.screenshotUrl,
        designNote: bp.designNote,
        palette: bp.palette,
        fontMood: bp.fontMood,
        sections: bp.sections,
        source: "ai",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const result: LandingBlueprint = {
      villageId,
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

/** 마을 자료를 LandingContent 로 정규화 (villageId === slug === 문서 ID) */
async function loadVillageContent(vid: string): Promise<LandingContent | null> {
  const db = adminDb();
  const [villageSnap, themeSnap, storiesSnap, postsSnap] = await Promise.all([
    db.doc(paths.village(vid)).get(),
    db.doc(paths.themeDoc(vid)).get(),
    db.collection(paths.stories(vid)).orderBy("order", "asc").get(),
    db.collection(paths.feedPosts(vid)).orderBy("publishedAt", "desc").limit(8).get(),
  ]);
  if (!villageSnap.exists) return null;
  const v = villageSnap.data()!;
  const t = themeSnap.data() ?? {};

  const images: string[] = [];
  if (t.heroUrl) images.push(t.heroUrl);
  postsSnap.docs.forEach((d) => {
    const media = (d.data().media ?? []) as { url?: string }[];
    media.forEach((m) => m?.url && images.push(m.url));
  });

  const description = storiesSnap.docs
    .map((d) => `${d.data().title ?? ""} ${d.data().body ?? ""}`.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    name: v.name ?? "",
    region: v.region ?? "",
    oneLiner: v.oneLiner ?? "",
    description,
    images: Array.from(new Set(images)).slice(0, 8),
    colors: {
      primary: t.colorPrimary ?? "#3e8e41",
      accent: t.colorAccent ?? "#e14b5a",
      bg: t.colorBg ?? "#fffdf5",
    },
  };
}
