import Link from "next/link";
import { Container } from "@/components/ui/section";
import { Sprout } from "lucide-react";

/** 공개 영역 상단바 (기획서 S1 레이아웃) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream-50/85 backdrop-blur-md border-b border-line/70">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-green-700 text-white shadow-[0_4px_10px_-4px_rgba(47,107,51,0.7)] group-hover:bg-green-800 transition-colors">
            <Sprout size={20} />
          </span>
          <span className="font-display text-xl text-ink-900">제주마을</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-[15px] font-semibold text-ink-700">
          <Link href="/villages" className="px-3 py-2 rounded-full hover:bg-green-100">
            마을찾기
          </Link>
          <Link href="/feed" className="px-3 py-2 rounded-full hover:bg-green-100">
            소식
          </Link>
          <Link
            href="/login"
            className="ml-1 px-4 py-2 rounded-full bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            운영자 로그인
          </Link>
        </nav>
      </Container>
    </header>
  );
}
