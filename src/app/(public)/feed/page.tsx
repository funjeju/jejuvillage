import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/section";
import { FeedClient } from "@/components/feed/feed-client";
import { getGlobalFeed } from "@/lib/repo/server";

export const metadata: Metadata = { title: "전체 소식" };
export const revalidate = 20;

export default async function FeedPage() {
  const posts = await getGlobalFeed(60);
  return (
    <Container className="py-10">
      <SectionHeading
        eyebrow="🌱 실시간"
        title="제주 마을 소식 모아보기"
        desc="여러 마을이 올린 사진 소식을 한 곳에서. 마을별로 필터할 수 있어요."
      />
      <FeedClient initialPosts={posts} />
    </Container>
  );
}
