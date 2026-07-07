import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VillageHome } from "@/components/village/village-home";
import { DraftBanner } from "@/components/village/draft-banner";
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

  const isDraft = bundle.village.status !== "published";
  const user = await getSessionUser();
  const isManager = canManageVillage(user, bundle.village.id);

  if (isDraft && !isManager) notFound();

  return (
    <>
      {isDraft && isManager && (
        <DraftBanner
          villageId={bundle.village.id}
          publishRequestedAt={bundle.village.publishRequestedAt ?? null}
        />
      )}
      <VillageHome bundle={bundle} isManager={isManager} />
    </>
  );
}
