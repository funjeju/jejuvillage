import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  desc,
  action,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-5", className)}>
      <div>
        {eyebrow && (
          <p className="text-sm font-bold text-green-700 mb-1">{eyebrow}</p>
        )}
        <h2 className="text-2xl sm:text-3xl font-display text-ink-900">{title}</h2>
        {desc && <p className="mt-1 text-ink-500 text-sm sm:text-base">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
