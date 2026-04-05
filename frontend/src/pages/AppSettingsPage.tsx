import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getAppSettings, updateAppSettings } from "../api/preferences";
import { PageHeader } from "../components/ui/page-header";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLookupsBundle } from "../hooks/useLookups";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

type SettingsFormState = {
  org_name: string;
  default_asset_status_on_create_id: string;
  max_document_size_mb: string;
  allowed_document_mime_types: string;
};

export function AppSettingsPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { statuses } = useLookupsBundle({
    departments: false,
    locations: false,
    vendors: false,
    categories: false,
    models: false,
    statuses: true,
    employees: false,
    users: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });

  const [form, setForm] = useState<SettingsFormState>({
    org_name: "",
    default_asset_status_on_create_id: "",
    max_document_size_mb: "10",
    allowed_document_mime_types: "",
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setForm({
      org_name: data.org_name,
      default_asset_status_on_create_id: String(data.default_asset_status_on_create_id),
      max_document_size_mb: String(data.max_document_size_mb),
      allowed_document_mime_types: data.allowed_document_mime_types.join(", "),
    });
  }, [data]);

  const writableStatuses = useMemo(
    () => statuses.filter((status) => !["RETIRED", "DISPOSED"].includes(status.code ?? "")),
    [statuses],
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateAppSettings({
        org_name: form.org_name,
        default_asset_status_on_create_id: Number(form.default_asset_status_on_create_id),
        max_document_size_mb: Number(form.max_document_size_mb),
        allowed_document_mime_types: form.allowed_document_mime_types
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
  });

  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;

  if (!isAdmin) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-2xl font-semibold">Impostazioni applicazione</h2>
        <p className="mt-2 text-sm">Questa sezione e disponibile solo per gli amministratori di sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Amministrazione"
        title="Impostazioni applicazione"
        description="Configura valori globali dell'istanza per creazione asset e documenti."
      />

      <section className="app-panel max-w-3xl space-y-4">
        <label className="block text-sm text-slate-700">
          Nome organizzazione
          <input
            className={`${inputClassName} mt-2`}
            value={form.org_name}
            onChange={(event) => setForm((current) => ({ ...current, org_name: event.target.value }))}
            placeholder="Asset Manager"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Stato default alla creazione asset
            <select
              className={`${inputClassName} mt-2`}
              value={form.default_asset_status_on_create_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, default_asset_status_on_create_id: event.target.value }))
              }
            >
              {writableStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Dimensione max documenti (MB)
            <input
              type="number"
              min={1}
              max={100}
              className={`${inputClassName} mt-2`}
              value={form.max_document_size_mb}
              onChange={(event) => setForm((current) => ({ ...current, max_document_size_mb: event.target.value }))}
            />
          </label>
        </div>

        <label className="block text-sm text-slate-700">
          MIME types consentiti (separati da virgola)
          <textarea
            className={`${inputClassName} mt-2 min-h-24 resize-y`}
            value={form.allowed_document_mime_types}
            onChange={(event) =>
              setForm((current) => ({ ...current, allowed_document_mime_types: event.target.value }))
            }
            placeholder="application/pdf, image/png, image/jpeg"
          />
        </label>

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isLoading}
          className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
        >
          Salva impostazioni
        </button>

        {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento impostazioni…</p>}
        {error && <p className="text-sm text-rose-600">{String(error.message)}</p>}
        {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
        {mutation.isSuccess && <p className="text-sm text-emerald-700">Impostazioni aggiornate.</p>}
      </section>
    </div>
  );
}
