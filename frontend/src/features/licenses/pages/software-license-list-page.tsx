import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import { createSoftwareLicense } from "@/features/licenses/api/softwareLicenses";
import { SoftwareLicenseDataTable } from "@/features/licenses/components/software-license-data-table";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { useSoftwareLicenses } from "@/features/licenses/hooks/useSoftwareLicenses";

export function SoftwareLicenseListPage() {
  const queryClient = useQueryClient();
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
  const [search, setSearch] = useState("");
  const [productName, setProductName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchasedQuantity, setPurchasedQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [renewalAlertDays, setRenewalAlertDays] = useState("30");
  const [notes, setNotes] = useState("");
  const { data, isLoading, error } = useSoftwareLicenses(search.trim() || undefined);

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
    mutationFn: () =>
      createSoftwareLicense({
        product_name: productName,
        license_type: licenseType,
        vendor_id: vendorId ? Number(vendorId) : null,
        purchased_quantity: Number(purchasedQuantity),
        purchase_date: purchaseDate || null,
        expiry_date: expiryDate || null,
        renewal_alert_days: Number(renewalAlertDays),
        notes: notes || null,
      }),
    onSuccess: async () => {
      setProductName("");
      setLicenseType("");
      setVendorId("");
      setPurchasedQuantity("1");
      setPurchaseDate("");
      setExpiryDate("");
      setRenewalAlertDays("30");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["software-licenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  return (
    <div className="space-y-6">
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
        <p className="mt-2 text-sm text-slate-500">Inserisci il pacchetto licenze da mettere a catalogo.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Prodotto" />
          <Input value={licenseType} onChange={(event) => setLicenseType(event.target.value)} placeholder="Tipo licenza" />
          <SelectField
            value={vendorId}
            onValueChange={setVendorId}
            placeholder="Nessun vendor"
            options={vendors.map((vendor) => ({ value: String(vendor.id), label: vendor.name }))}
          />
          <Input value={purchasedQuantity} onChange={(event) => setPurchasedQuantity(event.target.value)} type="number" min={1} />
          <Input value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} type="date" />
          <Input value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} type="date" />
          <Input value={renewalAlertDays} onChange={(event) => setRenewalAlertDays(event.target.value)} type="number" min={0} />
          <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Note" />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>{createMutation.error && <p className="text-sm text-rose-600">{createMutation.error.message}</p>}</div>
          <Button
            disabled={!productName || !licenseType || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Salvataggio..." : "Registra licenza"}
          </Button>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Catalogo licenze</h3>
            <p className="mt-1 text-sm text-slate-500">Ricerca prodotti, scadenze e disponibilita residue.</p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca per prodotto o tipo"
            className="lg:max-w-sm"
          />
        </div>
        <div className="px-6 py-5">
          <SoftwareLicenseDataTable data={data?.items ?? []} />
        </div>
      </Panel>

      {isLoading && <p className="text-sm text-slate-500">Caricamento licenze...</p>}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Panel>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </Panel>
  );
}
