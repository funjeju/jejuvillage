import Link from "next/link";
import { Mascot } from "@/components/decor/mascot";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-sky-100 to-green-100 p-6 text-center">
      <div>
        <div className="flex justify-center mb-4">
          <Mascot say="어라, 길을 잃었나 봐요!" size={110} />
        </div>
        <h1 className="font-display text-5xl text-green-800">404</h1>
        <p className="mt-2 text-ink-700">찾으시는 마을이나 페이지가 없어요.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-green-700 px-6 py-3 font-display font-semibold text-white hover:bg-green-800"
        >
          제주마을 홈으로
        </Link>
      </div>
    </div>
  );
}
