import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getVillageById } from "@/lib/repo/server";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role === "guest") {
    redirect("/login");
  }

  const villageId = user.managedVillages[0];
  const village = villageId ? await getVillageById(villageId) : null;

  if (!village) {
    return (
      <div className="min-h-dvh grid place-items-center bg-cream-50 p-4">
        <div className="max-w-md rounded-[var(--radius-blob)] bg-white border border-line/80 p-8 text-center shadow-[var(--shadow-card)]">
          <h1 className="font-display text-2xl">배정된 마을이 없어요</h1>
          <p className="mt-2 text-ink-500">
            아직 관리할 마을이 배정되지 않았어요. 플랫폼 관리자에게 마을 배정을
            요청해 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-green-700 px-6 py-2.5 font-display font-semibold text-white"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
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
