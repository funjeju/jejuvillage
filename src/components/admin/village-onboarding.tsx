"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sprout,
  LogOut,
  Loader2,
  FileText,
  Music,
  ImagePlus,
  Wand2,
  Check,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { adminField } from "@/components/admin/ui";
import { villageCreateSchema } from "@/lib/schemas";
import { uploadImageTo, uploadAudio } from "@/lib/firebase/storage";
import { applyGeneratedHomepage, saveThemePartial } from "@/lib/repo/client";
import { isValidSlug } from "@/lib/utils";

export function VillageOnboarding({ userName }: { userName: string }) {
  return (
    <AuthProvider>
      <Wizard userName={userName} />
    </AuthProvider>
  );
}

const JEJU = { lat: 33.38, lng: 126.55 };
const AUDIO_MAX_MB = 8;

function Wizard({ userName }: { userName: string }) {
  const router = useRouter();
  const { refreshSession, signOut } = useAuth();

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [mascotUrl, setMascotUrl] = useState<string | null>(null);
  const [mascotName, setMascotName] = useState("");
  const [bgmUrl, setBgmUrl] = useState<string | null>(null);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [mascotBusy, setMascotBusy] = useState(false);
  const [bgmBusy, setBgmBusy] = useState(false);
  const [genMsg, setGenMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pdfRef = useRef<HTMLInputElement>(null);
  const mascotRef = useRef<HTMLInputElement>(null);
  const bgmRef = useRef<HTMLInputElement>(null);

  const slugReady = isValidSlug(slug);

  async function onPdf(file?: File) {
    if (!file) return;
    setError(null);
    setPdfBusy(true);
    try {
      const res = await fetch("/api/admin/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "PDF 읽기 실패");
      setDesc((prev) => (prev ? prev + "\n\n" : "") + data.text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPdfBusy(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
  }

  async function onMascot(file?: File) {
    if (!file || !slugReady) return;
    setError(null);
    setMascotBusy(true);
    try {
      const up = await uploadImageTo(`villages/${slug}/mascot`, file, 600);
      setMascotUrl(up.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setMascotBusy(false);
    }
  }

  async function onBgm(file?: File) {
    if (!file || !slugReady) return;
    if (file.size > AUDIO_MAX_MB * 1024 * 1024) {
      setError(`음악은 최대 ${AUDIO_MAX_MB}MB까지 올릴 수 있어요.`);
      return;
    }
    setError(null);
    setBgmBusy(true);
    try {
      const { url } = await uploadAudio(slug, file);
      setBgmUrl(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBgmBusy(false);
    }
  }

  async function generate() {
    setError(null);
    const parsed = villageCreateSchema.safeParse({
      name,
      region,
      slug,
      oneLiner: "",
      lat: JEJU.lat,
      lng: JEJU.lng,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "마을 이름·지역·영문주소를 확인해 주세요.");
      return;
    }

    try {
      setGenMsg("마을 만드는 중…");
      const cr = await fetch("/api/villages/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const crd = await cr.json();
      if (!cr.ok) throw new Error(crd.error ?? "마을 개설 실패");

      // 권한(claims) 갱신 → 이후 클라이언트 쓰기 허용
      setGenMsg("권한 설정 중…");
      await refreshSession();

      // 설명이 있으면 AI 자동 구성
      if (desc.trim().length >= 20) {
        setGenMsg("설명으로 홈페이지 구성 중…");
        const g = await fetch("/api/admin/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ villageId: slug, villageName: name, rawText: desc }),
        });
        const gd = await g.json();
        if (g.ok && gd.data) {
          await applyGeneratedHomepage(slug, gd.data);
        }
      }

      // 캐릭터·음악 반영
      const themePatch: Record<string, unknown> = {};
      if (mascotUrl) themePatch.mascotUrl = mascotUrl;
      if (mascotName) themePatch.mascotName = mascotName;
      if (bgmUrl) themePatch.bgmUrl = bgmUrl;
      if (Object.keys(themePatch).length) {
        setGenMsg("캐릭터·음악 넣는 중…");
        await saveThemePartial(slug, themePatch);
      }

      setGenMsg("완성! 홈페이지로 이동해요…");
      router.push(`/v/${slug}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setGenMsg(null);
    }
  }

  const generating = genMsg !== null;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-sky-100 to-green-100 pb-28">
      {/* 상단바 */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur">
        <span className="inline-flex items-center gap-2 font-display text-lg text-green-800">
          <Sprout size={20} /> 제주마을
        </span>
        <button onClick={signOut} className="inline-flex items-center gap-1 text-sm text-ink-600">
          <LogOut size={15} /> 로그아웃
        </button>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5">
        <h1 className="font-display text-2xl sm:text-3xl">
          {userName}님, 우리 마을 홈페이지 만들기 🌱
        </h1>
        <p className="mt-1.5 text-sm text-ink-700">
          아래를 채우고 <b>생성하기</b>만 누르면 홈페이지가 뚝딱 만들어져요.
        </p>

        {/* ① 마을 기본 */}
        <StepCard n={1} title="마을 기본 정보">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="마을 이름 (예: 조수리)" className={adminField} />
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역 (예: 제주시 한경면)" className={adminField} />
          </div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="영문 주소 (예: josuri)"
            className={`${adminField} mt-3`}
          />
          <p className="mt-1 text-xs text-ink-500">
            홈페이지 주소가 돼요: <b>/v/{slug || "영문주소"}</b>
            {slug && !slugReady && <span className="text-[var(--accent)]"> · 영소문자·숫자·하이픈만</span>}
          </p>
        </StepCard>

        {/* ② 설명 / PDF */}
        <StepCard n={2} title="마을 설명 붙여넣기 또는 PDF 업로드">
          <p className="mb-2 text-sm text-ink-600">
            마을 소개·역사·자원·특산물을 아는 대로 붙여넣거나, 소개 PDF를 올리면 AI가
            홈페이지 내용을 자동으로 구성해요.
          </p>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={5}
            placeholder="예) 조수리는 물이 귀해 주민들이 물통을 파 식수를 마련한 데서 유래한 마을. 빌레용암 사장밭, 480년 팽나무, 봄철 장미돌담길…"
            className={adminField}
          />
          <button
            type="button"
            onClick={() => pdfRef.current?.click()}
            disabled={pdfBusy}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-300/60 disabled:opacity-50"
          >
            {pdfBusy ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            {pdfBusy ? "PDF 읽는 중…" : "PDF 파일 올리기"}
          </button>
          <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => onPdf(e.target.files?.[0])} />
        </StepCard>

        {/* ③ 캐릭터 */}
        <StepCard n={3} title="마을 캐릭터(마스코트)">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => (slugReady ? mascotRef.current?.click() : setError("먼저 영문 주소를 입력해 주세요."))}
              className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-white text-ink-500"
            >
              {mascotUrl ? (
                <Image src={mascotUrl} alt="" fill sizes="96px" className="object-contain" />
              ) : (
                <span className="text-center text-xs"><ImagePlus className="mx-auto mb-1" /> 사진</span>
              )}
              {mascotBusy && <span className="absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="animate-spin text-green-700" /></span>}
            </button>
            <div className="flex-1">
              <input value={mascotName} onChange={(e) => setMascotName(e.target.value)} placeholder="캐릭터 이름 (예: 조수이)" className={adminField} />
              <p className="mt-2 text-xs text-ink-500">
                캐릭터 이미지를 올려요. <span className="text-green-700">AI 생성</span>은 마을이 만들어진 뒤
                편집 화면에서 쓸 수 있어요.
              </p>
            </div>
          </div>
          <input ref={mascotRef} type="file" accept="image/*" className="hidden" onChange={(e) => onMascot(e.target.files?.[0])} />
        </StepCard>

        {/* ④ 배경음악 */}
        <StepCard n={4} title="배경음악 (선택)">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => (slugReady ? bgmRef.current?.click() : setError("먼저 영문 주소를 입력해 주세요."))}
              disabled={bgmBusy}
              className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-300/60 disabled:opacity-50"
            >
              {bgmBusy ? <Loader2 size={15} className="animate-spin" /> : <Music size={15} />}
              음악 파일 (MP3)
            </button>
            {bgmUrl && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
                <Check size={15} /> 음악 추가됨
              </span>
            )}
          </div>
          <input ref={bgmRef} type="file" accept="audio/mpeg,audio/mp3,audio/aac" className="hidden" onChange={(e) => onBgm(e.target.files?.[0])} />
        </StepCard>

        {error && (
          <p className="mt-4 rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">
            {error}
          </p>
        )}
      </div>

      {/* 하단 고정 생성 버튼 (모바일 핵심) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <button
            onClick={generate}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-6 py-4 font-display text-lg font-semibold text-white shadow-[0_8px_20px_-6px_rgba(47,107,51,0.6)] transition active:scale-[0.98] disabled:opacity-70"
          >
            {generating ? <Loader2 size={22} className="animate-spin" /> : <Wand2 size={22} />}
            {genMsg ?? "홈페이지 생성하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-[var(--radius-blob)] bg-white border border-line/80 p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-green-700 text-sm font-bold text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
