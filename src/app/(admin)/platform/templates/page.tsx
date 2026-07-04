import { PageTitle, Panel } from "@/components/admin/ui";

/**
 * 템플릿 프리셋 관리 (P2, FR-PLT-02).
 * MVP: 기본 제공 프리셋 3종을 소개. 마을은 /admin/theme 에서 프리셋 선택 후 색상 커스터마이즈.
 * (프리셋 추가/편집 CRUD는 후속.)
 */
const PRESETS = [
  {
    key: "warm",
    label: "감성·따뜻",
    desc: "크림 배경 + 장미 레드 강조. 이야기 있는 마을에 어울려요.",
    primary: "#3e8e41",
    accent: "#e14b5a",
    bg: "#fffdf5",
  },
  {
    key: "clean",
    label: "깔끔·정보",
    desc: "화이트 배경 + 하늘 블루. 정보 전달이 중요한 마을에.",
    primary: "#2f6b33",
    accent: "#0288d1",
    bg: "#ffffff",
  },
  {
    key: "trendy",
    label: "트렌디·MZ",
    desc: "라벤더 배경 + 코랄 강조. 젊은 감각의 마을에.",
    primary: "#5c6bc0",
    accent: "#ff7043",
    bg: "#faf7ff",
  },
];

export default function PlatformTemplatesPage() {
  return (
    <div>
      <PageTitle
        title="템플릿 프리셋"
        desc="마을 홈에 적용되는 기본 테마 프리셋이에요. 마을 운영자는 [테마·마스코트] 화면에서 선택·커스터마이즈합니다."
      />
      <div className="grid gap-5 sm:grid-cols-3">
        {PRESETS.map((p) => (
          <Panel key={p.key} className="p-0 overflow-hidden">
            <div className="h-24 flex items-end p-3" style={{ background: p.primary }}>
              <div className="flex gap-1.5">
                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ background: p.accent }} />
                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ background: p.bg }} />
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-display text-lg">{p.label}</h3>
              <p className="mt-1 text-sm text-ink-500">{p.desc}</p>
              <code className="mt-2 inline-block text-xs text-ink-500">preset: {p.key}</code>
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="mt-6 text-sm text-ink-500">
        프리셋 추가·편집(FR-PLT-02) 및 마을 일괄 배포는 후속 단계에서 제공될 예정이에요.
      </Panel>
    </div>
  );
}
