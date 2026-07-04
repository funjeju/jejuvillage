import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "jv_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5일

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string;
  role: Role;
  managedVillages: string[];
}

/**
 * 세션 쿠키를 검증해 현재 로그인 사용자를 반환한다.
 * 권한(role, managedVillages)은 커스텀 클레임 우선, 없으면 users 문서에서 보강.
 * RBAC 최종 방어는 Firestore 보안규칙(9.1.4)이 담당한다.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const uid = decoded.uid;

    let role = (decoded.role as Role | undefined) ?? undefined;
    let managedVillages =
      (decoded.managedVillages as string[] | undefined) ?? undefined;
    let name = (decoded.name as string | undefined) ?? "";

    if (!role || !managedVillages) {
      const userDoc = await adminDb().doc(`${paths.users}/${uid}`).get();
      const u = userDoc.data();
      role ??= (u?.role as Role) ?? "guest";
      managedVillages ??= (u?.managedVillages as string[]) ?? [];
      name ||= (u?.name as string) ?? "";
    }

    return {
      uid,
      email: (decoded.email as string) ?? null,
      name: name || (decoded.email as string)?.split("@")[0] || "운영자",
      role: role ?? "guest",
      managedVillages: managedVillages ?? [],
    };
  } catch {
    return null;
  }
}

export function canManageVillage(user: SessionUser | null, villageId: string): boolean {
  if (!user) return false;
  if (user.role === "platform_admin") return true;
  return user.role === "village_admin" && user.managedVillages.includes(villageId);
}

export function isPlatformAdmin(user: SessionUser | null): boolean {
  return user?.role === "platform_admin";
}
