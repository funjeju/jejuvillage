import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const maxDuration = 60;

/**
 * 마을 정보 원문 → 홈페이지 구성(한줄소개·스토리·마스코트·강조색)으로 구조화.
 * Claude API 사용, 키 없으면 휴리스틱 폴백.
 * DB 에는 쓰지 않고 구조만 반환 → 운영자가 미리보고 [적용]한다.
 */

export interface GeneratedHomepage {
  oneLiner: string;
  stories: { sectionKey: "history" | "legend" | "resource"; title: string; body: string }[];
  mascotName: string;
  mascotDesc: string;
  colorAccent: string; // HEX
  source: "ai" | "heuristic";
}

export async function POST(req: NextRequest) {
  const { villageId, rawText, villageName } = (await req.json().catch(() => ({}))) as {
    villageId?: string;
    rawText?: string;
    villageName?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (!rawText || rawText.trim().length < 20) {
    return NextResponse.json(
      { error: "마을 정보를 20자 이상 입력해 주세요." },
      { status: 422 }
    );
  }

  const key = process.env.ANTHROPIC_API_KEY;
  try {
    const result = key
      ? await generateWithClaude(key, rawText, villageName ?? "")
      : heuristic(rawText);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    // AI 실패 시에도 폴백으로 최소한의 구성 반환
    console.warn("[generate] AI 실패, 폴백:", (err as Error).message);
    return NextResponse.json({ ok: true, data: heuristic(rawText) });
  }
}

async function generateWithClaude(
  apiKey: string,
  rawText: string,
  villageName: string
): Promise<GeneratedHomepage> {
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    system:
      "너는 제주 마을 관광 홈페이지 기획자다. 주어진 마을 원문 정보를 바탕으로 따뜻하고 친근한 톤의 홈페이지 콘텐츠를 구성한다. 반드시 지정된 JSON 스키마로만 응답하고, 원문에 없는 사실은 지어내지 말고 비워둔다.",
    messages: [
      {
        role: "user",
        content: `다음은 "${villageName}" 마을의 원문 정보다. 이걸 토대로 홈페이지 콘텐츠를 구성해줘.

원문:
"""
${rawText.slice(0, 6000)}
"""

아래 JSON 스키마로만 응답(설명·코드펜스 없이 JSON만):
{
  "oneLiner": "마을을 한 문장으로 표현한 감성적 카피(40자 이내)",
  "stories": [
    {"sectionKey":"history","title":"짧은 제목","body":"역사/유래 (2~4문장)"},
    {"sectionKey":"legend","title":"짧은 제목","body":"설화/이야기 (원문에 있으면, 없으면 이 항목 생략)"},
    {"sectionKey":"resource","title":"짧은 제목","body":"자연·문화 자원 (2~4문장)"}
  ],
  "mascotName": "어울리는 마스코트 이름(원문 기반, 없으면 빈 문자열)",
  "mascotDesc": "마스코트 한 줄 소개(없으면 빈 문자열)",
  "colorAccent": "마을 분위기에 맞는 강조색 HEX(예: 장미마을이면 #e14b5a)"
}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const json = extractJson(text);
  return normalize(json, "ai");
}

function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON 파싱 실패");
  return JSON.parse(text.slice(start, end + 1));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(j: any, source: "ai" | "heuristic"): GeneratedHomepage {
  const hex = typeof j.colorAccent === "string" && /^#[0-9a-fA-F]{6}$/.test(j.colorAccent)
    ? j.colorAccent
    : "#e14b5a";
  const stories = Array.isArray(j.stories)
    ? j.stories
        .filter((s: unknown) => s && typeof (s as { body?: string }).body === "string" && (s as { body: string }).body.trim())
        .map((s: { sectionKey?: string; title?: string; body: string }) => ({
          sectionKey: (["history", "legend", "resource"].includes(s.sectionKey ?? "")
            ? s.sectionKey
            : "resource") as "history" | "legend" | "resource",
          title: String(s.title ?? "").slice(0, 40),
          body: String(s.body).slice(0, 1200),
        }))
    : [];
  return {
    oneLiner: String(j.oneLiner ?? "").slice(0, 120),
    stories,
    mascotName: String(j.mascotName ?? "").slice(0, 30),
    mascotDesc: String(j.mascotDesc ?? "").slice(0, 300),
    colorAccent: hex,
    source,
  };
}

/** 키 없거나 실패 시: 원문을 문단 단위로 나눠 최소 구성 */
function heuristic(rawText: string): GeneratedHomepage {
  const clean = rawText.replace(/\r/g, "").trim();
  const paras = clean.split(/\n{2,}|\n/).map((p) => p.trim()).filter((p) => p.length > 10);
  const oneLiner = (paras[0] ?? clean).slice(0, 60);
  const stories: GeneratedHomepage["stories"] = [];
  if (paras[0]) stories.push({ sectionKey: "history", title: "마을 소개", body: paras.slice(0, 2).join("\n") });
  if (paras.length > 2)
    stories.push({ sectionKey: "resource", title: "마을의 자원", body: paras.slice(2).join("\n").slice(0, 1000) });
  return {
    oneLiner,
    stories,
    mascotName: "",
    mascotDesc: "",
    colorAccent: "#e14b5a",
    source: "heuristic",
  };
}
