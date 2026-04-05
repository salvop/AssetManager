import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white",
        secondary: "bg-slate-100 text-slate-700",
        destructive: "bg-rose-100 text-rose-700",
        outline: "border border-slate-200 bg-white text-slate-700",
        success: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
        info: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
        warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
        danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
        neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  tone?: "success" | "info" | "warning" | "danger" | "neutral"
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const resolvedVariant = tone ?? variant
  return (
    <span className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
