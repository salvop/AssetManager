import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  variant?: "icon" | "wide";
};

export function Brand({ className, iconClassName, labelClassName, variant = "wide" }: BrandProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          iconClassName,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
        </svg>
      </span>
      {variant === "wide" ? (
        <span className={cn("text-3xl font-bold tracking-tight text-foreground", labelClassName)}>
          OpsAsset
        </span>
      ) : null}
    </span>
  );
}
