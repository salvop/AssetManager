import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import type { DataTableProps } from "@/components/ui/data-table/data-table.types";
import { cn } from "@/lib/utils";

export function DataTable<TData>({
  columns,
  data,
  caption,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  globalFilter = "",
  onGlobalFilterChange,
  columnFilters = [],
  onColumnFiltersChange,
  toolbarActions,
  globalFilterPlaceholder = "Filtra risultati...",
  emptyMessage = "Nessun risultato disponibile.",
  errorMessage = null,
  isLoading = false,
  enableGlobalFilter = true,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  pageCount,
  rowCount,
  pageSizeOptions,
  className,
  getRowId,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnFilters,
    },
    manualPagination,
    manualSorting,
    manualFiltering,
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    ...(pageCount !== undefined ? { pageCount } : {}),
    ...(rowCount !== undefined ? { rowCount } : {}),
    ...(onGlobalFilterChange ? { onGlobalFilterChange } : {}),
    ...(onColumnFiltersChange ? { onColumnFiltersChange } : {}),
    ...(getRowId ? { getRowId } : {}),
    ...(!manualFiltering ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    ...(!manualSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(!manualPagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
  });

  const visibleRowsCount = manualFiltering ? rowCount ?? data.length : table.getFilteredRowModel().rows.length;
  const rowCountLabel = `${visibleRowsCount} risultati`;
  const visibleColumnsCount = table.getVisibleFlatColumns().length || columns.length;
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <DataTableToolbar
        actions={toolbarActions}
        enableGlobalFilter={enableGlobalFilter}
        globalFilter={globalFilter}
        globalFilterPlaceholder={globalFilterPlaceholder}
        rowCountLabel={rowCountLabel}
        {...(onGlobalFilterChange ? { onGlobalFilterChange } : {})}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border" aria-busy={isLoading}>
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-left"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" ? "↑" : null}
                          {sortDirection === "desc" ? "↓" : null}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Caricamento risultati…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-8 text-center text-sm text-rose-600">
                  {errorMessage}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnsCount} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="text-sm transition-colors hover:bg-muted">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination
        table={table}
        rowCount={rowCount ?? visibleRowsCount}
        {...(pageSizeOptions ? { pageSizeOptions } : {})}
      />
    </div>
  );
}

