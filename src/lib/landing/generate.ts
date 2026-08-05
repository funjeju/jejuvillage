import "server-only";
import { captureScreenshot } from "@/lib/screenshot";
import type {
  LandingSection,
  LandingSectionType,
  LandingPalette,
} from "@/lib/types";

/**
 * 랜딩 blueprint 생성 공용 로직 (마을모드·독립모드 공용).
 *
 * 흐름: 참조 URL 스크린샷 → 비전 AI 가 디자인 감각을 분석 →
 *       주어진 콘텐츠로 채운 섹션 구성(blueprint) 반환.
 * 저장/권한은 호출하는 라우트가 담당한다.
 */

export const SECTION_TYPES: LandingSectionType[] = [
  "hero",
  "features",
  "story",
  "gallery",
  "stats",
  "testimonial",
  "cta",
  "footer",
];

/** 마을이든 자유 입력이든, 랜딩을 채울 재료를 이 형태로 정규화해 넘긴다 */
export interface LandingContent {
  name: string;
  oneLiner?: string;
  region?: string;
  /** 자유 서술 텍스트(마을 스토리 합본 또는 사용자 입력) */
  description?: string;
  /** 사용할 수 있는 이미지 URL 목록(없으면 이미지 없는 레이아웃으로 생성) */
  images?: string[];
  colors: { primary: string; accent: string; bg: string };
}

export interface BlueprintResult {
  screenshotUrl: string;
  palette: LandingPalette;
  fontMood: string;
  designNote: string;
  sections: LandingSection[];
}

/** 참조 URL + 콘텐츠 → blueprint */
export async function buildBlueprint(
  apiKey: string,
  refUrl: string,
  content: LandingContent
): Promise<BlueprintResult> {
  const shot = await captureScreenshot(refUrl);
  const analysis = await analyzeWithVision(apiKey, shot.imageUrl, content);
  return { screenshotUrl: shot.imageUrl, ...analysis };
}

// ── 비전 분석 ────────────────────────────────────────────────────

interface AnalysisResult {
  palette: LandingPalette;
  fontMood: string;
  designNote: string;
  sections: LandingSection[];
}

async function analyzeWithVision(
  apiKey: string,
  screenshotUrl: string,
  content: LandingContent
): Promise<AnalysisResult> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";

  const contentJson = JSON.stringify(
    {
      name: content.name,
      region: content.region ?? "",
      oneLiner: content.oneLiner ?? "",
      description: content.description ?? "",
      images: content.images ?? [],
      themeColors: content.colors,
    },
    null,
    0
  );

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 랜딩페이지 디자이너다. 참조 랜딩페이지 스크린샷을 보고 그 '시각적 감각(색 팔레트, 섹션 구성과 순서, 레이아웃, 여백감, 분위기)'을 최대한 그대로 재현하되, 콘텐츠는 주어진 자료로 채운 새 랜딩페이지 설계를 만든다. 참조 이미지에서 실제로 보이는 색을 HEX로 추출하고, 섹션 순서와 종류(히어로/특징카드/스토리/갤러리/수치/후기/CTA/푸터)를 그대로 따라간다. 반드시 지정된 JSON 스키마로만 응답한다. 자료에 없는 사실은 지어내지 말고, 이미지 URL은 주어진 것만 사용한다(없으면 imageUrl 생략).",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `아래는 "참조 랜딩페이지"의 전체 스크린샷이다. 이 페이지의 디자인 감각을 복제해서, 주어진 자료로 채운 랜딩페이지 설계(blueprint)를 만들어줘.

[콘텐츠 자료]
${contentJson}

[요구사항]
- palette: 참조 스크린샷에서 실제 추출한 색. bg(배경), text(본문 글자), accent(강조/버튼), primary(주색). 모두 #RRGGBB.
- fontMood: 참조 폰트 느낌 한 단어(예: modern-sans, elegant-serif, rounded-friendly, bold-display).
- designNote: 참조 디자인의 특징을 1~2문장 한국어로 요약.
- sections: 참조의 섹션 순서를 그대로 따른 배열. 각 섹션:
  - type: ${SECTION_TYPES.join(" | ")} 중 하나
  - layout: 레이아웃 힌트(예: fullscreen-left, centered, 3-col-cards, zigzag, 2-col, grid, banner)
  - heading/subheading/body: 주어진 자료로 채운 실제 카피(한국어, 마크다운 금지)
  - items: features/gallery/stats/testimonial 에서 사용. {title, body, icon(lucide 아이콘명 소문자 또는 이모지), imageUrl(images 중에서만), value(stats 수치)}
  - imageUrl: hero/story 등 대표 이미지(images 중에서만, 없으면 생략)
  - bgColor/textColor: 그 섹션이 참조에서 특정 배경색을 쓰면 지정(HEX), 아니면 생략
  - align: left | center | right
  - ctaLabel/ctaHref: cta 섹션이면 버튼 문구와 링크(모르면 "#")

아래 JSON으로만 응답(JSON 외 텍스트 금지):
{
  "palette": {"bg":"#...","text":"#...","accent":"#...","primary":"#..."},
  "fontMood": "...",
  "designNote": "...",
  "sections": [ { "type":"hero", "layout":"...", "heading":"...", "subheading":"...", "align":"left" } ]
}

중요: 반드시 hero 로 시작하고 footer 로 끝나며, 참조와 같은 개수·순서의 섹션을 만들어라. 최소 4개 이상. 제공된 이미지가 없으면 imageUrl 없이 색·타이포로만 구성하라.`,
            },
            { type: "image_url", image_url: { url: screenshotUrl } },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "비전 분석 실패");
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("blueprint 파싱 실패");
  const j = JSON.parse(text.slice(start, end + 1));
  return normalize(j, content);
}

const HEX = /^#[0-9a-fA-F]{6}$/;
function hex(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX.test(v) ? v : fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(j: any, content: LandingContent): AnalysisResult {
  const palette: LandingPalette = {
    bg: hex(j?.palette?.bg, content.colors.bg),
    text: hex(j?.palette?.text, "#1a1a1a"),
    accent: hex(j?.palette?.accent, content.colors.accent),
    primary: hex(j?.palette?.primary, content.colors.primary),
  };

  const allowedImages = new Set(content.images ?? []);

  const rawSections = Array.isArray(j?.sections) ? j.sections : [];
  const sections: LandingSection[] = rawSections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any): LandingSection | null => {
      const type = SECTION_TYPES.includes(s?.type) ? s.type : null;
      if (!type) return null;
      const safeImg = (u: unknown): string | undefined =>
        typeof u === "string" && allowedImages.has(u) ? u : undefined;
      const items = Array.isArray(s?.items)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          s.items.slice(0, 8).map((it: any) => ({
            title: str(it?.title, 80),
            body: str(it?.body, 400),
            icon: str(it?.icon, 40),
            imageUrl: safeImg(it?.imageUrl),
            value: str(it?.value, 40),
          }))
        : undefined;
      return {
        type,
        layout: str(s?.layout, 40),
        heading: str(s?.heading, 200),
        subheading: str(s?.subheading, 300),
        body: str(s?.body, 2000),
        items,
        imageUrl: safeImg(s?.imageUrl),
        bgColor: HEX.test(s?.bgColor ?? "") ? s.bgColor : undefined,
        textColor: HEX.test(s?.textColor ?? "") ? s.textColor : undefined,
        align: ["left", "center", "right"].includes(s?.align) ? s.align : undefined,
        ctaLabel: str(s?.ctaLabel, 40),
        ctaHref: str(s?.ctaHref, 300),
      };
    })
    .filter(Boolean) as LandingSection[];

  return {
    palette,
    fontMood: str(j?.fontMood, 40) || "modern-sans",
    designNote: str(j?.designNote, 400) || "",
    sections: sections.length ? sections : fallbackSections(content),
  };
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s.slice(0, max) : undefined;
}

/** 비전이 섹션을 못 만들었을 때 최소 구성 */
function fallbackSections(content: LandingContent): LandingSection[] {
  const images = content.images ?? [];
  const sections: LandingSection[] = [
    {
      type: "hero",
      layout: "centered",
      heading: content.name,
      subheading: content.oneLiner || content.description?.slice(0, 80),
      imageUrl: images[0],
      align: "center",
    },
  ];
  if (content.description) {
    sections.push({
      type: "story",
      layout: "2-col",
      heading: "소개",
      body: content.description.slice(0, 600),
      imageUrl: images[1],
    });
  }
  if (images.length) {
    sections.push({
      type: "gallery",
      layout: "grid",
      heading: "갤러리",
      items: images.map((url) => ({ imageUrl: url })),
    });
  }
  sections.push({
    type: "footer",
    heading: content.name,
    subheading: content.region,
  });
  return sections;
}
