"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sprout, Loader2, AlertCircle } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition";

function LoginInner() {
  const router = useRouter();
  const { user, loading, signIn, signInWithGoogle, configured } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인된 상태면 로그인 폼 대신 관리 화면으로 보낸다
  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
      router.refresh();
    }
  }, [loading, user, router]);

  async function goAdmin() {
    router.push("/admin");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await signIn(String(fd.get("email")), String(fd.get("password")));
      await goAdmin();
    } catch (err) {
      setError(mapAuthError((err as Error).message));
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      await goAdmin();
    } catch (err) {
      setError(mapAuthError((err as Error).message));
      setGoogleBusy(false);
    }
  }

  // 인증 상태 확인 중이거나 이미 로그인됨 → 폼 대신 이동 안내 (폼 깜빡임 방지)
  if (loading || user) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-sky-100 to-green-100 p-4">
        <div className="flex flex-col items-center gap-3 text-ink-700">
          <Loader2 size={28} className="animate-spin text-green-700" />
          <p className="text-sm font-semibold">
            {user ? "이미 로그인되어 있어요. 관리 화면으로 이동해요…" : "로그인 상태 확인 중…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-sky-100 to-green-100 p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-green-700 text-white">
            <Sprout size={24} />
          </span>
          <span className="font-display text-2xl">제주마을</span>
        </Link>

        <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-6 shadow-[var(--shadow-float)]">
          <h1 className="font-display text-2xl text-center">시작하기</h1>
          <p className="mt-1 text-center text-sm text-ink-500">
            구글 계정으로 로그인하면 바로 우리 마을 홈페이지를 만들 수 있어요.
          </p>

          {!configured && (
            <div className="mt-4 flex gap-2 rounded-xl bg-cream-100 border border-brown-300/40 p-3 text-xs text-brown-600">
              <AlertCircle size={16} className="shrink-0" />
              Firebase 환경변수가 아직 설정되지 않았어요. <code>.env.local</code> 에 키를
              넣으면 로그인이 활성화됩니다.
            </div>
          )}

          {/* 구글 로그인 (주 로그인) */}
          <button
            type="button"
            onClick={onGoogle}
            disabled={googleBusy || !configured}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-5 py-3 font-semibold text-ink-900 shadow-sm transition hover:bg-black/[0.03] disabled:opacity-50"
          >
            {googleBusy ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon />}
            {googleBusy ? "로그인 중…" : "Google로 계속하기"}
          </button>

          {error && (
            <p className="mt-3 rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent)] font-semibold">
              {error}
            </p>
          )}

          <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
            <span className="h-px flex-1 bg-line" /> 또는 이메일 <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input name="email" type="email" required placeholder="이메일" className={field} />
            <input name="password" type="password" required placeholder="비밀번호" className={field} />
            <Button type="submit" variant="soft" size="lg" className="w-full" disabled={submitting || !configured}>
              {submitting && <Loader2 size={20} className="animate-spin" />}
              {submitting ? "로그인 중…" : "이메일로 로그인"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-500">
            처음이신가요? 구글 로그인만 하면 바로 마을 개설이 시작돼요.
          </p>
        </div>

        <Link href="/" className="mt-6 block text-center text-sm text-ink-500 hover:text-green-700">
          ← 제주마을 홈으로
        </Link>
      </div>
    </div>
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

function mapAuthError(msg: string): string {
  if (msg.includes("popup-closed") || msg.includes("cancelled-popup")) return "로그인 창이 닫혔어요. 다시 시도해 주세요.";
  if (msg.includes("popup-blocked")) return "팝업이 차단됐어요. 팝업을 허용해 주세요.";
  if (msg.includes("unauthorized-domain")) return "이 도메인이 Firebase 승인 도메인에 없어요. 콘솔에서 도메인을 추가해 주세요.";
  if (msg.includes("operation-not-allowed")) return "구글 로그인이 아직 활성화되지 않았어요(Firebase 콘솔에서 사용 설정 필요).";
  if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (msg.includes("too-many-requests")) return "잠시 후 다시 시도해 주세요.";
  if (msg.includes("invalid-email")) return "이메일 형식을 확인해 주세요.";
  return msg || "로그인에 실패했어요.";
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}
