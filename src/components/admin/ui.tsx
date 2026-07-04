import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export function PageTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-blob)] bg-white border border-line/80 shadow-[var(--shadow-card)] p-5",
        className
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  tone = "green",
  sub,
}: {
  label: string;
  value: ReactNode;
  tone?: "green" | "accent" | "sky" | "brown";
  sub?: string;
}) {
  const tones = {
    green: "bg-green-100 text-green-800",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    sky: "bg-sky-100 text-sky-800",
    brown: "bg-brown-100 text-brown-600",
  } as const;
  return (
    <div className="rounded-[var(--radius-blob)] bg-white border border-line/80 p-5 shadow-[var(--shadow-card)]">
      <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone])}>
        {label}
      </span>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="text-xs text-ink-500">{sub}</p>}
    </div>
  );
}

export const adminField =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition";
export const adminLabel = "block text-sm font-semibold text-ink-900 mb-1.5";
