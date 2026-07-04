import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "accent" | "soft" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display font-semibold rounded-full transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-green-700 text-white shadow-[0_6px_16px_-6px_rgba(47,107,51,0.6)] hover:bg-green-800",
  accent:
    "bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] hover:brightness-95",
  soft: "bg-green-100 text-green-800 hover:bg-green-300/60",
  outline:
    "border-2 border-green-700 text-green-800 bg-white/70 hover:bg-green-100",
  ghost: "text-ink-700 hover:bg-black/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-[15px]",
  lg: "h-14 px-8 text-lg",
};

type BaseProps = { variant?: Variant; size?: Size; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: BaseProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}
