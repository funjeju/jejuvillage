import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const maxDuration = 60;

/**
 * 마을 정보 원문 → 홈페이지 구성(한줄소개·스토리·마스코트·강조색)으로 구조화.
 * OpenAI(GPT-5 mini) 사용, 키 없으면 휴리스틱 폴백.
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

  const key = process.env.OPENAI_API_KEY;
  try {
    const result = key
      ? await generateWithOpenAI(key, rawText, villageName ?? "")
      : heuristic(rawText);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    // AI 실패 시에도 폴백으로 최소한의 구성 반환
    console.warn("[generate] AI 실패, 폴백:", (err as Error).message);
    return NextResponse.json({ ok: true, data: heuristic(rawText) });
  }
}

async function generateWithOpenAI(
  apiKey: string,
  rawText: string,
  villageName: string
): Promise<GeneratedHomepage> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_completion_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 제주 마을 관광 홈페이지 기획자다. 주어진 마을 원문 정보를 바탕으로 따뜻하고 친근한 톤의 홈페이지 콘텐츠를 구성한다. 반드시 지정된 JSON 스키마로만 응답하고, 원문에 없는 사실은 지어내지 말고 비워둔다. 절대 마크다운 문법(##, |, --, **, *, `) 을 사용하지 말 것. body 필드는 순수 문장으로만 구성된 자연스러운 한국어 산문이어야 한다. 핵심만 압축해 2~4문장으로 서술하되 여행자가 읽고 싶어지는 생동감 있는 표현을 써라.",
        },
        {
          role: "user",
          content: `다음은 "${villageName}" 마을의 원문 정보다. 표, 목록, 기획 양식 등 형식 데이터가 포함돼 있을 수 있다. 그 안에서 핵심 정보만 추출해 읽기 좋은 홈페이지 콘텐츠로 재작성해줘.

원문:
"""
${rawText.slice(0, 6000)}
"""

아래 JSON 스키마로만 응답(JSON 외 텍스트 금지):
{
  "oneLiner": "마을을 한 문장으로 표현한 감성적 카피(40자 이내, 마크다운 금지)",
  "stories": [
    {"sectionKey":"history","title":"짧은 제목(10자 이내)","body":"역사/유래를 여행자 시선으로 서술한 2~3문장 산문. 마크다운·기호 금지."},
    {"sectionKey":"legend","title":"짧은 제목(10자 이내)","body":"설화·전설을 흥미롭게 서술한 2~3문장. 없으면 이 항목 생략."},
    {"sectionKey":"resource","title":"짧은 제목(10자 이내)","body":"이 마을에서만 볼 수 있는 자연·문화 자원을 핵심 3가지만 골라 한 문장씩 소개. 마크다운·기호 금지."}
  ],
  "mascotName": "원문에 마스코트 이름이 있으면 그대로, 없으면 빈 문자열",
  "mascotDesc": "마스코트 한 줄 소개(없으면 빈 문자열)",
  "colorAccent": "마을 분위기에 맞는 강조색 HEX"
}`,
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? "OpenAI 구성 실패");
  const text: string = data?.choices?.[0]?.message?.content ?? "";
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

/** 마크다운·표 제거 후 순수 텍스트만 추출 */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+.*/gm, "")          // ## 헤딩 제거
    .replace(/^\|[-:\s|]+\|$/gm, "")        // 표 구분선 제거
    .replace(/^\|.+\|$/gm, (row) =>          // 표 행 → 쉼표 구분 문장
      row.split("|").map((c) => c.trim()).filter(Boolean).join(", ")
    )
    .replace(/\*\*(.+?)\*\*/g, "$1")         // 볼드 제거
    .replace(/\*(.+?)\*/g, "$1")             // 이탤릭 제거
    .replace(/`(.+?)`/g, "$1")              // 코드 제거
    .replace(/\n{3,}/g, "\n\n")             // 빈 줄 정리
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 8)            // 짧은 잔여 줄 제거
    .join("\n")
    .trim();
}

/** 키 없거나 실패 시: 원문을 정제해 최소 구성 */
function heuristic(rawText: string): GeneratedHomepage {
  const clean = stripMarkdown(rawText.replace(/\r/g, ""));
  const paras = clean.split(/\n{2,}|\n/).filter((p) => p.length > 15);
  const firstPara = (paras[0] ?? clean).slice(0, 80);
  const oneLiner = firstPara.replace(/[,·.]+$/, "").slice(0, 60);
  const stories: GeneratedHomepage["stories"] = [];
  if (paras.length >= 1)
    stories.push({ sectionKey: "history", title: "마을 소개", body: paras.slice(0, 3).join(" ").slice(0, 500) });
  if (paras.length > 3)
    stories.push({ sectionKey: "resource", title: "마을의 자원", body: paras.slice(3, 7).join(" ").slice(0, 500) });
  return {
    oneLiner,
    stories,
    mascotName: "",
    mascotDesc: "",
    colorAccent: "#3e8e41",
    source: "heuristic",
  };
}
