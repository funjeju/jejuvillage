import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingView } from "@/components/village/landing-view";
import { getLandingProject } from "@/lib/repo/server";

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bp = await getLandingProject(slug);
  if (!bp) return { title: "랜딩을 찾을 수 없어요" };
  return {
    title: bp.name || "랜딩페이지",
    description: bp.designNote || undefined,
    openGraph: {
      title: bp.name || "랜딩페이지",
      images: bp.screenshotUrl ? [bp.screenshotUrl] : undefined,
    },
  };
}

export default async function StandaloneLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bp = await getLandingProject(slug);
  if (!bp || bp.sections.length === 0) notFound();
  return <LandingView blueprint={bp} />;
}
