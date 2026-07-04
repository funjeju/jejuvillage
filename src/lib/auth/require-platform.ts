import "server-only";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

/** API 라우트용 플랫폼 어드민 가드. 통과 시 세션 반환, 아니면 null. */
export async function requirePlatformAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "platform_admin") return null;
  return user;
}
