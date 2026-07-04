import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { PlatformShell } from "@/components/platform/platform-shell";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "platform_admin") redirect("/admin");

  return <PlatformShell userName={user.name}>{children}</PlatformShell>;
}
