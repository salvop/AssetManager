import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { changeMaintenanceTicketStatus, updateMaintenanceTicket } from "@/features/maintenance/api/maintenance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { ControlledSelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { useMaintenanceTicket } from "@/features/maintenance/hooks/useMaintenance";

type TicketFormValues = {
  title: string;
  description: string;
  vendor_id: string;
};

const ticketStatusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  CLOSED: "success",
};
const ticketStatusLabel: Record<string, string> = {
  OPEN: "Aperto",
  IN_PROGRESS: "In lavorazione",
  CLOSED: "Chiuso",
};

export function MaintenanceTicketDetailPage() {
  const params = useParams();
  const ticketId = Number(params.ticketId);
  const queryClient = useQueryClient();
  const { data: ticket, isLoading, error } = useMaintenanceTicket(ticketId);
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

  if (isLoading) return <p className="text-sm text-slate-500" aria-live="polite">Caricamento ticket…</p>;
  if (error || !ticket) return <p className="text-sm text-rose-600" aria-live="polite">{error?.message ?? "Ticket non trovato"}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dettaglio manutenzione"
        title={ticket.title}
        description={`${ticket.asset.code ?? ticket.asset.name} · aperto il ${new Date(ticket.opened_at).toLocaleString()}`}
        actions={(
          <Link
            to="/maintenance-tickets"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Torna ai ticket
          </Link>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel eyebrow="Anagrafica ticket" title="Modifica ticket" aria-busy={updateMutation.isPending}>
          <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="space-y-4">
            <label htmlFor="maintenance-detail-title" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titolo</span>
              <Input id="maintenance-detail-title" {...form.register("title")} />
            </label>
            <label htmlFor="maintenance-detail-vendor" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fornitore</span>
              <ControlledSelectField
                control={form.control}
                name="vendor_id"
                placeholder="Nessun fornitore"
                options={vendors.map((vendor) => ({
                  value: String(vendor.id),
                  label: vendor.name,
                }))}
              />
            </label>
            <label htmlFor="maintenance-detail-description" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Descrizione</span>
              <Textarea id="maintenance-detail-description" {...form.register("description")} className="min-h-32" />
            </label>
            <Button type="submit">
              {updateMutation.isPending ? "Salvataggio…" : "Salva ticket"}
            </Button>
          </form>
          {updateMutation.error && (
            <p className="mt-3 text-sm text-rose-600" aria-live="polite">
              {updateMutation.error.message}
            </p>
          )}
        </Panel>

        <section className="space-y-6">
          <Panel eyebrow="Riepilogo" title="Contesto">
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Asset:</span> {ticket.asset.code ?? ticket.asset.name}</p>
              <p>
                <span className="font-medium text-slate-900">Stato:</span> <Badge tone={ticketStatusTone[ticket.status] ?? "neutral"} className="ml-2">{ticketStatusLabel[ticket.status] ?? ticket.status}</Badge>
              </p>
              <p><span className="font-medium text-slate-900">Aperto il:</span> {new Date(ticket.opened_at).toLocaleString()}</p>
              <p><span className="font-medium text-slate-900">Aperto da:</span> {ticket.opened_by_user?.full_name ?? "-"}</p>
            </div>
          </Panel>

          <Panel eyebrow="Workflow stato" title="Azioni" aria-busy={statusMutation.isPending}>
            <div className="flex flex-col gap-3">
              {["OPEN", "IN_PROGRESS", "CLOSED"].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="secondary"
                  onClick={() => statusMutation.mutate(value)}
                  disabled={statusMutation.isPending || value === ticket.status}
                  className="justify-start"
                >
                  Imposta {ticketStatusLabel[value] ?? value}
                </Button>
              ))}
            </div>
            {statusMutation.error && (
              <p className="mt-3 text-sm text-rose-600" aria-live="polite">
                {statusMutation.error.message}
              </p>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}
