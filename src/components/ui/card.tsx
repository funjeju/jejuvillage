import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** 라운드 코너 카드 — 그림책 톤의 부드러운 표면 (기획서 7.4) */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-blob)] bg-white border border-line/80 shadow-[var(--shadow-card)] overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "green",
  ...props
}: ComponentProps<"span"> & { tone?: "green" | "accent" | "sky" | "brown" | "neutral" }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    sky: "bg-sky-100 text-sky-800",
    brown: "bg-brown-100 text-brown-600",
    neutral: "bg-black/5 text-ink-700",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
