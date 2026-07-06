"use client";

import Link from "next/link";
import { Wand2, LayoutDashboard, LogIn } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";

/**
 * 메인 하단 고정 CTA (모바일 핵심 동선).
 * 로그인 상태에 따라: 비로그인 → 구글로 시작 / 마을 없음 → 홈페이지 만들기 / 마을 있음 → 관리.
 */
export function HomeCtaBar() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}

function Inner() {
  const { user, managedVillages, loading, configured } = useAuth();
  if (!configured || loading) return null;

  let href = "/login";
  let label = "구글로 우리 마을 만들기";
  let Icon = LogIn;
  if (user) {
    if (managedVillages.length > 0) {
      href = "/admin";
      label = "내 마을 관리하기";
      Icon = LayoutDashboard;
    } else {
      href = "/admin";
      label = "우리 마을 홈페이지 만들기";
      Icon = Wand2;
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4">
      <Link
        href={href}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-green-700 px-6 py-4 font-display text-base sm:text-lg font-semibold text-white shadow-[0_10px_30px_-8px_rgba(47,107,51,0.7)] ring-4 ring-white/40 transition active:scale-[0.98] hover:bg-green-800 w-full max-w-md justify-center"
      >
        <Icon size={20} />
        {label}
      </Link>
    </div>
  );
}
