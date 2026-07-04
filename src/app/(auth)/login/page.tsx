"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sprout, Loader2, AlertCircle } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition";

function LoginInner() {
  const router = useRouter();
  const { signIn, configured } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await signIn(String(fd.get("email")), String(fd.get("password")));
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(mapAuthError((err as Error).message));
      setSubmitting(false);
    }
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
          <h1 className="font-display text-2xl text-center">운영자 로그인</h1>
          <p className="mt-1 text-center text-sm text-ink-500">
            마을 홈페이지를 관리하는 운영자용 공간이에요.
          </p>

          {!configured && (
            <div className="mt-4 flex gap-2 rounded-xl bg-cream-100 border border-brown-300/40 p-3 text-xs text-brown-600">
              <AlertCircle size={16} className="shrink-0" />
              Firebase 환경변수가 아직 설정되지 않았어요. <code>.env.local</code> 에 키를
              넣으면 로그인이 활성화됩니다.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <input name="email" type="email" required placeholder="이메일" className={field} />
            <input name="password" type="password" required placeholder="비밀번호" className={field} />
            {error && (
              <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent)] font-semibold">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={submitting || !configured}>
              {submitting && <Loader2 size={20} className="animate-spin" />}
              {submitting ? "로그인 중…" : "로그인"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-500">
            계정이 없으신가요? 플랫폼 관리자에게 초대를 요청하세요.
          </p>
        </div>

        <Link href="/" className="mt-6 block text-center text-sm text-ink-500 hover:text-green-700">
          ← 제주마을 홈으로
        </Link>
      </div>
    </div>
  );
}

function mapAuthError(msg: string): string {
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
