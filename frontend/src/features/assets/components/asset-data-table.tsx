import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { AssetListItem } from "@/types/api";

const statusToneMap: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  IN_STOCK: "success",
  ASSIGNED: "info",
  MAINTENANCE: "warning",
  RETIRED: "neutral",
  DISPOSED: "danger",
};

type AssetDataTableProps = {
  data: AssetListItem[];
  sorting: SortingState;
  pagination: PaginationState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  errorMessage?: string | null;
  rowCount: number;
  pageCount: number;
};

export function AssetDataTable({
  data,
  sorting,
  pagination,
  onSortingChange,
  onPaginationChange,
  isLoading = false,
  errorMessage = null,
  rowCount,
  pageCount,
}: AssetDataTableProps) {
  const columns = useMemo<ColumnDef<AssetListItem, unknown>[]>(
    () => [
      {
        accessorKey: "asset_tag",
        header: "Tag",
        cell: ({ row }) => (
          <Link to={`/assets/${row.original.id}`} className="font-semibold text-primary hover:underline">
            {row.original.asset_tag}
          </Link>
        ),
      },
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
        enableSorting: false,
        accessorFn: (row) => row.status.code ?? row.status.name,
        id: "status",
        header: "Stato",
        cell: ({ row }) => (
          <Badge tone={statusToneMap[row.original.status.code ?? ""] ?? "neutral"}>
            {row.original.status.code ?? row.original.status.name}
          </Badge>
        ),
      },
      {
        enableSorting: false,
        accessorFn: (row) => row.location?.name ?? "-",
        id: "location",
        header: "Sede",
      },
      {
        enableSorting: false,
        accessorFn: (row) => row.assigned_employee?.full_name ?? "-",
        id: "assignee",
        header: "Assegnato a",
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      caption="Elenco asset aziendali"
      sorting={sorting}
      onSortingChange={onSortingChange}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      isLoading={isLoading}
      errorMessage={errorMessage}
      enableGlobalFilter={false}
      manualPagination
      manualSorting
      rowCount={rowCount}
      pageCount={pageCount}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
}
