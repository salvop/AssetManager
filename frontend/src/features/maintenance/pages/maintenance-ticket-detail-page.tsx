import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { changeMaintenanceTicketStatus, updateMaintenanceTicket } from "@/features/maintenance/api/maintenance";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { useMaintenanceTicket } from "@/features/maintenance/hooks/useMaintenance";
import {
  maintenanceTicketDetailFormSchema,
  type MaintenanceTicketDetailFormValues,
} from "@/features/maintenance/schemas/maintenance-ticket-detail-form.schema";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const defaultValues: MaintenanceTicketDetailFormValues = {
  title: "",
  description: "",
  vendor_id: "",
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
  const form = useForm<MaintenanceTicketDetailFormValues>({
    resolver: zodResolver(maintenanceTicketDetailFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!ticket) {
      return;
    }

    form.reset({
      title: ticket.title,
      description: ticket.description ?? "",
      vendor_id: ticket.vendor?.id ? String(ticket.vendor.id) : "",
    });
  }, [form, ticket]);

  const updateMutation = useMutation({
    mutationFn: (values: MaintenanceTicketDetailFormValues) =>
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Ticket non disponibile</AlertTitle>
        <AlertDescription>{error?.message ?? "Ticket non trovato"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dettaglio manutenzione"
        title={ticket.title}
        description={`${ticket.asset.code ?? ticket.asset.name} · aperto il ${new Date(ticket.opened_at).toLocaleString()}`}
        actions={(
          <Button asChild variant="outline">
            <Link to="/maintenance-tickets">Torna ai ticket</Link>
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel eyebrow="Anagrafica ticket" title="Modifica ticket" aria-busy={updateMutation.isPending}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titolo</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormSelectField
                control={form.control}
                name="vendor_id"
                label="Fornitore"
                placeholder="Nessun fornitore"
                options={vendors.map((vendor) => ({
                  value: String(vendor.id),
                  label: vendor.name,
                }))}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ""} className="min-h-32" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {updateMutation.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Salvataggio non completato</AlertTitle>
                  <AlertDescription>{updateMutation.error.message}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit">
                  {updateMutation.isPending ? "Salvataggio…" : "Salva ticket"}
                </Button>
              </div>
            </form>
          </Form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel eyebrow="Riepilogo" title="Contesto">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Asset:</span> {ticket.asset.code ?? ticket.asset.name}</p>
              <p>
                <span className="font-medium text-foreground">Stato:</span>
                <Badge tone={ticketStatusTone[ticket.status] ?? "neutral"} className="ml-2">
                  {ticketStatusLabel[ticket.status] ?? ticket.status}
                </Badge>
              </p>
              <p><span className="font-medium text-foreground">Aperto il:</span> {new Date(ticket.opened_at).toLocaleString()}</p>
              <p><span className="font-medium text-foreground">Aperto da:</span> {ticket.opened_by_user?.full_name ?? "-"}</p>
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

            {statusMutation.error ? (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle />
                <AlertTitle>Aggiornamento stato non completato</AlertTitle>
                <AlertDescription>{statusMutation.error.message}</AlertDescription>
              </Alert>
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}

