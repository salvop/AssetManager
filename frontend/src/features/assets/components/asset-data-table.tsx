import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/shared/components/data-table/data-table";
import type { AssetListItem } from "@/types/api";

const statusToneMap: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  IN_STOCK: "success",
  ASSIGNED: "info",
  MAINTENANCE: "warning",
  RETIRED: "neutral",
  DISPOSED: "danger",
};

export function AssetDataTable({ data }: { data: AssetListItem[] }) {
  const columns = useMemo<ColumnDef<AssetListItem, unknown>[]>(
    () => [
      {
        accessorKey: "asset_tag",
        header: "Tag",
        cell: ({ row }) => (
          <Link to={`/assets/${row.original.id}`} className="font-semibold text-brand-700 hover:underline">
            {row.original.asset_tag}
          </Link>
        ),
      },
      {
        accessorKey: "name",
        header: "Nome",
      },
      {
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
        accessorFn: (row) => row.location?.name ?? "-",
        id: "location",
        header: "Sede",
      },
      {
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
      globalFilterPlaceholder="Filtra per tag, nome o stato..."
      pageSize={15}
      caption="Elenco asset aziendali"
    />
  );
}
