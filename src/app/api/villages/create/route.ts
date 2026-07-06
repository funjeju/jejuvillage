import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { getSessionUser } from "@/lib/auth/session";
import { villageCreateSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";

/**
 * 사무장 자체 마을 개설 (구글 로그인 후).
 * 로그인한 사용자가 자기 마을을 만들고, 그 마을의 운영자(village_admin) 권한을 자동 부여받는다.
 * 이후 /admin 빌더에서 자료 업로드·AI 자동구성·수정이 가능하다.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
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
      return NextResponse.json(
        { error: "이미 사용 중인 주소(slug)예요. 다른 이름을 써주세요." },
        { status: 409 }
      );
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
      ownerUid: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 기본 테마 문서
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

    // 권한 부여: 플랫폼 어드민은 유지, 그 외에는 village_admin. 관리 마을에 추가.
    const role = user.role === "platform_admin" ? "platform_admin" : "village_admin";
    const managedVillages = Array.from(new Set([...user.managedVillages, input.slug]));
    await adminAuth().setCustomUserClaims(user.uid, { role, managedVillages });
    await db.doc(`${paths.users}/${user.uid}`).set(
      { role, managedVillages, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    return NextResponse.json({ ok: true, villageId: input.slug, slug: input.slug });
  } catch (err) {
    return NextResponse.json(
      { error: "마을 개설 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
