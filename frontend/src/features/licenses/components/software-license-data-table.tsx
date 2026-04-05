import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { DataTable } from "@/components/ui/data-table";
import type { SoftwareLicenseListItem } from "@/types/api";

const columns: ColumnDef<SoftwareLicenseListItem>[] = [
  {
    accessorKey: "product_name",
    header: "Prodotto",
    cell: ({ row }) => (
      <Link to={`/software-licenses/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.product_name}
      </Link>
    ),
  },
  {
    accessorKey: "license_type",
    header: "Tipo",
  },
  {
    enableSorting: false,
    accessorFn: (row) => row.vendor?.name ?? "-",
    id: "vendor",
    header: "Vendor",
    cell: ({ row }) => row.original.vendor?.name ?? "-",
  },
  {
    enableSorting: false,
    accessorFn: (row) => row.available_quantity,
    id: "availability",
    header: "Disponibilita",
    cell: ({ row }) => `${row.original.available_quantity} / ${row.original.purchased_quantity}`,
  },
  {
    accessorKey: "expiry_date",
    header: "Scadenza",
    cell: ({ row }) => row.original.expiry_date ?? "-",
  },
];

type SoftwareLicenseDataTableProps = {
  data: SoftwareLicenseListItem[];
  sorting: SortingState;
  pagination: PaginationState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  isLoading?: boolean;
  errorMessage?: string | null;
  rowCount: number;
  pageCount: number;
};

export function SoftwareLicenseDataTable({
  data,
  sorting,
  pagination,
  onSortingChange,
  onPaginationChange,
  isLoading = false,
  errorMessage = null,
  rowCount,
  pageCount,
}: SoftwareLicenseDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      caption="Catalogo licenze software"
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
      pageSizeOptions={[10, 20, 50]}
    />
  );
}
