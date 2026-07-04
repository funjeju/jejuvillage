import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 클래스 병합 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 가격 표기 (원) */
export function formatPrice(won: number): string {
  return new Intl.NumberFormat("ko-KR").format(won) + "원";
}

/** 소요시간 (분 → "N시간 M분") */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}시간 ${m}분`;
  if (h) return `${h}시간`;
  return `${m}분`;
}

/** 상대 시간 표기 (예: "3시간 전") */
export function timeAgo(date: Date | number): string {
  const t = typeof date === "number" ? date : date.getTime();
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(t).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

/** slug 유효성 (영소문자/숫자/하이픈) */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}
