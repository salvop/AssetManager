import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { approveAssetRequest, createAssetRequest } from "@/features/assets/api/assetRequests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ControlledSelectField } from "@/components/ui/select-field";
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
  const { data: currentUser } = useCurrentUser();
  const { data, isLoading, error } = useAssetRequests({ page: 1, pageSize: 50 });
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lifecycle"
        title="Richieste asset"
        description="Gestisci le richieste di nuovo asset e approva il passaggio al processo di acquisto."
      />

      {canCreate && (
        <Panel eyebrow="Nuova richiesta" title="Apri una richiesta">
          <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label htmlFor="request-category" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</span>
                <ControlledSelectField
                  control={form.control}
                  name="category_id"
                  placeholder="Seleziona categoria"
                  options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </label>
              <label htmlFor="request-priority" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priorita</span>
                <ControlledSelectField
                  control={form.control}
                  name="priority"
                  placeholder="Seleziona priorita"
                  options={[
                    { value: "LOW", label: "LOW" },
                    { value: "NORMAL", label: "NORMAL" },
                    { value: "HIGH", label: "HIGH" },
                    { value: "URGENT", label: "URGENT" },
                  ]}
                />
              </label>
              <label htmlFor="request-employee" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Richiesto per</span>
                <ControlledSelectField
                  control={form.control}
                  name="requested_for_employee_id"
                  placeholder="Nessun dipendente specifico"
                  options={employees.map((item) => ({ value: String(item.id), label: item.full_name }))}
                />
              </label>
              <label htmlFor="request-department" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dipartimento</span>
                <ControlledSelectField
                  control={form.control}
                  name="department_id"
                  placeholder="Nessun dipartimento"
                  options={departments.map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </label>
              <label htmlFor="request-model" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Modello suggerito</span>
                <ControlledSelectField
                  control={form.control}
                  name="suggested_model_id"
                  placeholder="Nessun modello"
                  options={models.map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </label>
              <label htmlFor="request-vendor" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fornitore suggerito</span>
                <ControlledSelectField
                  control={form.control}
                  name="suggested_vendor_id"
                  placeholder="Nessun fornitore"
                  options={vendors.map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </label>
            </div>
            <label htmlFor="request-justification" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Motivazione business</span>
              <Textarea
                id="request-justification"
                placeholder="Descrivi il bisogno operativo..."
                {...form.register("business_justification")}
              />
            </label>
            {form.formState.errors.category_id && (
              <p className="text-sm text-rose-600">{form.formState.errors.category_id.message}</p>
            )}
            {form.formState.errors.business_justification && (
              <p className="text-sm text-rose-600">{form.formState.errors.business_justification.message}</p>
            )}
            <div className="flex items-center justify-between gap-3">
              <Badge tone="neutral">{data?.total ?? 0} richieste totali</Badge>
              <Button type="submit" disabled={createMutation.isPending || areLookupsLoading}>
                {createMutation.isPending ? "Creazione..." : "Crea richiesta"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Queue approvazioni</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Stato richieste asset</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <caption className="sr-only">Elenco richieste asset</caption>
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th scope="col" className="px-6 py-4 font-semibold">Richiesta</th>
                <th scope="col" className="px-6 py-4 font-semibold">Contesto</th>
                <th scope="col" className="px-6 py-4 font-semibold">Priorita</th>
                <th scope="col" className="px-6 py-4 font-semibold">Stato</th>
                <th scope="col" className="px-6 py-4 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {(data?.items ?? []).map((item) => (
                <AssetRequestRow
                  key={item.id}
                  item={item}
                  canApprove={canApprove}
                  onApprove={() => approveMutation.mutate(item.id)}
                  isApproving={approveMutation.isPending}
                />
              ))}
              {!isLoading && (data?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Nessuna richiesta presente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {isLoading && <p className="text-sm text-slate-500">Caricamento richieste...</p>}
      {(error || createMutation.error || approveMutation.error) && (
        <p className="text-sm text-rose-600">
          {error?.message ?? createMutation.error?.message ?? approveMutation.error?.message}
        </p>
      )}
    </div>
  );
}

function AssetRequestRow({
  item,
  canApprove,
  onApprove,
  isApproving,
}: {
  item: AssetRequest;
  canApprove: boolean;
  onApprove: () => void;
  isApproving: boolean;
}) {
  const canApproveRow = canApprove && item.status === "PENDING_APPROVAL";

  return (
    <tr className="text-sm transition hover:bg-brand-50/50">
      <td className="px-6 py-4">
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">#{item.id} · {item.category.name}</p>
          <p className="text-xs text-slate-500">Aperta da {item.requested_by_user.full_name}</p>
          {item.business_justification && <p className="text-xs text-slate-500">{item.business_justification}</p>}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1 text-slate-700">
          <p>{item.requested_for_employee?.full_name ?? "-"}</p>
          <p className="text-xs text-slate-500">
            {[item.department?.name, item.suggested_model?.name, item.suggested_vendor?.name].filter(Boolean).join(" · ") || "-"}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge tone={priorityToneMap[item.priority] ?? "neutral"}>{item.priority}</Badge>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <Badge tone={statusToneMap[item.status] ?? "neutral"}>{item.status}</Badge>
          {item.approved_by_user && (
            <p className="text-xs text-slate-500">Approvata da {item.approved_by_user.full_name}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <Button type="button" variant="secondary" disabled={!canApproveRow || isApproving} onClick={onApprove}>
          {isApproving ? "Approvazione..." : "Approva"}
        </Button>
      </td>
    </tr>
  );
}
