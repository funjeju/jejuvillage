import type { Metadata } from "next";
import { Jua } from "next/font/google";
import "./globals.css";

// 디스플레이(제목) — 둥글고 친근한 한글 손글씨 느낌 (기획서 7.3, 참고 B 톤)
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "제주마을 — 살아있는 제주 마을 여행",
    template: "%s · 제주마을",
  },
  description:
    "제주 마을들이 직접 만드는 관광 홈페이지. 지도에서 마을을 발견하고, 실시간 사진 소식으로 지금의 마을을 보고, 바로 체험을 예약하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${jua.variable} h-full`}>
      <head>
        {/* 본문 폰트: Pretendard (SIL OFL, 오픈 라이선스) */}
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream-50 text-ink-900">
        {children}
      </body>
    </html>
  );
}
