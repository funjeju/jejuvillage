import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * 포스트잇 메모 — 살짝 기울어진 종이 카드 (기획서 7.4)
 * 공지·팁·소식 캡션에 사용.
 */
export function Postit({
  className,
  tilt = "left",
  color = "cream",
  children,
  ...props
}: ComponentProps<"div"> & {
  tilt?: "left" | "right" | "none";
  color?: "cream" | "sky" | "green" | "rose";
}) {
  const tilts = {
    left: "-rotate-1",
    right: "rotate-1",
    none: "",
  };
  const colors = {
    cream: "bg-cream-100",
    sky: "bg-sky-100",
    green: "bg-green-100",
    rose: "bg-[var(--accent-soft)]",
  };
  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-[10px] shadow-[3px_5px_12px_-4px_rgba(36,48,31,0.3)]",
        "before:content-[''] before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2",
        "before:h-4 before:w-10 before:rounded-[2px] before:bg-white/50 before:border before:border-black/5",
        tilts[tilt],
        colors[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
