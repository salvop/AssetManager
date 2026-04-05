import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAsset } from "@/features/assets/hooks/useAssets";

export function AssignmentHistoryPage() {
  const params = useParams();
  const assetId = Number(params.assetId);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const { data: asset, isLoading, error } = useAsset(assetId);

  if (isLoading) {
    return (
      <div className="grid gap-6" aria-live="polite">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <Panel>
          <div className="grid gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </Panel>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error?.message ?? "Asset non trovato"}</AlertDescription>
      </Alert>
    );
  }

  const columns = useMemo<ColumnDef<(typeof asset.assignments)[number], unknown>[]>(
    () => [
      {
        accessorFn: (assignment) => assignment.employee.full_name,
        id: "assignee",
        header: "Assegnatario",
      },
      {
        accessorKey: "assigned_at",
        header: "Assegnato il",
        cell: ({ row }) => new Date(row.original.assigned_at).toLocaleString(),
      },
      {
        accessorKey: "returned_at",
        header: "Rientrato il",
        cell: ({ row }) =>
          row.original.returned_at ? new Date(row.original.returned_at).toLocaleString() : "Aperta",
      },
      {
        accessorFn: (assignment) => assignment.location?.name ?? "-",
        id: "location",
        header: "Sede",
      },
      {
        accessorFn: (assignment) => assignment.department?.name ?? "-",
        id: "department",
        header: "Dipartimento",
      },
    ],
    [asset.assignments],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Storico assegnazioni"
        title={asset.asset_tag}
        description="Tracciabilita completa delle assegnazioni e dei rientri registrati."
        actions={(
          <Button asChild variant="ghost">
            <Link to={`/assets/${asset.id}`}>Torna all'asset</Link>
          </Button>
        )}
      />

      <Panel className="overflow-hidden p-0">
        <div className="px-6 py-5">
          <DataTable
            columns={columns}
            data={asset.assignments}
            caption="Storico assegnazioni e rientri dell'asset"
            sorting={sorting}
            onSortingChange={setSorting}
            pagination={pagination}
            onPaginationChange={setPagination}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
            globalFilterPlaceholder="Filtra per assegnatario, sede o dipartimento..."
            emptyMessage="Nessuna assegnazione registrata."
            rowCount={asset.assignments.length}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </Panel>
    </div>
  );
}

