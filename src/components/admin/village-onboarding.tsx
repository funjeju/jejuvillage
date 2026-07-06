"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Loader2, LogOut, Wand2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { adminField, adminLabel } from "@/components/admin/ui";
import { villageCreateSchema } from "@/lib/schemas";

export function VillageOnboarding({ userName }: { userName: string }) {
  return (
    <AuthProvider>
      <Onboard userName={userName} />
    </AuthProvider>
  );
}

function Onboard({ userName }: { userName: string }) {
  const router = useRouter();
  const { refreshSession, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = {
      slug: String(fd.get("slug") ?? ""),
      name: String(fd.get("name") ?? ""),
      region: String(fd.get("region") ?? ""),
      oneLiner: String(fd.get("oneLiner") ?? ""),
      lat: fd.get("lat"),
      lng: fd.get("lng"),
    };
    const parsed = villageCreateSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/villages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "마을 개설 실패");
      // 권한(claims) 갱신 후 어드민으로
      await refreshSession();
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function logout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-100 to-green-100 p-4">
      <div className="mx-auto max-w-xl pt-10">
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-display text-xl text-green-800">
            <Sprout size={22} /> 제주마을
          </span>
          <button onClick={logout} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-green-800">
            <LogOut size={15} /> 로그아웃
          </button>
        </div>

        <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-6 sm:p-8 shadow-[var(--shadow-float)]">
          <h1 className="font-display text-2xl sm:text-3xl">
            {userName}님, 환영해요! 🌱
          </h1>
          <p className="mt-2 text-ink-700">
            우리 마을 홈페이지를 만들어볼까요? 기본 정보만 입력하면 마을 홈이 자동으로
            생성돼요. 이후 <b>자료를 올리면 AI가 홈페이지를 구성</b>하고, 섹션·테마·마스코트·
            음악까지 자유롭게 편집할 수 있어요.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabel}>마을 이름</label>
                <input name="name" required placeholder="조수리" className={adminField} />
              </div>
              <div>
                <label className={adminLabel}>주소용 영문 slug</label>
                <input name="slug" required placeholder="josuri" className={adminField} />
                <p className="mt-1 text-xs text-ink-500">홈페이지 주소가 돼요: /v/여기</p>
              </div>
            </div>
            <div>
              <label className={adminLabel}>지역</label>
              <input name="region" required placeholder="제주시 한경면" className={adminField} />
            </div>
            <div>
              <label className={adminLabel}>한줄 소개 (선택)</label>
              <input name="oneLiner" placeholder="물을 찾아 세운 마을 — 빌레 위를 걷는 느린 여행" className={adminField} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={adminLabel}>위도 (제주 33~34)</label>
                <input name="lat" required placeholder="33.337" className={adminField} />
              </div>
              <div>
                <label className={adminLabel}>경도 (제주 126~127)</label>
                <input name="lng" required placeholder="126.229" className={adminField} />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)]">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {busy ? "만드는 중…" : "마을 홈페이지 만들기"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
