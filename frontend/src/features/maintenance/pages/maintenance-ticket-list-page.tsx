import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMaintenanceTicket } from "@/features/maintenance/api/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { MaintenanceTicketDataTable } from "@/features/maintenance/components/maintenance-ticket-data-table";
import { useMaintenanceTickets } from "@/features/maintenance/hooks/useMaintenance";

export function MaintenanceTicketListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useMaintenanceTickets();
  const { data: assetData } = useAssets({});
  const { vendors } = useLookupsBundle({
    vendors: true,
    departments: false,
    locations: false,
    categories: false,
    models: false,
    statuses: false,
    employees: false,
    users: false,
  });
  const [assetId, setAssetId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createMaintenanceTicket({
        asset_id: Number(assetId),
        vendor_id: vendorId ? Number(vendorId) : null,
        title,
        description: description || null,
      }),
    onSuccess: async () => {
      setAssetId("");
      setVendorId("");
      setTitle("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manutenzione"
        title="Ticket"
        description="Apri nuovi interventi e monitora lo stato delle attivita di supporto."
      />

      <Panel eyebrow="Nuovo ticket" title="Apri un ticket di manutenzione" className="scroll-mt-6" aria-busy={createMutation.isPending}>
        <div className="grid gap-4 md:grid-cols-2">
          <label htmlFor="maintenance-list-asset" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asset</span>
            <SelectField
              value={assetId}
              onValueChange={setAssetId}
              placeholder="Seleziona asset"
              options={(assetData?.items ?? []).map((asset) => ({
                value: String(asset.id),
                label: `${asset.asset_tag} - ${asset.name}`,
              }))}
            />
          </label>
          <label htmlFor="maintenance-list-vendor" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fornitore</span>
            <SelectField
              value={vendorId}
              onValueChange={setVendorId}
              placeholder="Nessun fornitore"
              options={vendors.map((vendor) => ({
                value: String(vendor.id),
                label: vendor.name,
              }))}
            />
          </label>
          <label htmlFor="maintenance-list-title" className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titolo</span>
            <Input
              id="maintenance-list-title"
              name="maintenance-list-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titolo ticket…"
            />
          </label>
          <label htmlFor="maintenance-list-description" className="space-y-2 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Descrizione</span>
            <Textarea
              id="maintenance-list-description"
              name="maintenance-list-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrivi il problema o l'intervento richiesto…"
              className="min-h-28"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            {createMutation.error && (
              <p className="text-sm text-rose-600" aria-live="polite">
                {createMutation.error.message}
              </p>
            )}
          </div>
          <Button
            type="button"
            disabled={!assetId || !title || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Apertura…" : "Apri ticket"}
          </Button>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0" eyebrow="Vista tabellare" title="Lista ticket" aria-busy={isLoading}>
        <div className="px-6 py-5">
          <MaintenanceTicketDataTable data={data?.items ?? []} />
        </div>
      </Panel>

      {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento ticket…</p>}
      {error && <p className="text-sm text-rose-600" aria-live="polite">{error.message}</p>}
    </div>
  );
}
