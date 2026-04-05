import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return <input type={type} className={cn("app-input", className)} ref={ref} {...props} />;
  },
);

Input.displayName = "Input";

export { Input };
