import Link from "next/link";
import { Container } from "@/components/ui/section";
import { Sprout } from "lucide-react";
import { HeaderAuth } from "@/components/layout/header-auth";

/** 공개 영역 상단바 (기획서 S1 레이아웃) */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-cream-50/85 backdrop-blur-md border-b border-line/70">
      <Container className="flex h-16 items-center justify-between gap-2">
        <Link href="/" className="flex shrink-0 items-center gap-2 group">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-700 text-white shadow-[0_4px_10px_-4px_rgba(47,107,51,0.7)] group-hover:bg-green-800 transition-colors">
            <Sprout size={20} />
          </span>
          <span className="font-display text-xl text-ink-900 whitespace-nowrap">제주마을</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2 text-[15px] font-semibold text-ink-700">
          <Link href="/villages" className="px-2 sm:px-3 py-2 rounded-full whitespace-nowrap hover:bg-green-100">
            마을찾기
          </Link>
          <Link href="/feed" className="px-2 sm:px-3 py-2 rounded-full whitespace-nowrap hover:bg-green-100">
            소식
          </Link>
          <HeaderAuth />
        </nav>
      </Container>
    </header>
  );
}
