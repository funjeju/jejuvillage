import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LandingView } from "@/components/village/landing-view";
import { getVillageBySlug, getLandingBlueprint } from "@/lib/repo/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const village = await getVillageBySlug(slug);
  if (!village) return { title: "마을을 찾을 수 없어요" };
  return {
    title: `${village.name} · 랜딩`,
    description: village.oneLiner,
  };
}

export default async function VillageLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const village = await getVillageBySlug(slug);
  if (!village) notFound();

  const blueprint = await getLandingBlueprint(slug);

  // 랜딩 미생성: 관리자에게는 안내, 일반 방문자는 홈으로 유도
  if (!blueprint || blueprint.sections.length === 0) {
    const user = await getSessionUser();
    const isManager = canManageVillage(user, village.id);
    if (!isManager) notFound();
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">랜딩페이지가 아직 없어요</h1>
        <p className="text-neutral-600">
          관리자 콘솔에서 참조 URL을 입력하면 이 마을의 랜딩페이지가 생성됩니다.
        </p>
        <Link
          href="/admin/landing"
          className="rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white"
        >
          랜딩 만들러 가기
        </Link>
      </div>
    );
  }

  return <LandingView blueprint={blueprint} />;
}
