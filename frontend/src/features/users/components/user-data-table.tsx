import type { ColumnDef, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { UserListItem } from "@/types/api";

type UserDataTableProps = {
  data: UserListItem[];
  departmentNameById: Record<number, string>;
  onEdit: (user: UserListItem) => void;
  sorting: SortingState;
  pagination: PaginationState;
  onSortingChange: OnChangeFn<SortingState>;
  onPaginationChange: OnChangeFn<PaginationState>;
  rowCount: number;
  pageCount: number;
  isLoading?: boolean;
  errorMessage?: string | null;
};

function getColumns(
  departmentNameById: Record<number, string>,
  onEdit: (user: UserListItem) => void,
): ColumnDef<UserListItem>[] {
  return [
  {
    accessorKey: "full_name",
    header: "Utente",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-foreground">{row.original.full_name}</p>
        <p className="text-xs text-muted-foreground">{row.original.username}</p>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "-",
  },
  {
    accessorFn: (row) => {
      if (!row.department_id) return "-";
      return departmentNameById[row.department_id] ?? "-";
    },
    id: "department",
    header: "Dipartimento",
    cell: ({ row }) => {
      if (!row.original.department_id) return "-";
      return departmentNameById[row.original.department_id] ?? "-";
    },
  },
  {
    accessorFn: (row) => row.role_codes.join(", "),
    id: "role_codes",
    header: "Ruoli",
    cell: ({ row }) => row.original.role_codes.join(", "),
  },
  {
    accessorKey: "is_active",
    header: "Stato",
    cell: ({ row }) => <Badge tone={row.original.is_active === false ? "neutral" : "success"}>{row.original.is_active === false ? "Disattivato" : "Attivo"}</Badge>,
  },
  {
    id: "actions",
    header: "Azioni",
    cell: ({ row }) => <Button type="button" variant="secondary" onClick={() => onEdit(row.original)}>Modifica</Button>,
  },
];
}

export function UserDataTable({
  data,
  departmentNameById,
  onEdit,
  sorting,
  pagination,
  onSortingChange,
  onPaginationChange,
  rowCount,
  pageCount,
  isLoading = false,
  errorMessage = null,
}: UserDataTableProps) {
  return (
    <DataTable
      columns={getColumns(departmentNameById, onEdit)}
      data={data}
      caption="Elenco utenti interni"
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
