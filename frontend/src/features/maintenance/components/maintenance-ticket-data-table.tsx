import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { MaintenanceTicket } from "@/types/api";

const ticketStatusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  CLOSED: "success",
};

const columns: ColumnDef<MaintenanceTicket>[] = [
  {
    accessorKey: "title",
    header: "Titolo",
    cell: ({ row }) => (
      <Link to={`/maintenance-tickets/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorFn: (row) => row.asset.code ?? row.asset.name,
    id: "asset",
    header: "Asset",
    cell: ({ row }) => row.original.asset.code ?? row.original.asset.name,
  },
  {
    accessorKey: "status",
    header: "Stato",
    cell: ({ row }) => <Badge tone={ticketStatusTone[row.original.status] ?? "neutral"}>{row.original.status}</Badge>,
  },
  {
    accessorKey: "opened_at",
    header: "Aperto il",
    cell: ({ row }) => new Date(row.original.opened_at).toLocaleString(),
  },
];

type MaintenanceTicketDataTableProps = {
  data: MaintenanceTicket[];
  sorting: SortingState;
  pagination: PaginationState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  rowCount: number;
  pageCount: number;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export function MaintenanceTicketDataTable({
  data,
  sorting,
  pagination,
  onSortingChange,
  onPaginationChange,
  rowCount,
  pageCount,
  isLoading = false,
  errorMessage = null,
}: MaintenanceTicketDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      caption="Elenco ticket di manutenzione"
      sorting={sorting}
      onSortingChange={onSortingChange}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      pageCount={pageCount}
      isLoading={isLoading}
      errorMessage={errorMessage}
      enableGlobalFilter={false}
      manualPagination
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
}
