import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
  rowCount?: number;
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50, 100],
  rowCount,
}: DataTablePaginationProps<TData>) {
  const pagination = table.getState().pagination;
  const currentPage = pagination.pageIndex + 1;
  const currentPageCount = table.getPageCount() || 1;
  const pageSize = pagination.pageSize;
  const startRow = rowCount && rowCount > 0 ? pagination.pageIndex * pageSize + 1 : 0;
  const endRow =
    rowCount && rowCount > 0 ? Math.min((pagination.pageIndex + 1) * pageSize, rowCount) : 0;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {rowCount !== undefined && rowCount > 0 ? `${startRow}-${endRow} di ${rowCount}` : "0 risultati"}
        </span>
        <div className="flex items-center gap-2">
          <span>Righe</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-[88px]">
              <SelectValue placeholder="Righe" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Righe per pagina</SelectLabel>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          Pagina {currentPage} di {currentPageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Precedente
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Successiva
        </Button>
      </div>
    </div>
  );
}
