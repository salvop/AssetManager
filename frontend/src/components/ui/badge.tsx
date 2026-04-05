import * as React from "react";

import { cn } from "@/lib/utils";

const toneClassName: Record<BadgeTone, string> = {
  success: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
};

type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClassName[tone], className)}
      {...props}
    />
  );
}
