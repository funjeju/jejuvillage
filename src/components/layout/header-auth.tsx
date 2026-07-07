"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";

/**
 * 상단바 우측 인증 버튼 — 로그인 상태를 실시간 반영.
 * 비로그인: '운영자 로그인' / 로그인: 아바타 + '내 마을 관리' (플랫폼 관리자는 /admin→/platform 자동 라우팅)
 */
export function HeaderAuth() {
  return (
    <AuthProvider>
      <Inner />
    </AuthProvider>
  );
}

function Inner() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return (
      <Link
        href="/admin"
        className="ml-0.5 sm:ml-1 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-green-700 text-white whitespace-nowrap hover:bg-green-800 transition-colors"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={20}
            height={20}
            className="rounded-full"
          />
        ) : (
          <LayoutDashboard size={16} />
        )}
        <span className="sm:hidden">내 마을</span>
        <span className="hidden sm:inline">내 마을 관리</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="ml-0.5 sm:ml-1 px-3 sm:px-4 py-2 rounded-full bg-green-700 text-white whitespace-nowrap hover:bg-green-800 transition-colors"
    >
      <span className="sm:hidden">로그인</span>
      <span className="hidden sm:inline">운영자 로그인</span>
    </Link>
  );
}
