import Link from "next/link";
import Image from "next/image";
import { Sprout } from "lucide-react";
import { Container } from "@/components/ui/section";

/**
 * 제주 현무암 돌담을 배경으로 깔고 진녹색 오버레이를 얹은 통합 푸터.
 * (사진 밴드를 따로 띄우지 않고 배경 텍스처로 흡수해 정돈된 느낌)
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden">
      {/* 돌담 배경 + 진녹 오버레이 */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/decor/jeju-stonewall.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 62%" }}
        />
        <div className="absolute inset-0 bg-green-900/90" />
        {/* 위쪽을 페이지 배경으로 부드럽게 페이드 */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cream-50 to-transparent" />
      </div>

      <Container className="relative py-14 text-green-100">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <p className="inline-flex items-center gap-2 font-display text-2xl text-white">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15">
                <Sprout size={18} />
              </span>
              제주마을
            </p>
            <p className="mt-3 text-sm leading-relaxed text-green-100/80">
              제주 마을들이 직접 만드는 관광 홈페이지. 살아있는 사진 소식으로 지금의
              마을을 만나고, 바로 체험을 예약하세요.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="space-y-2.5">
              <p className="font-bold text-white">서비스</p>
              <Link href="/villages" className="block text-green-100/80 hover:text-white">마을찾기</Link>
              <Link href="/feed" className="block text-green-100/80 hover:text-white">전체 소식</Link>
            </div>
            <div className="space-y-2.5">
              <p className="font-bold text-white">마을</p>
              <Link href="/login" className="block text-green-100/80 hover:text-white">운영자 로그인</Link>
              <Link href="/apply" className="block text-green-100/80 hover:text-white">마을 입점 문의</Link>
            </div>
          </div>
        </div>
        <p className="mt-10 border-t border-white/15 pt-6 text-xs text-green-100/60">
          © {new Date().getFullYear()} 제주마을 웹빌더 · 조수리 외 제주
          농어촌체험휴양마을과 함께합니다.
        </p>
      </Container>
    </footer>
  );
}
