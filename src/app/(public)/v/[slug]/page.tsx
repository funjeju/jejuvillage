import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye } from "lucide-react";
import { VillageHome } from "@/components/village/village-home";
import { getVillageBundle } from "@/lib/repo/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getVillageBundle(slug);
  if (!bundle) return { title: "마을을 찾을 수 없어요" };
  return {
    title: bundle.village.name,
    description: bundle.village.oneLiner,
    openGraph: {
      title: bundle.village.name,
      description: bundle.village.oneLiner,
      images: bundle.theme?.heroUrl ? [bundle.theme.heroUrl] : undefined,
    },
  };
}

export default async function VillageHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getVillageBundle(slug);
  if (!bundle) notFound();

  // 비공개(draft) 마을은 해당 마을 운영자/플랫폼 관리자만 미리보기 가능
  const isDraft = bundle.village.status !== "published";
  if (isDraft) {
    const user = await getSessionUser();
    if (!canManageVillage(user, bundle.village.id)) notFound();
  }

  return (
    <>
      {isDraft && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-brown-500 px-4 py-2 text-sm font-semibold text-white">
          <Eye size={15} />
          미리보기 — 이 홈페이지는 아직 <b>비공개</b>예요. 운영자에게만 보입니다.
          <Link href="/admin" className="underline underline-offset-2">
            대시보드에서 게시하기 →
          </Link>
        </div>
      )}
      <VillageHome bundle={bundle} />
    </>
  );
}
