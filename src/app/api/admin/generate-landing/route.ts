import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/paths";
import { captureScreenshot, isFetchableUrl } from "@/lib/screenshot";
import { FieldValue } from "firebase-admin/firestore";
import type {
  LandingBlueprint,
  LandingSection,
  LandingSectionType,
  LandingPalette,
} from "@/lib/types";

export const maxDuration = 120;

/**
 * 참조 URL → 랜딩페이지 blueprint 생성.
 *
 * 흐름:
 *  1) 참조 URL 을 외부 스크린샷 API 로 실제 렌더 캡처
 *  2) 스크린샷 + 마을 자료를 OpenAI Vision 에 넘겨 "디자인 감각을 복제한" 섹션 구성 추출
 *  3) villages/{vid}/landing/main 에 저장
 *
 * 관리자가 미리보고 다시 생성할 수 있도록 blueprint 를 그대로 반환한다.
 */

const SECTION_TYPES: LandingSectionType[] = [
  "hero",
  "features",
  "story",
  "gallery",
  "stats",
  "testimonial",
  "cta",
  "footer",
];

interface VillageContent {
  name: string;
  region: string;
  oneLiner: string;
  heroUrl: string | null;
  mascotUrl: string | null;
  mascotName: string | null;
  colorPrimary: string;
  colorAccent: string;
  colorBg: string;
  stories: { title: string; body: string }[];
  gallery: string[];
}

export async function POST(req: NextRequest) {
  const { villageId, refUrl } = (await req.json().catch(() => ({}))) as {
    villageId?: string;
    refUrl?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (!refUrl) {
    return NextResponse.json({ error: "참조 URL을 입력해 주세요." }, { status: 422 });
  }
  const urlCheck = isFetchableUrl(refUrl);
  if (!urlCheck.ok) {
    return NextResponse.json({ error: urlCheck.reason }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았어요." },
      { status: 400 }
    );
  }

  try {
    // 1) 마을 자료 로드 (villageId === slug === 문서 ID)
    const content = await loadVillageContent(villageId);
    if (!content) {
      return NextResponse.json({ error: "마을을 찾을 수 없어요." }, { status: 404 });
    }

    // 2) 참조 URL 스크린샷
    const shot = await captureScreenshot(refUrl);

    // 3) 비전 AI 로 blueprint 생성
    const { palette, fontMood, designNote, sections } = await analyzeWithVision(
      key,
      shot.imageUrl,
      content
    );

    // 4) 저장
    const now = Date.now();
    const doc: Omit<LandingBlueprint, "createdAt" | "updatedAt"> & {
      createdAt: unknown;
      updatedAt: unknown;
    } = {
      villageId,
      refUrl,
      screenshotUrl: shot.imageUrl,
      designNote,
      palette,
      fontMood,
      sections,
      source: "ai",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await adminDb().doc(paths.landingDoc(villageId)).set(doc, { merge: true });

    const result: LandingBlueprint = {
      villageId,
      refUrl,
      screenshotUrl: shot.imageUrl,
      designNote,
      palette,
      fontMood,
      sections,
      source: "ai",
      createdAt: now,
      updatedAt: now,
    };
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { error: "랜딩 생성 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}

// ── 마을 자료 로드 ────────────────────────────────────────────────

async function loadVillageContent(vid: string): Promise<VillageContent | null> {
  const db = adminDb();
  const [villageSnap, themeSnap, storiesSnap, postsSnap] = await Promise.all([
    db.doc(paths.village(vid)).get(),
    db.doc(paths.themeDoc(vid)).get(),
    db.collection(paths.stories(vid)).orderBy("order", "asc").get(),
    db.collection(paths.feedPosts(vid)).orderBy("publishedAt", "desc").limit(8).get(),
  ]);
  if (!villageSnap.exists) return null;
  const v = villageSnap.data()!;
  const t = themeSnap.data() ?? {};

  const gallery: string[] = [];
  postsSnap.docs.forEach((d) => {
    const media = (d.data().media ?? []) as { url?: string }[];
    media.forEach((m) => m?.url && gallery.push(m.url));
  });
  if (t.heroUrl && !gallery.includes(t.heroUrl)) gallery.unshift(t.heroUrl);

  return {
    name: v.name ?? "",
    region: v.region ?? "",
    oneLiner: v.oneLiner ?? "",
    heroUrl: t.heroUrl ?? null,
    mascotUrl: t.mascotUrl ?? null,
    mascotName: t.mascotName ?? null,
    colorPrimary: t.colorPrimary ?? "#3e8e41",
    colorAccent: t.colorAccent ?? "#e14b5a",
    colorBg: t.colorBg ?? "#fffdf5",
    stories: storiesSnap.docs.map((d) => ({
      title: d.data().title ?? "",
      body: d.data().body ?? "",
    })),
    gallery: gallery.slice(0, 8),
  };
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
  content: VillageContent
): Promise<AnalysisResult> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";

  const villageJson = JSON.stringify(
    {
      name: content.name,
      region: content.region,
      oneLiner: content.oneLiner,
      mascotName: content.mascotName,
      stories: content.stories,
      heroImage: content.heroUrl,
      galleryImages: content.gallery,
      themeColors: {
        primary: content.colorPrimary,
        accent: content.colorAccent,
        bg: content.colorBg,
      },
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
            "너는 랜딩페이지 디자이너다. 참조 랜딩페이지 스크린샷을 보고 그 '시각적 감각(색 팔레트, 섹션 구성과 순서, 레이아웃, 여백감, 분위기)'을 최대한 그대로 재현하되, 콘텐츠는 주어진 '마을 자료'로 채운 새 랜딩페이지 설계를 만든다. 참조 이미지에서 실제로 보이는 색을 HEX로 추출하고, 섹션 순서와 종류(히어로/특징카드/스토리/갤러리/수치/후기/CTA/푸터)를 그대로 따라간다. 반드시 지정된 JSON 스키마로만 응답한다. 마을 자료에 없는 사실은 지어내지 말고, 이미지 URL은 주어진 것만 사용한다.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `아래는 "참조 랜딩페이지"의 전체 스크린샷이다. 이 페이지의 디자인 감각을 복제해서, 우리 마을 자료로 채운 랜딩페이지 설계(blueprint)를 만들어줘.

[마을 자료]
${villageJson}

[요구사항]
- palette: 참조 스크린샷에서 실제 추출한 색. bg(배경), text(본문 글자), accent(강조/버튼), primary(주색). 모두 #RRGGBB.
- fontMood: 참조 폰트 느낌 한 단어(예: modern-sans, elegant-serif, rounded-friendly, bold-display).
- designNote: 참조 디자인의 특징을 1~2문장 한국어로 요약(어떤 레이아웃/색/분위기인지).
- sections: 참조의 섹션 순서를 그대로 따른 배열. 각 섹션:
  - type: ${SECTION_TYPES.join(" | ")} 중 하나
  - layout: 레이아웃 힌트(예: fullscreen-left, centered, 3-col-cards, zigzag, 2-col, grid, banner)
  - heading/subheading/body: 마을 자료로 채운 실제 카피(한국어, 마크다운 금지)
  - items: features/gallery/stats/testimonial 에서 사용. {title, body, icon(lucide 아이콘명 소문자 또는 이모지), imageUrl(갤러리는 galleryImages 중에서만), value(stats 수치)}
  - imageUrl: hero/story 등 대표 이미지(heroImage 또는 galleryImages 중에서만)
  - bgColor/textColor: 그 섹션이 참조에서 특정 배경색을 쓰면 지정(HEX), 아니면 생략
  - align: left | center | right
  - ctaLabel/ctaHref: cta 섹션이면 버튼 문구와 링크(마을 홈은 "/v/${content.name ? "" : ""}" 대신 실제 링크를 모르면 "#" 사용)

아래 JSON으로만 응답(JSON 외 텍스트 금지):
{
  "palette": {"bg":"#...","text":"#...","accent":"#...","primary":"#..."},
  "fontMood": "...",
  "designNote": "...",
  "sections": [ { "type":"hero", "layout":"...", "heading":"...", "subheading":"...", "imageUrl":"...", "align":"left" } ]
}

중요: 반드시 hero 로 시작하고 footer 로 끝나며, 참조와 같은 개수·순서의 섹션을 만들어라. 최소 4개 이상.`,
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
function normalize(j: any, content: VillageContent): AnalysisResult {
  const palette: LandingPalette = {
    bg: hex(j?.palette?.bg, content.colorBg),
    text: hex(j?.palette?.text, "#1a1a1a"),
    accent: hex(j?.palette?.accent, content.colorAccent),
    primary: hex(j?.palette?.primary, content.colorPrimary),
  };

  const allowedImages = new Set(content.gallery);
  if (content.heroUrl) allowedImages.add(content.heroUrl);

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
function fallbackSections(content: VillageContent): LandingSection[] {
  const sections: LandingSection[] = [
    {
      type: "hero",
      layout: "centered",
      heading: content.name,
      subheading: content.oneLiner,
      imageUrl: content.heroUrl ?? undefined,
      align: "center",
    },
  ];
  if (content.stories.length) {
    sections.push({
      type: "story",
      layout: "2-col",
      heading: content.stories[0]?.title,
      body: content.stories[0]?.body,
      imageUrl: content.gallery[0],
    });
  }
  if (content.gallery.length) {
    sections.push({
      type: "gallery",
      layout: "grid",
      heading: "마을 풍경",
      items: content.gallery.map((url) => ({ imageUrl: url })),
    });
  }
  sections.push({
    type: "footer",
    heading: content.name,
    subheading: content.region,
  });
  return sections;
}
