import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createSoftwareLicense } from "../api/softwareLicenses";
import { useLookupsBundle } from "../hooks/useLookups";
import { useSoftwareLicenses } from "../hooks/useSoftwareLicenses";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

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
      <div className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Software Asset Management</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">Licenze software</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Registra le licenze, controlla la disponibilita residua e presidia rinnovi e scadenze.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Licenze censite" value={summary.total} />
        <SummaryCard title="Assegnazioni attive" value={summary.assigned} />
        <SummaryCard title="Disponibilita residua" value={summary.available} />
        <SummaryCard title="Con scadenza" value={summary.expiring} />
      </div>

      <section className="app-panel">
        <h3 className="text-lg font-semibold text-slate-900">Nuova licenza</h3>
        <p className="mt-2 text-sm text-slate-500">Inserisci il pacchetto licenze da mettere a catalogo.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Prodotto" className={inputClassName} />
          <input value={licenseType} onChange={(event) => setLicenseType(event.target.value)} placeholder="Tipo licenza" className={inputClassName} />
          <select value={vendorId} onChange={(event) => setVendorId(event.target.value)} className={inputClassName}>
            <option value="">Nessun vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          <input value={purchasedQuantity} onChange={(event) => setPurchasedQuantity(event.target.value)} type="number" min={1} className={inputClassName} />
          <input value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} type="date" className={inputClassName} />
          <input value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} type="date" className={inputClassName} />
          <input value={renewalAlertDays} onChange={(event) => setRenewalAlertDays(event.target.value)} type="number" min={0} className={inputClassName} />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Note" className={inputClassName} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>{createMutation.error && <p className="text-sm text-rose-600">{createMutation.error.message}</p>}</div>
          <button
            disabled={!productName || !licenseType || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
          >
            {createMutation.isPending ? "Salvataggio..." : "Registra licenza"}
          </button>
        </div>
      </section>

      <section className="app-panel overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Catalogo licenze</h3>
            <p className="mt-1 text-sm text-slate-500">Ricerca prodotti, scadenze e disponibilita residue.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca per prodotto o tipo"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100 lg:max-w-sm"
          />
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-6 py-4 font-semibold">Prodotto</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Vendor</th>
              <th className="px-6 py-4 font-semibold">Disponibilita</th>
              <th className="px-6 py-4 font-semibold">Scadenza</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data?.items ?? []).map((license) => (
              <tr key={license.id} className="text-sm">
                <td className="px-6 py-4 font-medium text-slate-900">
                  <Link to={`/software-licenses/${license.id}`} className="text-brand-700 hover:underline">
                    {license.product_name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-700">{license.license_type}</td>
                <td className="px-6 py-4 text-slate-700">{license.vendor?.name ?? "-"}</td>
                <td className="px-6 py-4 text-slate-700">
                  {license.available_quantity} / {license.purchased_quantity}
                </td>
                <td className="px-6 py-4 text-slate-700">{license.expiry_date ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nessuna licenza software disponibile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {isLoading && <p className="text-sm text-slate-500">Caricamento licenze...</p>}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <section className="app-panel">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    </section>
  );
}
