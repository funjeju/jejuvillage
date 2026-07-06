import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SUPER_ADMIN_EMAIL,
} from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST — 클라이언트 로그인 후 ID 토큰으로 세션 쿠키(httpOnly)를 발급.
 * 최초 로그인 시 users/{uid} 문서를 보장 생성한다.
 * DELETE — 로그아웃(쿠키 삭제).
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: "idToken 필요" }, { status: 400 });
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const email = (decoded.email ?? "").toLowerCase();
    const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

    // users 문서 보장 (없으면 생성). 슈퍼어드민 이메일은 platform_admin 부트스트랩.
    const userRef = adminDb().doc(`${paths.users}/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        name: decoded.name ?? decoded.email?.split("@")[0] ?? "사용자",
        email: decoded.email ?? null,
        phone: decoded.phone_number ?? null,
        role: isSuperAdmin ? "platform_admin" : "guest",
        managedVillages: [],
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (isSuperAdmin && snap.data()?.role !== "platform_admin") {
      await userRef.set({ role: "platform_admin" }, { merge: true });
    }

    // 슈퍼어드민 커스텀 클레임 보장 (Firestore 보안규칙/토큰 반영)
    if (isSuperAdmin && decoded.role !== "platform_admin") {
      const claims = (decoded as { managedVillages?: string[] }).managedVillages ?? [];
      await adminAuth().setCustomUserClaims(uid, {
        role: "platform_admin",
        managedVillages: claims,
      });
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "세션 생성 실패", detail: (err as Error).message },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
