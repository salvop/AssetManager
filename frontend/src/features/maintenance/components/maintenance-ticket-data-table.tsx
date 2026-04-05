import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/shared/components/data-table/data-table";
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
      <Link to={`/maintenance-tickets/${row.original.id}`} className="font-medium text-brand-700 hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "asset",
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

export function MaintenanceTicketDataTable({ data }: { data: MaintenanceTicket[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={10}
      caption="Elenco ticket di manutenzione"
      globalFilterPlaceholder="Filtra ticket per titolo, stato o asset..."
    />
  );
}
