import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: "neutral" | "success" | "info" | "warning" | "danger"
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const toneClassName =
    tone === "success"
      ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-transparent"
      : tone === "info"
        ? "bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border-transparent"
        : tone === "warning"
          ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)] border-transparent"
          : tone === "danger"
            ? "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border-transparent"
            : tone === "neutral"
              ? "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-transparent"
              : undefined

  return (
    <div className={cn(badgeVariants({ variant }), toneClassName, className)} {...props} />
  )
}

export { Badge, badgeVariants }
