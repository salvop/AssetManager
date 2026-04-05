import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";

import { DataTable } from "@/shared/components/data-table/data-table";
import type { SoftwareLicenseListItem } from "@/types/api";

const columns: ColumnDef<SoftwareLicenseListItem>[] = [
  {
    accessorKey: "product_name",
    header: "Prodotto",
    cell: ({ row }) => (
      <Link to={`/software-licenses/${row.original.id}`} className="font-medium text-brand-700 hover:underline">
        {row.original.product_name}
      </Link>
    ),
  },
  {
    accessorKey: "license_type",
    header: "Tipo",
  },
  {
    accessorKey: "vendor",
    header: "Vendor",
    cell: ({ row }) => row.original.vendor?.name ?? "-",
  },
  {
    accessorKey: "availability",
    header: "Disponibilita",
    cell: ({ row }) => `${row.original.available_quantity} / ${row.original.purchased_quantity}`,
  },
  {
    accessorKey: "expiry_date",
    header: "Scadenza",
    cell: ({ row }) => row.original.expiry_date ?? "-",
  },
];

export function SoftwareLicenseDataTable({ data }: { data: SoftwareLicenseListItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={10}
      caption="Catalogo licenze software"
      globalFilterPlaceholder="Filtra licenze per prodotto, tipo o vendor..."
    />
  );
}
