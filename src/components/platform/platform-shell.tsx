"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, BarChart3, Palette, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";

const NAV = [
  { href: "/platform/villages", label: "마을 관리", icon: Building2 },
  { href: "/platform/stats", label: "전체 통계", icon: BarChart3 },
  { href: "/platform/templates", label: "템플릿", icon: Palette },
];

export function PlatformShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Shell userName={userName}>{children}</Shell>
    </AuthProvider>
  );
}

function Shell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  async function logout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-cream-50">
      <header className="sticky top-0 z-40 border-b border-line bg-green-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} />
            <span className="font-display text-lg">제주마을 · 플랫폼 관리자</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-green-100 sm:inline">{userName}</span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold hover:bg-white/25"
            >
              <LogOut size={15} /> 로그아웃
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-white text-white"
                    : "border-transparent text-green-100 hover:text-white"
                )}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
