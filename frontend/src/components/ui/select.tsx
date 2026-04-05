import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select className={cn("app-input", className)} ref={ref} {...props}>
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";

export { Select };
