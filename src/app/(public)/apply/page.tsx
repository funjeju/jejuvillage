import type { Metadata } from "next";
import { Container } from "@/components/ui/section";
import { Postit } from "@/components/ui/postit";
import { Mascot } from "@/components/decor/mascot";

export const metadata: Metadata = { title: "마을 입점 문의" };

export default function ApplyPage() {
  return (
    <Container className="py-16 max-w-2xl text-center">
      <div className="flex justify-center mb-6">
        <Mascot say="우리 마을도 만들 수 있어요!" size={100} />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl">우리 마을 홈페이지 만들기</h1>
      <p className="mt-3 text-ink-700">
        제주의 농어촌체험휴양마을이라면 누구나 코딩 없이 홈페이지를 만들고,
        사진 한 장으로 소식을 전하고, 체험을 판매할 수 있어요.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 text-left">
        <Postit tilt="left" color="green">
          <b>1. 신청</b>
          <p className="mt-1 text-sm text-ink-700">아래 연락처로 입점을 문의해요.</p>
        </Postit>
        <Postit tilt="none" color="sky">
          <b>2. 개설</b>
          <p className="mt-1 text-sm text-ink-700">플랫폼 관리자가 마을 계정을 만들어 초대해요.</p>
        </Postit>
        <Postit tilt="right" color="cream">
          <b>3. 운영</b>
          <p className="mt-1 text-sm text-ink-700">사진·체험·예약을 직접 관리해요.</p>
        </Postit>
      </div>

      <div className="mt-10 rounded-[var(--radius-blob)] bg-green-100 p-6">
        <p className="font-display text-lg">입점 문의</p>
        <p className="mt-1 text-ink-700">
          제주마을만들기종합지원센터 / 마을 담당자에게 문의해 주세요.
        </p>
        <p className="mt-2 text-sm text-ink-500">
          (MVP 단계 — 온라인 신청 폼은 준비 중이에요.)
        </p>
      </div>
    </Container>
  );
}
