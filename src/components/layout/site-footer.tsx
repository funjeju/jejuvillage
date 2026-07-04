import Link from "next/link";
import { Container } from "@/components/ui/section";
import { FenceDivider } from "@/components/decor/nature";

export function SiteFooter() {
  return (
    <footer className="mt-16">
      <FenceDivider />
      <div className="bg-green-800 text-green-100">
        <Container className="py-10">
          <div className="flex flex-col sm:flex-row justify-between gap-8">
            <div>
              <p className="font-display text-2xl text-white">제주마을</p>
              <p className="mt-2 text-sm text-green-100/80 max-w-sm">
                제주 마을들이 직접 만드는 관광 홈페이지. 살아있는 사진 소식으로
                지금의 마을을 만나고, 바로 체험을 예약하세요.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-2">
                <p className="font-bold text-white">서비스</p>
                <Link href="/villages" className="block hover:text-white">마을찾기</Link>
                <Link href="/feed" className="block hover:text-white">전체 소식</Link>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-white">마을</p>
                <Link href="/login" className="block hover:text-white">운영자 로그인</Link>
                <Link href="/apply" className="block hover:text-white">마을 입점 문의</Link>
              </div>
            </div>
          </div>
          <p className="mt-8 pt-6 border-t border-green-100/20 text-xs text-green-100/60">
            © {new Date().getFullYear()} 제주마을 웹빌더 · 조수리 외 제주
            농어촌체험휴양마을과 함께합니다.
          </p>
        </Container>
      </div>
    </footer>
  );
}
