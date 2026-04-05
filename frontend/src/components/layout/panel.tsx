import type { HTMLAttributes, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const hasHeader = Boolean(title || eyebrow);

  return (
    <Card id={id} className={cn("overflow-hidden", className)} {...props}>
      {hasHeader ? (
        <>
          <CardHeader className="gap-3">
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
            ) : null}
          </CardHeader>
          <Separator />
        </>
      ) : null}
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
