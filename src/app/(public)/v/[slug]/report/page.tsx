import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { Container } from "@/components/ui/section";
import { VillageReportView } from "@/components/village/village-report";
import { getVillageBySlug, getVillageReport } from "@/lib/repo/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const village = await getVillageBySlug(slug);
  return { title: village ? `${village.name} 관광 리포트` : "마을 리포트" };
}

export default async function VillageReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const village = await getVillageBySlug(slug);
  if (!village) notFound();

  const report = await getVillageReport(village.id);
  const isPublic = village.status === "published" && report?.enabled;

  // 공개 아님 → 운영자/플랫폼 관리자만 미리보기
  if (!isPublic) {
    const user = await getSessionUser();
    if (!report || !canManageVillage(user, village.id)) notFound();
  }

  const isPreview = !isPublic;

  return (
    <div>
      {isPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-brown-500 px-4 py-2 text-sm font-semibold text-white">
          <Eye size={15} /> 미리보기 — 리포트가 아직 공개되지 않았어요(운영자에게만 보임).
        </div>
      )}
      <Container className="pt-6">
        <Link href={`/v/${slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline">
          <ArrowLeft size={15} /> {village.name} 홈으로
        </Link>
      </Container>
      <VillageReportView village={village} report={report!} />
    </div>
  );
}
