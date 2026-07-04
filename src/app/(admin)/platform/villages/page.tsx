import { PlatformVillages } from "@/components/platform/platform-villages";
import { getAllVillages } from "@/lib/repo/server";

export const dynamic = "force-dynamic";

export default async function PlatformVillagesPage() {
  const villages = await getAllVillages();
  return <PlatformVillages villages={villages} />;
}
