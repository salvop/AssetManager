import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Panel({
  id,
  className,
  title,
  eyebrow,
  children,
  ...props
}: {
  id?: string;
  className?: string;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Card id={id} className={cn("rounded-[28px]", className)} {...props}>
      {(title || eyebrow) && (
        <CardHeader className="pb-0">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>}
          {title && <CardTitle className="mt-2 text-lg font-semibold text-slate-900">{title}</CardTitle>}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !eyebrow ? "p-6" : "pt-5")}>{children}</CardContent>
    </Card>
  );
}
