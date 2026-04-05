import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/shared/components/data-table/data-table";
import type { UserListItem } from "@/types/api";

type UserDataTableProps = {
  data: UserListItem[];
  departmentNameById: Record<number, string>;
  onEdit: (user: UserListItem) => void;
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
        <p className="font-medium text-slate-900">{row.original.full_name}</p>
        <p className="text-xs text-slate-500">{row.original.username}</p>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "-",
  },
  {
    accessorKey: "department",
    header: "Dipartimento",
    cell: ({ row }) => {
      if (!row.original.department_id) return "-";
      return departmentNameById[row.original.department_id] ?? "-";
    },
  },
  {
    accessorKey: "role_codes",
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

export function UserDataTable({ data, departmentNameById, onEdit }: UserDataTableProps) {
  return (
    <DataTable
      columns={getColumns(departmentNameById, onEdit)}
      data={data}
      pageSize={10}
      caption="Elenco utenti interni"
      globalFilterPlaceholder="Filtra utenti per nome, username o ruolo..."
    />
  );
}
