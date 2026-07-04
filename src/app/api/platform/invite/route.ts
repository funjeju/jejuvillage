import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { requirePlatformAdmin } from "@/lib/auth/require-platform";
import { inviteAdminSchema } from "@/lib/schemas";
import { FieldValue } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";

/**
 * 운영자 초대 (플랫폼 어드민 P1, FR-PLT-01).
 * 이메일로 Auth 계정을 생성/조회하고 custom claims(role, managedVillages)를 부여한다.
 * 신규 생성 시 임시 비밀번호를 반환한다(플랫폼 어드민이 전달).
 */
export async function POST(req: NextRequest) {
  const admin = await requirePlatformAdmin();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const parsed = inviteAdminSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요." },
      { status: 422 }
    );
  }
  const { villageId, email } = parsed.data;

  try {
    const db = adminDb();
    const villageSnap = await db.doc(paths.village(villageId)).get();
    if (!villageSnap.exists) {
      return NextResponse.json({ error: "마을을 찾을 수 없습니다." }, { status: 404 });
    }
    const villageName = villageSnap.data()?.name ?? "";

    let userRecord: UserRecord;
    let tempPassword: string | null = null;
    try {
      userRecord = await adminAuth().getUserByEmail(email);
    } catch {
      tempPassword = randomBytes(6).toString("base64url"); // 8자 내외 임시 비번
      userRecord = await adminAuth().createUser({
        email,
        password: tempPassword,
        displayName: `${villageName} 운영자`,
      });
    }

    const claims = (userRecord.customClaims ?? {}) as {
      role?: string;
      managedVillages?: string[];
    };
    const role = claims.role === "platform_admin" ? "platform_admin" : "village_admin";
    const managed = Array.from(new Set([...(claims.managedVillages ?? []), villageId]));

    await adminAuth().setCustomUserClaims(userRecord.uid, {
      role,
      managedVillages: managed,
    });

    await db.doc(`${paths.users}/${userRecord.uid}`).set(
      {
        name: userRecord.displayName ?? `${villageName} 운영자`,
        email,
        role,
        managedVillages: managed,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      email,
      tempPassword, // 신규 계정일 때만 값 존재
      note: tempPassword
        ? "신규 계정이 생성됐어요. 임시 비밀번호를 운영자에게 전달하세요."
        : "기존 계정에 마을 관리 권한을 부여했어요.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "초대 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
