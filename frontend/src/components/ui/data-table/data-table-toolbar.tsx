import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";

type DataTableToolbarProps = {
  actions?: ReactNode;
  enableGlobalFilter?: boolean;
  globalFilter?: string;
  globalFilterPlaceholder?: string;
  onGlobalFilterChange?: (value: string) => void;
  rowCountLabel?: string;
};

export function DataTableToolbar({
  actions,
  enableGlobalFilter = true,
  globalFilter = "",
  globalFilterPlaceholder = "Filtra risultati...",
  onGlobalFilterChange,
  rowCountLabel,
}: DataTableToolbarProps) {
  if (!enableGlobalFilter && !actions && !rowCountLabel) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-3">
        {enableGlobalFilter ? (
          <Input
            value={globalFilter}
            onChange={(event) => onGlobalFilterChange?.(event.target.value)}
            placeholder={globalFilterPlaceholder}
            className="max-w-md"
            aria-label="Filtro globale tabella"
          />
        ) : null}
        {rowCountLabel ? <span className="text-sm text-muted-foreground">{rowCountLabel}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
