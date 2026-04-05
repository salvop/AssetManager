import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea className={cn("app-input min-h-24", className)} ref={ref} {...props} />;
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
