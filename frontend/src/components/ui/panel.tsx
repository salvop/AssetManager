import type { HTMLAttributes, ReactNode } from "react";

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
    <section id={id} className={cn("app-panel", className)} {...props}>
      {(title || eyebrow) && (
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>}
          {title && <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>}
        </div>
      )}
      <div className={cn(title || eyebrow ? "mt-5" : "")}>{children}</div>
    </section>
  );
}
