"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { Wand2, LayoutList, Palette, Save, Loader2, Eye, Check, RefreshCw } from "lucide-react";
import { useAdmin } from "@/lib/admin/admin-context";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clientDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { paths } from "@/lib/firebase/paths";
import {
  updateVillageLayout,
  saveThemePartial,
  getThemeOnce,
} from "@/lib/repo/client";
import { DEFAULT_LAYOUT, type SectionLayout } from "@/lib/types";
import { SectionsTab } from "@/components/admin/builder/sections-tab";
import { DesignTab, type DesignState } from "@/components/admin/builder/design-tab";
import { AiTab } from "@/components/admin/builder/ai-tab";

type Tab = "ai" | "sections" | "design";

const DEFAULT_DESIGN: DesignState = {
  colorPrimary: "#3e8e41",
  colorAccent: "#e14b5a",
  colorBg: "#fffdf5",
  heroUrl: null,
  mascotUrl: null,
  mascotName: "",
  mascotDesc: "",
  bgmUrl: null,
  bgmLoop: true,
};

export function HomepageBuilder() {
  const { village } = useAdmin();
  const [tab, setTab] = useState<Tab>("ai");
  const [layout, setLayout] = useState<SectionLayout[]>(DEFAULT_LAYOUT);
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);
  // Firebase 미설정이면 로드할 게 없으므로 처음부터 loaded
  const [loaded, setLoaded] = useState(() => !isFirebaseConfigured());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    (async () => {
      const vSnap = await getDoc(doc(clientDb(), paths.village(village.id)));
      const v = vSnap.data();
      if (v?.layout?.length) setLayout(mergeLayout(v.layout));
      const t = await getThemeOnce(village.id);
      if (t) {
        setDesign({
          colorPrimary: t.colorPrimary,
          colorAccent: t.colorAccent,
          colorBg: t.colorBg,
          heroUrl: t.heroUrl ?? null,
          mascotUrl: t.mascotUrl ?? null,
          mascotName: t.mascotName ?? "",
          mascotDesc: t.mascotDesc ?? "",
          bgmUrl: t.bgmUrl ?? null,
          bgmLoop: t.bgmLoop,
        });
      }
      setLoaded(true);
    })();
  }, [village.id]);

  function patchLayout(next: SectionLayout[]) {
    setLayout(next);
    setDirty(true);
  }
  function patchDesign(patch: Partial<DesignState>) {
    setDesign((d) => ({ ...d, ...patch }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        updateVillageLayout(village.id, layout),
        saveThemePartial(village.id, {
          colorPrimary: design.colorPrimary,
          colorAccent: design.colorAccent,
          colorBg: design.colorBg,
          heroUrl: design.heroUrl,
          mascotUrl: design.mascotUrl,
          mascotName: design.mascotName || null,
          mascotDesc: design.mascotDesc || null,
          bgmUrl: design.bgmUrl,
          bgmLoop: design.bgmLoop,
        }),
      ]);
      setDirty(false);
      setSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: Tab; label: string; icon: typeof Wand2 }[] = [
    { key: "ai", label: "자동 구성", icon: Wand2 },
    { key: "sections", label: "섹션 구성", icon: LayoutList },
    { key: "design", label: "디자인", icon: Palette },
  ];

  return (
    <div>
      <PageTitle
        title="홈페이지 만들기"
        desc="마을 정보로 자동 구성하고, 섹션 순서·디자인을 자유롭게 편집해요."
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/v/${village.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-100"
            >
              <Eye size={16} /> 미리보기
            </Link>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? "저장됨" : "저장"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {/* 탭 */}
          <div className="mb-4 inline-flex rounded-full bg-black/5 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    tab === t.key ? "bg-white text-green-800 shadow-sm" : "text-ink-500 hover:text-ink-900"
                  )}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>

          <Panel>
            {!loaded ? (
              <div className="grid place-items-center py-16 text-ink-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : tab === "ai" ? (
              <AiTab
                villageId={village.id}
                villageName={village.name}
                onApplied={() => setPreviewKey((k) => k + 1)}
              />
            ) : tab === "sections" ? (
              <SectionsTab layout={layout} onChange={patchLayout} />
            ) : (
              <DesignTab villageId={village.id} value={design} onChange={patchDesign} />
            )}
          </Panel>
        </div>

        {/* 실시간 미리보기 */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-500">미리보기</span>
            <button
              onClick={() => setPreviewKey((k) => k + 1)}
              className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-green-700"
            >
              <RefreshCw size={13} /> 새로고침
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line shadow-[var(--shadow-card)]">
            <iframe
              key={previewKey}
              src={`/v/${village.slug}`}
              title="홈페이지 미리보기"
              className="h-[600px] w-full bg-white"
            />
          </div>
          {dirty && (
            <p className="mt-2 text-center text-xs text-brown-600">
              변경사항이 있어요. <b>저장</b>하면 미리보기에 반영돼요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** 저장된 layout 에 신규 섹션 키가 누락됐으면 기본에서 보충 */
function mergeLayout(saved: SectionLayout[]): SectionLayout[] {
  const known = new Set(saved.map((s) => s.key));
  const merged = [...saved];
  for (const d of DEFAULT_LAYOUT) {
    if (!known.has(d.key)) merged.push(d);
  }
  return merged;
}
