import * as React from "react";

import { cn } from "@/lib/utils";

const baseClassName =
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50";

const variantClassNames: Record<string, string> = {
  default: "bg-slate-950 px-4 py-2.5 text-white hover:bg-slate-900",
  outline: "border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50",
  secondary: "border border-slate-200 bg-white px-4 py-2.5 text-slate-700 hover:bg-slate-50",
  ghost: "px-3 py-2 text-slate-700 hover:bg-slate-100",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClassNames;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <button
      className={cn(baseClassName, variantClassNames[variant], className)}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };
