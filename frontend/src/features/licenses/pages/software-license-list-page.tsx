import { zodResolver } from "@hookform/resolvers/zod";
import { type PaginationState, type SortingState } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { createSoftwareLicense } from "@/features/licenses/api/softwareLicenses";
import { SoftwareLicenseDataTable } from "@/features/licenses/components/software-license-data-table";
import {
  softwareLicenseFormSchema,
  type SoftwareLicenseFormValues,
} from "@/features/licenses/schemas/software-license-form.schema";
import { useSoftwareLicenses } from "@/features/licenses/hooks/useSoftwareLicenses";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";

const defaultValues: SoftwareLicenseFormValues = {
  product_name: "",
  license_type: "",
  vendor_id: "",
  purchased_quantity: "1",
  purchase_date: "",
  expiry_date: "",
  renewal_alert_days: "30",
  notes: "",
};

export function SoftwareLicenseListPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [search, setSearch] = useState("");
  const form = useForm<SoftwareLicenseFormValues>({
    resolver: zodResolver(softwareLicenseFormSchema),
    defaultValues,
  });
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
  const { data, isLoading, error } = useSoftwareLicenses({
    ...(search.trim() ? { search: search.trim() } : {}),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const summary = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: items.length,
      assigned: items.reduce((sum, item) => sum + item.active_assignments, 0),
      available: items.reduce((sum, item) => sum + item.available_quantity, 0),
      expiring: items.filter((item) => item.expiry_date).length,
    };
  }, [data]);

  const createMutation = useMutation({
    mutationFn: (values: SoftwareLicenseFormValues) =>
      createSoftwareLicense({
        product_name: values.product_name,
        license_type: values.license_type,
        vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
        purchased_quantity: Number(values.purchased_quantity),
        purchase_date: values.purchase_date || null,
        expiry_date: values.expiry_date || null,
        renewal_alert_days: Number(values.renewal_alert_days),
        notes: values.notes || null,
      }),
    onSuccess: async () => {
      form.reset(defaultValues);
      await queryClient.invalidateQueries({ queryKey: ["software-licenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const onSubmit = (values: SoftwareLicenseFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Software Asset Management"
        title="Licenze software"
        description="Registra le licenze, controlla la disponibilita residua e presidia rinnovi e scadenze."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Licenze censite" value={summary.total} />
        <SummaryCard title="Assegnazioni attive" value={summary.assigned} />
        <SummaryCard title="Disponibilita residua" value={summary.available} />
        <SummaryCard title="Con scadenza" value={summary.expiring} />
      </div>

      <Panel title="Nuova licenza">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField
                control={form.control}
                name="product_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prodotto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Prodotto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="license_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo licenza</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Tipo licenza" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormSelectField
                control={form.control}
                name="vendor_id"
                label="Vendor"
                placeholder="Nessun vendor"
                options={vendors.map((vendor) => ({
                  value: String(vendor.id),
                  label: vendor.name,
                }))}
              />
              <FormField
                control={form.control}
                name="purchased_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantita acquistata</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data acquisto</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scadenza</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewal_alert_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert rinnovo (giorni)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Note operative" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {createMutation.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Licenza non registrata</AlertTitle>
                <AlertDescription>{createMutation.error.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvataggio..." : "Registra licenza"}
              </Button>
            </div>
          </form>
        </Form>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-border px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-foreground">Catalogo licenze</h3>
            <p className="text-sm text-muted-foreground">
              Ricerca prodotti, scadenze e disponibilita residue.
            </p>
          </div>
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
            placeholder="Cerca per prodotto o tipo"
            className="lg:max-w-sm"
          />
        </div>
        <div className="px-6 py-5">
          <SoftwareLicenseDataTable
            data={data?.items ?? []}
            sorting={sorting}
            pagination={pagination}
            onSortingChange={setSorting}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            errorMessage={error?.message ?? null}
            rowCount={data?.items.length ?? 0}
            pageCount={Math.max(1, Math.ceil((data?.items.length ?? 0) / pagination.pageSize))}
          />
        </div>
      </Panel>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Panel>
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      </div>
    </Panel>
  );
}
