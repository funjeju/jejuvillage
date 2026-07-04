import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/section";
import { VillageCard } from "@/components/village/village-card";
import { getPublishedVillageSummaries } from "@/lib/repo/server";

export const metadata: Metadata = { title: "마을찾기" };
export const revalidate = 60;

export default async function VillagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const all = await getPublishedVillageSummaries();
  const keyword = q?.trim().toLowerCase() ?? "";
  const villages = keyword
    ? all.filter(
        (v) =>
          v.name.toLowerCase().includes(keyword) ||
          v.region.toLowerCase().includes(keyword) ||
          v.oneLiner.toLowerCase().includes(keyword)
      )
    : all;

  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="🏡 제주 마을"
        title={keyword ? `"${q}" 검색 결과` : "제주 마을 둘러보기"}
        desc={`${villages.length}개의 마을이 여러분을 기다려요.`}
      />
      {villages.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {villages.map((v) => (
            <VillageCard key={v.id} village={v} />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-blob)] border-2 border-dashed border-line bg-white/60 py-20 text-center text-ink-500">
          {keyword
            ? "검색 결과가 없어요. 다른 키워드로 찾아보세요."
            : "아직 공개된 마을이 없어요."}
        </div>
      )}
    </Container>
  );
}
