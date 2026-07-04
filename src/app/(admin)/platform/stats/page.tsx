import { PageTitle, StatCard, Panel } from "@/components/admin/ui";
import { getPlatformStats, getAllVillages } from "@/lib/repo/server";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformStatsPage() {
  const [stats, villages] = await Promise.all([getPlatformStats(), getAllVillages()]);

  return (
    <div>
      <PageTitle title="전체 통계" desc="플랫폼 전반의 마을·콘텐츠·예약 현황이에요." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 마을" value={stats.villages} tone="green" sub={`게시 ${stats.published} · 준비 ${stats.draft}`} />
        <StatCard label="소식" value={stats.posts} tone="sky" />
        <StatCard label="체험상품" value={stats.products} tone="brown" />
        <StatCard label="예약" value={stats.bookings} tone="accent" sub={`신규 신청 ${stats.requestedBookings}`} />
      </div>

      <Panel className="mt-6">
        <h2 className="font-display text-lg mb-3">마을별 현황</h2>
        {villages.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-500">
                  <th className="py-2 pr-4 font-semibold">마을</th>
                  <th className="py-2 pr-4 font-semibold">지역</th>
                  <th className="py-2 pr-4 font-semibold">상태</th>
                  <th className="py-2 pr-4 font-semibold">최근 소식</th>
                  <th className="py-2 font-semibold">개설</th>
                </tr>
              </thead>
              <tbody>
                {villages.map((v) => (
                  <tr key={v.id} className="border-b border-line/60">
                    <td className="py-2.5 pr-4 font-semibold">{v.name}</td>
                    <td className="py-2.5 pr-4 text-ink-500">{v.region}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          v.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-black/5 text-ink-500"
                        }`}
                      >
                        {v.status === "published" ? "게시중" : "준비중"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">
                      {v.lastPostedAt ? timeAgo(v.lastPostedAt) : "-"}
                    </td>
                    <td className="py-2.5 text-ink-500">
                      {v.createdAt ? timeAgo(v.createdAt) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-500">마을 데이터가 없어요.</p>
        )}
      </Panel>
    </div>
  );
}
