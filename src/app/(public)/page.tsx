import { HomeClient } from "@/components/home/home-client";
import {
  getPublishedVillageSummaries,
  getGlobalFeed,
  getRecommendedProducts,
  getLatestBriefing,
} from "@/lib/repo/server";

// 준실시간 데이터라 짧은 재검증 (ISR)
export const revalidate = 30;

export default async function HomePage() {
  const [villages, posts, products, briefing] = await Promise.all([
    getPublishedVillageSummaries(),
    getGlobalFeed(12),
    getRecommendedProducts(12),
    getLatestBriefing(),
  ]);

  return (
    <HomeClient
      villages={villages}
      initialPosts={posts}
      products={products}
      latestBriefing={briefing}
    />
  );
}
