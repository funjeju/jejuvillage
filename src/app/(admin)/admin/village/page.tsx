"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel, adminField, adminLabel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { updateVillageInfo } from "@/lib/repo/client";
import { getDoc, doc } from "firebase/firestore";
import { clientDb } from "@/lib/firebase/client";
import { paths } from "@/lib/firebase/paths";
import { villageInfoInputSchema } from "@/lib/schemas";

export default function AdminVillagePage() {
  const { village } = useAdmin();
  const [name, setName] = useState(village.name);
  const [region, setRegion] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [seasonTag, setSeasonTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    getDoc(doc(clientDb(), paths.village(village.id))).then((s) => {
      const d = s.data();
      if (!d) return;
      setName(d.name ?? "");
      setRegion(d.region ?? "");
      setOneLiner(d.oneLiner ?? "");
      setLat(String(d.lat ?? ""));
      setLng(String(d.lng ?? ""));
      setSeasonTag(d.seasonTag ?? "");
    });
  }, [village.id]);

  async function save() {
    setError(null);
    setSaved(false);
    const parsed = villageInfoInputSchema.safeParse({
      name,
      region,
      oneLiner,
      lat,
      lng,
      seasonTag: seasonTag || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      await updateVillageInfo(village.id, parsed.data);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageTitle title="마을 기본정보" desc="마을 이름·위치·소개를 관리해요. 지도 좌표는 제주 범위(위도 33~34, 경도 126~127)여야 해요." />

      <Panel className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={adminLabel}>마을 이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={adminField} />
          </div>
          <div>
            <label className={adminLabel}>지역</label>
            <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="제주시 한경면" className={adminField} />
          </div>
        </div>

        <div>
          <label className={adminLabel}>한줄 소개</label>
          <input value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="물을 찾아 세운 마을 — 빌레 위를 걷는 느린 여행" className={adminField} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={adminLabel}>위도 (lat)</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="33.337" className={adminField} />
          </div>
          <div>
            <label className={adminLabel}>경도 (lng)</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="126.229" className={adminField} />
          </div>
        </div>

        <div>
          <label className={adminLabel}>시즌 태그 (선택)</label>
          <input value={seasonTag} onChange={(e) => setSeasonTag(e.target.value)} placeholder="장미철" className={adminField} />
          <p className="mt-1 text-xs text-ink-500">제철 콘텐츠를 강조할 때 사용해요 (예: 장미돌담길 5~6월).</p>
        </div>

        {error && <p className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={save} disabled={busy} size="lg">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            저장하기
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
              <Check size={16} /> 저장됐어요
            </span>
          )}
        </div>
      </Panel>
    </div>
  );
}
