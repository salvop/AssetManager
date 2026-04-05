import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  caption: string;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  toolbarActions?: ReactNode;
  globalFilterPlaceholder?: string;
  emptyMessage?: string;
  errorMessage?: string | null;
  isLoading?: boolean;
  enableGlobalFilter?: boolean;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
  pageCount?: number;
  rowCount?: number;
  pageSizeOptions?: number[];
  className?: string;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
};

