"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout, Loader2, AlertCircle, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { LandingEditor } from "@/components/admin/landing-editor";
import type { AdminVillage } from "@/lib/admin/admin-context";

/**
 * 독립 랜딩페이지 생성 진입점 (도메인/landing).
 * /admin 콘솔의 온보딩 게이트에 막히지 않도록 자체적으로
 * 로그인 → 대상 마을 선택 → 랜딩 에디터를 렌더한다.
 */
function LandingInner() {
  const {
    user,
    loading,
    sessionSynced,
    managedVillages,
    role,
    configured,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message || "로그인에 실패했어요.");
    } finally {
      setGoogleBusy(false);
    }
  }

  // ── 환경변수 미설정 ──
  if (!configured) {
    return (
      <Center>
        <div className="flex max-w-sm gap-2 rounded-xl bg-cream-100 border border-brown-300/40 p-4 text-sm text-brown-600">
          <AlertCircle size={18} className="shrink-0" />
          Firebase 환경변수가 아직 설정되지 않았어요.
        </div>
      </Center>
    );
  }

  // ── 인증 확인 중 ──
  if (loading) {
    return (
      <Center>
        <Loader2 size={28} className="animate-spin text-green-700" />
        <p className="text-sm font-semibold text-ink-700">로그인 상태 확인 중…</p>
      </Center>
    );
  }

  // ── 미로그인 → 여기서 바로 로그인 ──
  if (!user || !sessionSynced) {
    return (
      <Center>
        <div className="w-full max-w-sm rounded-[var(--radius-blob)] border border-line/80 bg-white p-6 shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-700 text-white">
              <Sprout size={22} />
            </span>
            <span className="font-display text-xl">랜딩페이지 만들기</span>
          </div>
          <p className="mt-3 text-center text-sm text-ink-500">
            구글 계정으로 로그인하면 참조 URL 기반 랜딩을 만들 수 있어요.
          </p>
          <button
            type="button"
            onClick={onGoogle}
            disabled={googleBusy}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-5 py-3 font-semibold text-ink-900 shadow-sm transition hover:bg-black/[0.03] disabled:opacity-50"
          >
            {googleBusy ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon />}
            {googleBusy ? "로그인 중…" : "Google로 계속하기"}
          </button>
          {error && (
            <p className="mt-3 rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)]">
              {error}
            </p>
          )}
        </div>
      </Center>
    );
  }

  // ── 로그인은 됐지만 대상 마을이 없음 ──
  if (managedVillages.length === 0) {
    return (
      <Center>
        <div className="w-full max-w-md rounded-[var(--radius-blob)] border border-line/80 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <h1 className="font-display text-xl">아직 마을이 없어요</h1>
          <p className="mt-2 text-sm text-ink-500">
            랜딩페이지는 마을 자료(소개·이미지·색)를 재료로 만들어요.
            {role === "platform_admin"
              ? " 플랫폼 관리자 계정에는 직접 관리하는 마을이 없습니다. 마을 운영자 계정으로 로그인하거나 마을을 개설해 주세요."
              : " 먼저 마을을 개설하면 이 화면에서 랜딩을 만들 수 있어요."}
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-block rounded-full bg-green-700 px-6 py-2.5 text-sm font-semibold text-white"
          >
            마을 개설하러 가기
          </Link>
          <SignOutRow onSignOut={signOut} />
        </div>
      </Center>
    );
  }

  // ── 정상: 대상 마을 선택 + 에디터 ──
  const villageId = selected ?? managedVillages[0];
  const village: AdminVillage = { id: villageId, slug: villageId, name: villageId };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg text-green-800">
          <Sprout size={20} /> 제주마을
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-green-700"
        >
          <LogOut size={16} /> 로그아웃
        </button>
      </div>

      {managedVillages.length > 1 && (
        <div className="mb-5 rounded-xl border border-line bg-white p-4">
          <label className="mb-1.5 block text-sm font-semibold text-ink-900">
            어느 마을의 랜딩을 만들까요?
          </label>
          <select
            value={villageId}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-green-600"
          >
            {managedVillages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 마을 선택이 바뀌면 에디터 상태를 초기화 */}
      <LandingEditor key={villageId} village={village} />
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-sky-50 to-green-50 p-4">
      <div className="flex flex-col items-center gap-3">{children}</div>
    </div>
  );
}

function SignOutRow({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      onClick={onSignOut}
      className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-400 hover:text-green-700 mx-auto"
    >
      <LogOut size={14} /> 다른 계정으로 로그인
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.6l-6.6-5.6C29.6 34.4 26.9 35.3 24 35.3c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.5 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export default function LandingBuilderPage() {
  return (
    <AuthProvider>
      <LandingInner />
    </AuthProvider>
  );
}
