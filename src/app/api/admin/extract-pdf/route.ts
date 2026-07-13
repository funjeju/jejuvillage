import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * PDF 업로드 → 텍스트 추출. (마을 설명 자료를 위저드에서 바로 붙여넣기 대신 PDF로)
 * 본문은 raw application/pdf 바이트로 받는다.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const buf = Buffer.from(await req.arrayBuffer());
    if (!buf.length) {
      return NextResponse.json({ error: "빈 파일이에요." }, { status: 422 });
    }
    if (buf.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF는 최대 15MB까지 가능해요." }, { status: 413 });
    }

    // 서버리스(Vercel) 안전한 pdfjs 래퍼 unpdf 사용
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text: raw } = await extractText(pdf, { mergePages: true });
    const text = (typeof raw === "string" ? raw : (raw as string[]).join("\n"))
      .replace(/^\s*--\s*\d+\s*of\s*\d+\s*--\s*$/gim, "") // 페이지 구분 마커 제거
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (text.length < 10) {
      return NextResponse.json(
        { error: "PDF에서 글자를 찾지 못했어요(이미지 PDF일 수 있어요). 설명을 직접 붙여넣어 주세요." },
        { status: 422 }
      );
    }
    return NextResponse.json({ ok: true, text: text.slice(0, 12000) });
  } catch (err) {
    return NextResponse.json(
      { error: "PDF를 읽지 못했어요.", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
