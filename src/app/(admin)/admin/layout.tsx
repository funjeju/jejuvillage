import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getVillageById } from "@/lib/repo/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { VillageOnboarding } from "@/components/admin/village-onboarding";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  // 로그인 안 됨 → 로그인 페이지
  if (!user) {
    redirect("/login");
  }

  // 플랫폼 어드민(관리 마을 없음) → 전용 콘솔
  if (user.role === "platform_admin" && user.managedVillages.length === 0) {
    redirect("/platform");
  }

  const villageId = user.managedVillages[0];
  const village = villageId ? await getVillageById(villageId) : null;

  // 로그인은 됐지만 아직 마을이 없는 사용자 → 자체 마을 개설 온보딩
  if (!village) {
    return <VillageOnboarding userName={user.name} />;
  }

  return (
    <AdminShell
      village={{ id: village.id, slug: village.slug, name: village.name }}
      user={{
        uid: user.uid,
        name: user.name,
        role: user.role as "village_admin" | "platform_admin",
      }}
    >
      {children}
    </AdminShell>
  );
}
