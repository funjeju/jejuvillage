import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { requirePlatformAdmin } from "@/lib/auth/require-platform";
import { villageCreateSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 마을 생성 (플랫폼 어드민 P1, FR-PLT-01).
 * villages/{slug} 문서 + 기본 테마 문서를 생성한다. 초기 상태는 draft.
 */
export async function POST(req: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const parsed = villageCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 422 }
    );
  }
  const input = parsed.data;

  try {
    const db = adminDb();
    const ref = db.doc(paths.village(input.slug));
    if ((await ref.get()).exists) {
      return NextResponse.json({ error: "이미 존재하는 slug 입니다." }, { status: 409 });
    }

    await ref.set({
      slug: input.slug,
      name: input.name,
      region: input.region,
      lat: input.lat,
      lng: input.lng,
      oneLiner: input.oneLiner,
      status: "draft",
      lastPostedAt: null,
      seasonTag: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 기본 테마 문서 (녹색 자연톤 + 장미 레드 강조)
    await db.doc(paths.themeDoc(input.slug)).set({
      villageId: input.slug,
      presetKey: "warm",
      colorPrimary: "#3e8e41",
      colorAccent: "#e14b5a",
      colorBg: "#fffdf5",
      fontKey: "default",
      heroUrl: null,
      mascotUrl: null,
      mascotName: null,
      mascotDesc: null,
      bgmUrl: null,
      bgmLoop: true,
    });

    return NextResponse.json({ ok: true, villageId: input.slug });
  } catch (err) {
    return NextResponse.json(
      { error: "마을 생성 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
