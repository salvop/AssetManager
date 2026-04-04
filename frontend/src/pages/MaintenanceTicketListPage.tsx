import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createMaintenanceTicket } from "../api/maintenance";
import { useAssets } from "../hooks/useAssets";
import { useLookupsBundle } from "../hooks/useLookups";
import { useMaintenanceTickets } from "../hooks/useMaintenance";

export function MaintenanceTicketListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useMaintenanceTickets();
  const { data: assetData } = useAssets({});
  const { vendors } = useLookupsBundle();
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
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Manutenzione</p>
        <h2 className="mt-2 text-3xl font-semibold">Ticket</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Apri un nuovo ticket</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select value={assetId} onChange={(event) => setAssetId(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">Seleziona asset</option>
            {(assetData?.items ?? []).map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_tag} - {asset.name}
              </option>
            ))}
          </select>
          <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
            <option value="">Nessun fornitore</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titolo ticket"
            className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrivi il problema o l'intervento richiesto"
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            {createMutation.error && <p className="text-sm text-rose-600">{createMutation.error.message}</p>}
          </div>
          <button
            disabled={!assetId || !title || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Apertura..." : "Apri ticket"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-4 py-3 font-medium">Titolo</th>
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Stato</th>
              <th className="px-4 py-3 font-medium">Aperto il</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data?.items ?? []).map((ticket) => (
              <tr key={ticket.id} className="text-sm">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link to={`/maintenance-tickets/${ticket.id}`} className="text-brand-700 hover:underline">
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">{ticket.asset.code ?? ticket.asset.name}</td>
                <td className="px-4 py-3 text-slate-700">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{new Date(ticket.opened_at).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  Nessun ticket di manutenzione disponibile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {isLoading && <p className="text-sm text-slate-500">Caricamento ticket...</p>}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}
