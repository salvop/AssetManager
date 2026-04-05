import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createMaintenanceTicket } from "../api/maintenance";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { PageHeader } from "../components/ui/page-header";
import { Panel } from "../components/ui/panel";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useAssets } from "../hooks/useAssets";
import { useLookupsBundle } from "../hooks/useLookups";
import { useMaintenanceTickets } from "../hooks/useMaintenance";

const ticketStatusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  CLOSED: "success",
};

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
            <Select id="maintenance-list-asset" name="maintenance-list-asset" value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              <option value="">Seleziona asset</option>
              {(assetData?.items ?? []).map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_tag} - {asset.name}
                </option>
              ))}
            </Select>
          </label>
          <label htmlFor="maintenance-list-vendor" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fornitore</span>
            <Select id="maintenance-list-vendor" name="maintenance-list-vendor" value={vendorId} onChange={(event) => setVendorId(event.target.value)}>
              <option value="">Nessun fornitore</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <caption className="sr-only">Elenco ticket di manutenzione</caption>
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                <th scope="col" className="px-6 py-4 font-semibold">Titolo</th>
                <th scope="col" className="px-6 py-4 font-semibold">Asset</th>
                <th scope="col" className="px-6 py-4 font-semibold">Stato</th>
                <th scope="col" className="px-6 py-4 font-semibold">Aperto il</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(data?.items ?? []).map((ticket) => (
                <tr key={ticket.id} className="text-sm">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <Link to={`/maintenance-tickets/${ticket.id}`} className="text-brand-700 hover:underline focus-visible:underline">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{ticket.asset.code ?? ticket.asset.name}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <Badge tone={ticketStatusTone[ticket.status] ?? "neutral"}>{ticket.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{new Date(ticket.opened_at).toLocaleString()}</td>
                </tr>
              ))}
              {!isLoading && (data?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nessun ticket di manutenzione disponibile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento ticket…</p>}
      {error && <p className="text-sm text-rose-600" aria-live="polite">{error.message}</p>}
    </div>
  );
}
