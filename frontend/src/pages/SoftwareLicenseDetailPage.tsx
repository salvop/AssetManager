import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  assignSoftwareLicense,
  revokeSoftwareLicenseAssignment,
  updateSoftwareLicense,
} from "../api/softwareLicenses";
import { useAssets } from "../hooks/useAssets";
import { useLookupsBundle } from "../hooks/useLookups";
import { useSoftwareLicense } from "../hooks/useSoftwareLicenses";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

export function SoftwareLicenseDetailPage() {
  const params = useParams();
  const licenseId = Number(params.licenseId);
  const queryClient = useQueryClient();
  const { vendors, users } = useLookupsBundle({
    vendors: true,
    users: true,
    departments: false,
    locations: false,
    categories: false,
    models: false,
    statuses: false,
    employees: false,
  });
  const { data: assetsData } = useAssets({});
  const { data: license, isLoading, error } = useSoftwareLicense(licenseId);
  const [productName, setProductName] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchasedQuantity, setPurchasedQuantity] = useState("1");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [renewalAlertDays, setRenewalAlertDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"user" | "asset">("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  useEffect(() => {
    if (!license) {
      return;
    }
    setProductName(license.product_name);
    setLicenseType(license.license_type);
    setVendorId(license.vendor?.id ? String(license.vendor.id) : "");
    setPurchasedQuantity(String(license.purchased_quantity));
    setPurchaseDate(license.purchase_date ?? "");
    setExpiryDate(license.expiry_date ?? "");
    setRenewalAlertDays(String(license.renewal_alert_days));
    setNotes(license.notes ?? "");
  }, [license]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["software-license", licenseId] });
    await queryClient.invalidateQueries({ queryKey: ["software-licenses"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      updateSoftwareLicense(licenseId, {
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
      await invalidate();
    },
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assignSoftwareLicense(licenseId, {
        user_id: assignmentMode === "user" && selectedUserId ? Number(selectedUserId) : null,
        asset_id: assignmentMode === "asset" && selectedAssetId ? Number(selectedAssetId) : null,
        notes: assignmentNotes || null,
      }),
    onSuccess: async () => {
      setSelectedUserId("");
      setSelectedAssetId("");
      setAssignmentNotes("");
      await invalidate();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      revokeSoftwareLicenseAssignment(assignmentId, {
        notes: "Revoca registrata da interfaccia",
      }),
    onSuccess: async () => {
      await invalidate();
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Caricamento licenza...</p>;
  if (error || !license) return <p className="text-sm text-rose-600">{error?.message ?? "Licenza non trovata"}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">SAM</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">{license.product_name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {license.license_type} · {license.available_quantity} disponibili su {license.purchased_quantity}
          </p>
        </div>
        <Link to="/software-licenses" className="text-sm font-medium text-brand-700">
          Torna alle licenze
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="app-panel">
          <h3 className="text-lg font-semibold text-slate-900">Anagrafica licenza</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            <div>{updateMutation.error && <p className="text-sm text-rose-600">{updateMutation.error.message}</p>}</div>
            <button
              onClick={() => updateMutation.mutate()}
              className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="app-panel">
            <h3 className="text-lg font-semibold text-slate-900">Riepilogo</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-medium text-slate-900">Vendor:</span> {license.vendor?.name ?? "-"}</p>
              <p><span className="font-medium text-slate-900">Acquisto:</span> {license.purchase_date ?? "-"}</p>
              <p><span className="font-medium text-slate-900">Scadenza:</span> {license.expiry_date ?? "-"}</p>
              <p><span className="font-medium text-slate-900">Alert rinnovo:</span> {license.renewal_alert_days} giorni</p>
              <p><span className="font-medium text-slate-900">Assegnazioni attive:</span> {license.active_assignments}</p>
            </div>
          </div>

          <div className="app-panel">
            <h3 className="text-lg font-semibold text-slate-900">Assegna licenza</h3>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentMode("user")}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    assignmentMode === "user" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  A utente
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentMode("asset")}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    assignmentMode === "asset" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700",
                  ].join(" ")}
                >
                  A asset
                </button>
              </div>
              {assignmentMode === "user" ? (
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className={inputClassName}>
                  <option value="">Seleziona utente</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              ) : (
                <select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)} className={inputClassName}>
                  <option value="">Seleziona asset</option>
                  {(assetsData?.items ?? []).map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_tag} - {asset.name}
                    </option>
                  ))}
                </select>
              )}
              <textarea value={assignmentNotes} onChange={(event) => setAssignmentNotes(event.target.value)} placeholder="Note assegnazione" className={`${inputClassName} min-h-28`} />
              {assignMutation.error && <p className="text-sm text-rose-600">{assignMutation.error.message}</p>}
              <button
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending || (assignmentMode === "user" ? !selectedUserId : !selectedAssetId)}
                className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assegnazione..." : "Conferma assegnazione"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="app-panel">
          <h3 className="text-lg font-semibold text-slate-900">Assegnazioni</h3>
          <div className="mt-4 space-y-3">
            {license.assignments.map((assignment) => {
              const targetLabel = assignment.user?.full_name ?? assignment.asset?.name ?? assignment.asset?.code ?? "Target";
              return (
                <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{targetLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Assegnata il {new Date(assignment.assigned_at).toLocaleString()} da {assignment.assigned_by_user.full_name}
                      </p>
                      {assignment.notes && <p className="mt-2 text-sm text-slate-600">{assignment.notes}</p>}
                    </div>
                    {assignment.revoked_at ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Revocata</span>
                    ) : (
                      <button
                        onClick={() => revokeMutation.mutate(assignment.id)}
                        disabled={revokeMutation.isPending}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Revoca
                      </button>
                    )}
                  </div>
                  {assignment.revoked_at && (
                    <p className="mt-2 text-xs text-slate-500">Revocata il {new Date(assignment.revoked_at).toLocaleString()}</p>
                  )}
                </div>
              );
            })}
            {!license.assignments.length && <p className="text-sm text-slate-500">Nessuna assegnazione registrata.</p>}
          </div>
        </section>

        <section className="app-panel">
          <h3 className="text-lg font-semibold text-slate-900">Timeline licenza</h3>
          <div className="mt-4 space-y-3">
            {license.events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.summary}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(event.created_at).toLocaleString()}
                      {event.performed_by_user ? ` · ${event.performed_by_user.full_name}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {event.event_type}
                  </span>
                </div>
              </div>
            ))}
            {!license.events.length && <p className="text-sm text-slate-500">Nessun evento registrato.</p>}
          </div>
        </section>
      </div>

      {license.active_assignments >= license.purchased_quantity && (
        <p className="text-sm text-amber-700">Tutte le postazioni risultano occupate. Revoca un’assegnazione per liberare disponibilita.</p>
      )}
      {revokeMutation.error && <p className="text-sm text-rose-600">{revokeMutation.error.message}</p>}
    </div>
  );
}
