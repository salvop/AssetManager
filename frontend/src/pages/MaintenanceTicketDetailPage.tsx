import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { changeMaintenanceTicketStatus, updateMaintenanceTicket } from "../api/maintenance";
import { useLookupsBundle } from "../hooks/useLookups";
import { useMaintenanceTicket } from "../hooks/useMaintenance";

type TicketFormValues = {
  title: string;
  description: string;
  vendor_id: string;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

export function MaintenanceTicketDetailPage() {
  const params = useParams();
  const ticketId = Number(params.ticketId);
  const queryClient = useQueryClient();
  const { data: ticket, isLoading, error } = useMaintenanceTicket(ticketId);
  const { vendors } = useLookupsBundle();
  const form = useForm<TicketFormValues>({
    values: {
      title: ticket?.title ?? "",
      description: ticket?.description ?? "",
      vendor_id: ticket?.vendor?.id ? String(ticket.vendor.id) : "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: TicketFormValues) =>
      updateMaintenanceTicket(ticketId, {
        title: values.title,
        description: values.description || null,
        vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance-ticket", ticketId] });
      await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => changeMaintenanceTicketStatus(ticketId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["maintenance-ticket", ticketId] });
      await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Caricamento ticket...</p>;
  if (error || !ticket) return <p className="text-sm text-rose-600">{error?.message ?? "Ticket non trovato"}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Dettaglio manutenzione</p>
          <h2 className="mt-2 text-3xl font-semibold">{ticket.title}</h2>
        </div>
        <Link to="/maintenance-tickets" className="text-sm font-medium text-brand-700">
          Torna ai ticket
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="app-panel">
          <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Titolo</label>
              <input {...form.register("title")} className={inputClassName} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Fornitore</label>
              <select {...form.register("vendor_id")} className={inputClassName}>
                <option value="">Nessun fornitore</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Descrizione</label>
              <textarea {...form.register("description")} className={`${inputClassName} min-h-32`} />
            </div>
            <button className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900">
              {updateMutation.isPending ? "Salvataggio..." : "Salva ticket"}
            </button>
          </form>
        </section>

        <section className="space-y-6">
          <div className="app-panel">
            <h3 className="text-lg font-semibold text-slate-900">Riepilogo</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Asset:</span> {ticket.asset.code ?? ticket.asset.name}</p>
              <p><span className="font-medium text-slate-900">Stato:</span> {ticket.status}</p>
              <p><span className="font-medium text-slate-900">Aperto il:</span> {new Date(ticket.opened_at).toLocaleString()}</p>
              <p><span className="font-medium text-slate-900">Aperto da:</span> {ticket.opened_by_user?.full_name ?? "-"}</p>
            </div>
          </div>

          <div className="app-panel">
            <h3 className="text-lg font-semibold text-slate-900">Azioni stato</h3>
            <div className="mt-4 flex flex-col gap-3">
              {["OPEN", "IN_PROGRESS", "CLOSED"].map((value) => (
                <button
                  key={value}
                  onClick={() => statusMutation.mutate(value)}
                  className="rounded-full border border-slate-300 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50"
                >
                  Imposta {value}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
