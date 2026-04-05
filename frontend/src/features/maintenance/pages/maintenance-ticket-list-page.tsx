import { zodResolver } from "@hookform/resolvers/zod";
import { type PaginationState, type SortingState } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { createMaintenanceTicket } from "@/features/maintenance/api/maintenance";
import { MaintenanceTicketDataTable } from "@/features/maintenance/components/maintenance-ticket-data-table";
import {
  maintenanceTicketFormSchema,
  type MaintenanceTicketFormValues,
} from "@/features/maintenance/schemas/maintenance-ticket-form.schema";
import { useMaintenanceTickets } from "@/features/maintenance/hooks/useMaintenance";

const defaultValues: MaintenanceTicketFormValues = {
  asset_id: "",
  vendor_id: "",
  title: "",
  description: "",
};

export function MaintenanceTicketListPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const form = useForm<MaintenanceTicketFormValues>({
    resolver: zodResolver(maintenanceTicketFormSchema),
    defaultValues,
  });
  const { data, isLoading, error } = useMaintenanceTickets({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
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

  const createMutation = useMutation({
    mutationFn: (values: MaintenanceTicketFormValues) =>
      createMaintenanceTicket({
        asset_id: Number(values.asset_id),
        vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
        title: values.title,
        description: values.description || null,
      }),
    onSuccess: async () => {
      form.reset(defaultValues);
      await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const onSubmit = (values: MaintenanceTicketFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Manutenzione"
        title="Ticket"
        description="Apri nuovi interventi e monitora lo stato delle attivita di supporto."
      />

      <Panel
        eyebrow="Nuovo ticket"
        title="Apri un ticket di manutenzione"
        className="scroll-mt-6"
        aria-busy={createMutation.isPending}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormSelectField
                control={form.control}
                name="asset_id"
                label="Asset"
                placeholder="Seleziona asset"
                options={(assetData?.items ?? []).map((asset) => ({
                  value: String(asset.id),
                  label: `${asset.asset_tag} - ${asset.name}`,
                }))}
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
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Titolo</FormLabel>
                    <FormControl>
                      <Input {...field} id="maintenance-list-title" placeholder="Titolo ticket" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="maintenance-list-description"
                        placeholder="Descrivi il problema o l'intervento richiesto"
                        className="min-h-28"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {createMutation.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Ticket non creato</AlertTitle>
                <AlertDescription>{createMutation.error.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Apertura…" : "Apri ticket"}
              </Button>
            </div>
          </form>
        </Form>
      </Panel>

      <Panel className="overflow-hidden p-0" eyebrow="Vista tabellare" title="Lista ticket" aria-busy={isLoading}>
        <div className="px-6 py-5">
          <MaintenanceTicketDataTable
            data={data?.items ?? []}
            sorting={sorting}
            pagination={pagination}
            onSortingChange={setSorting}
            onPaginationChange={setPagination}
            rowCount={data?.total ?? 0}
            pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / pagination.pageSize))}
            isLoading={isLoading}
            errorMessage={error?.message ?? null}
          />
        </div>
      </Panel>
    </div>
  );
}
