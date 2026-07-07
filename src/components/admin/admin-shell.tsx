"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Wand2,
  Camera,
  Package,
  CalendarCheck,
  Home,
  Music,
  BarChart3,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import {
  AdminProvider,
  type AdminVillage,
  type AdminSessionInfo,
} from "@/lib/admin/admin-context";

const NAV = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/homepage", label: "홈페이지 만들기", icon: Wand2 },
  { href: "/admin/feed", label: "소식 발행", icon: Camera },
  { href: "/admin/products", label: "체험상품", icon: Package },
  { href: "/admin/bookings", label: "예약 관리", icon: CalendarCheck },
  { href: "/admin/music", label: "마을 음악", icon: Music },
  { href: "/admin/report", label: "관광 리포트", icon: BarChart3 },
  { href: "/admin/village", label: "마을 정보", icon: Home },
];

export function AdminShell({
  village,
  user,
  children,
}: {
  village: AdminVillage;
  user: AdminSessionInfo;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminProvider village={village} user={user}>
        <Shell village={village} user={user}>
          {children}
        </Shell>
      </AdminProvider>
    </AuthProvider>
  );
}

function Shell({
  village,
  user,
  children,
}: {
  village: AdminVillage;
  user: AdminSessionInfo;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-green-700 text-white" : "text-ink-700 hover:bg-green-100"
            )}
          >
            <Icon size={18} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-cream-50">
      {/* 모바일 상단바 */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기">
          <Menu />
        </button>
        <span className="font-display text-lg whitespace-nowrap truncate max-w-[55vw]">{village.name} 관리</span>
        <Link href={`/v/${village.slug}`} target="_blank" aria-label="마을 홈 보기">
          <ExternalLink size={20} />
        </Link>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* 데스크톱 사이드바 */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white p-4 md:flex">
          <SidebarHeader village={village} user={user} />
          <div className="mt-6 flex-1">{nav}</div>
          <SidebarFooter village={village} onLogout={handleLogout} />
        </aside>

        {/* 모바일 드로어 */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4">
              <div className="flex items-center justify-between">
                <SidebarHeader village={village} user={user} />
                <button onClick={() => setOpen(false)} aria-label="닫기">
                  <X />
                </button>
              </div>
              <div className="mt-6 flex-1">{nav}</div>
              <SidebarFooter village={village} onLogout={handleLogout} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarHeader({ village, user }: { village: AdminVillage; user: AdminSessionInfo }) {
  return (
    <div>
      <Link href="/admin" className="font-display text-xl text-green-800">
        🌱 제주마을
      </Link>
      <p className="mt-3 rounded-xl bg-green-100 px-3 py-2 text-sm">
        <span className="block font-bold text-green-800">{village.name}</span>
        <span className="text-xs text-ink-500">
          {user.name} · {user.role === "platform_admin" ? "플랫폼 관리자" : "마을 운영자"}
        </span>
      </p>
    </div>
  );
}

function SidebarFooter({
  village,
  onLogout,
}: {
  village: AdminVillage;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 space-y-1 border-t border-line pt-3">
      <Link
        href={`/v/${village.slug}`}
        target="_blank"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-green-100"
      >
        <ExternalLink size={18} /> 마을 홈 보기
      </Link>
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        <LogOut size={18} /> 로그아웃
      </button>
    </div>
  );
}
