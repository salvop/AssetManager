import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { approveAssetRequest, createAssetRequest } from "@/features/assets/api/assetRequests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { FormSelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAssetRequests } from "@/features/assets/hooks/useAssetRequests";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import type { AssetRequest } from "@/types/api";

const requestFormSchema = z.object({
  requested_for_employee_id: z.string().optional(),
  department_id: z.string().optional(),
  category_id: z.coerce.number().min(1, "La categoria e obbligatoria"),
  suggested_model_id: z.string().optional(),
  suggested_vendor_id: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  business_justification: z.string().min(3, "Inserisci una motivazione valida"),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const statusToneMap: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const priorityToneMap: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  LOW: "neutral",
  NORMAL: "info",
  HIGH: "warning",
  URGENT: "danger",
};

export function AssetRequestsPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading, error } = useAssetRequests({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const { categories, departments, models, vendors, employees, isLoading: areLookupsLoading } = useLookupsBundle({
    categories: true,
    departments: true,
    models: true,
    vendors: true,
    employees: true,
    statuses: false,
    locations: false,
    users: false,
  });

  const roleCodes = currentUser?.role_codes ?? [];
  const canCreate = roleCodes.some((role) => role === "ADMIN" || role === "ASSET_MANAGER" || role === "OPERATOR");
  const canApprove = roleCodes.some((role) => role === "ADMIN" || role === "ASSET_MANAGER");

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requested_for_employee_id: "",
      department_id: "",
      category_id: 0,
      suggested_model_id: "",
      suggested_vendor_id: "",
      priority: "NORMAL",
      business_justification: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: RequestFormValues) =>
      createAssetRequest({
        requested_for_employee_id: values.requested_for_employee_id ? Number(values.requested_for_employee_id) : null,
        department_id: values.department_id ? Number(values.department_id) : null,
        category_id: values.category_id,
        suggested_model_id: values.suggested_model_id ? Number(values.suggested_model_id) : null,
        suggested_vendor_id: values.suggested_vendor_id ? Number(values.suggested_vendor_id) : null,
        priority: values.priority,
        business_justification: values.business_justification,
      }),
    onSuccess: async () => {
      form.reset({
        requested_for_employee_id: "",
        department_id: "",
        category_id: 0,
        suggested_model_id: "",
        suggested_vendor_id: "",
        priority: "NORMAL",
        business_justification: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => approveAssetRequest(requestId, { approval_notes: null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
    },
  });

  const columns = useMemo<ColumnDef<AssetRequest, unknown>[]>(
    () => [
      {
        id: "request",
        header: "Richiesta",
        accessorFn: (item) => item.category.name,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-foreground">#{row.original.id} · {row.original.category.name}</p>
            <p className="text-xs text-muted-foreground">Aperta da {row.original.requested_by_user.full_name}</p>
            {row.original.business_justification ? (
              <p className="text-xs text-muted-foreground">{row.original.business_justification}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "context",
        header: "Contesto",
        accessorFn: (item) =>
          [
            item.requested_for_employee?.full_name,
            item.department?.name,
            item.suggested_model?.name,
            item.suggested_vendor?.name,
          ]
            .filter(Boolean)
            .join(" "),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 text-foreground">
            <p>{row.original.requested_for_employee?.full_name ?? "-"}</p>
            <p className="text-xs text-muted-foreground">
              {[
                row.original.department?.name,
                row.original.suggested_model?.name,
                row.original.suggested_vendor?.name,
              ]
                .filter(Boolean)
                .join(" · ") || "-"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priorita",
        cell: ({ row }) => <Badge tone={priorityToneMap[row.original.priority] ?? "neutral"}>{row.original.priority}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Stato",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge tone={statusToneMap[row.original.status] ?? "neutral"}>{row.original.status}</Badge>
            {row.original.approved_by_user ? (
              <p className="text-xs text-muted-foreground">Approvata da {row.original.approved_by_user.full_name}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Azioni",
        enableSorting: false,
        cell: ({ row }) => {
          const canApproveRow = canApprove && row.original.status === "PENDING_APPROVAL";

          return (
            <Button
              type="button"
              variant="secondary"
              disabled={!canApproveRow || approveMutation.isPending}
              onClick={() => approveMutation.mutate(row.original.id)}
            >
              {approveMutation.isPending ? "Approvazione..." : "Approva"}
            </Button>
          );
        },
      },
    ],
    [approveMutation, canApprove],
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Lifecycle"
        title="Richieste asset"
        description="Gestisci le richieste di nuovo asset e approva il passaggio al processo di acquisto."
      />

      {canCreate && (
        <Panel eyebrow="Nuova richiesta" title="Apri una richiesta">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <FormSelectField
                  control={form.control}
                  name="category_id"
                  label="Categoria"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Seleziona categoria"
                  options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
                />
                <FormSelectField
                  control={form.control}
                  name="priority"
                  label="Priorita"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Seleziona priorita"
                  options={[
                    { value: "LOW", label: "LOW" },
                    { value: "NORMAL", label: "NORMAL" },
                    { value: "HIGH", label: "HIGH" },
                    { value: "URGENT", label: "URGENT" },
                  ]}
                />
                <FormSelectField
                  control={form.control}
                  name="requested_for_employee_id"
                  label="Richiesto per"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Nessun dipendente specifico"
                  options={employees.map((item) => ({ value: String(item.id), label: item.full_name }))}
                />
                <FormSelectField
                  control={form.control}
                  name="department_id"
                  label="Dipartimento"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Nessun dipartimento"
                  options={departments.map((item) => ({ value: String(item.id), label: item.name }))}
                />
                <FormSelectField
                  control={form.control}
                  name="suggested_model_id"
                  label="Modello suggerito"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Nessun modello"
                  options={models.map((item) => ({ value: String(item.id), label: item.name }))}
                />
                <FormSelectField
                  control={form.control}
                  name="suggested_vendor_id"
                  label="Fornitore suggerito"
                  labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                  placeholder="Nessun fornitore"
                  options={vendors.map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </div>
              <FormField
                control={form.control}
                name="business_justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Motivazione business
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrivi il bisogno operativo..."
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between gap-3">
                <Badge tone="neutral">{data?.total ?? 0} richieste totali</Badge>
                <Button type="submit" disabled={createMutation.isPending || areLookupsLoading}>
                  {createMutation.isPending ? "Creazione..." : "Crea richiesta"}
                </Button>
              </div>
            </form>
          </Form>
        </Panel>
      )}

      <Panel eyebrow="Queue approvazioni" title="Stato richieste asset">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          caption="Elenco richieste asset"
          sorting={sorting}
          onSortingChange={setSorting}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={isLoading}
          errorMessage={error?.message ?? null}
          emptyMessage="Nessuna richiesta presente."
          enableGlobalFilter={false}
          manualPagination
          rowCount={data?.total ?? 0}
          pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / pagination.pageSize))}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </Panel>

      {(createMutation.error || approveMutation.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {createMutation.error?.message ?? approveMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}



