import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canManageVillage } from "@/lib/auth/session";

export const maxDuration = 60;

/**
 * 마스코트 캐릭터 시트 이미지 → OpenAI(GPT-5 mini) 비전 분석.
 * 시트에서 마스코트 정체성(이름·성격·소개)과 대표 포즈의 위치(크롭 박스),
 * 대표 색상을 추출한다. 실제 크롭은 클라이언트 canvas 에서 수행한다.
 */

export interface MascotAnalysis {
  mascotName: string;
  mascotDesc: string;
  personality: string;
  accentColor: string; // HEX
  /** 대표(단독 전신) 포즈의 정규화 좌표 0~1 */
  cropBox: { x: number; y: number; w: number; h: number };
  /** 배너 생성용 시각 묘사 (영문, gpt-image 프롬프트로 재사용) */
  visualPrompt: string;
}

export async function POST(req: NextRequest) {
  const { villageId, imageBase64, mediaType } = (await req.json().catch(() => ({}))) as {
    villageId?: string;
    imageBase64?: string;
    mediaType?: string;
  };

  const user = await getSessionUser();
  if (!villageId || !canManageVillage(user, villageId)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (!imageBase64) {
    return NextResponse.json({ error: "이미지가 없습니다." }, { status: 422 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않았어요." }, { status: 400 });
  }

  const mt = mediaType ?? "image/png";
  const dataUrl = `data:${mt};base64,${imageBase64}`;
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_completion_tokens: 2500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "너는 캐릭터 디자인 분석가다. 주어진 마스코트 캐릭터 시트 이미지를 분석해 정체성과 대표 포즈 위치를 추출한다. 반드시 지정된 JSON 스키마로만 응답한다.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `이 캐릭터 시트를 분석해줘. 보통 좌측 상단 또는 가장 크게 그려진 것이 "대표 전신 포즈"다.

아래 JSON으로만 응답(JSON 외 텍스트 금지):
{
  "mascotName": "시트에 적힌 캐릭터 이름(한글). 없으면 빈 문자열",
  "mascotDesc": "이 마스코트를 방문자에게 소개하는 친근한 한 문장(한글, 30자 내외)",
  "personality": "성격 키워드 2~3개(한글, 쉼표 구분)",
  "accentColor": "캐릭터의 대표 색상 HEX(예: #4b9d6e)",
  "cropBox": {"x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0},
  "visualPrompt": "이 캐릭터의 생김새를 영어로 상세 묘사(색·의상·특징, gpt-image 프롬프트용, 40단어 내외)"
}

cropBox는 대표 전신 포즈 하나만 딱 감싸는 사각형을 이미지 대비 정규화 비율(0~1)로. x,y는 좌상단, w,h는 너비/높이. 여백을 약간 포함해도 좋다.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? "분석 실패");
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("분석 결과 파싱 실패");
    const j = JSON.parse(text.slice(start, end + 1));

    const clamp = (n: unknown, d = 0) => {
      const v = typeof n === "number" ? n : Number(n);
      return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d;
    };
    const box = j.cropBox ?? {};
    const result: MascotAnalysis = {
      mascotName: String(j.mascotName ?? "").slice(0, 30),
      mascotDesc: String(j.mascotDesc ?? "").slice(0, 120),
      personality: String(j.personality ?? "").slice(0, 60),
      accentColor: /^#[0-9a-fA-F]{6}$/.test(j.accentColor) ? j.accentColor : "#3e8e41",
      cropBox: {
        x: clamp(box.x, 0),
        y: clamp(box.y, 0),
        w: clamp(box.w, 0.5) || 0.5,
        h: clamp(box.h, 0.5) || 0.5,
      },
      visualPrompt: String(j.visualPrompt ?? "").slice(0, 400),
    };
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { error: "마스코트 분석 실패", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
