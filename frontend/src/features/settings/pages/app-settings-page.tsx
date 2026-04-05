import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAppSettings, updateAppSettings } from "@/features/users/api/preferences";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";

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
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          <span>Nome organizzazione</span>
          <Input
            value={form.org_name}
            onChange={(event) => setForm((current) => ({ ...current, org_name: event.target.value }))}
            placeholder="OpsAsset"
          />
        </div>

        <div className="grid gap-x-4 gap-y-6 md:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <span>Stato default alla creazione asset</span>
            <SelectField
              value={form.default_asset_status_on_create_id}
              onValueChange={(value) => setForm((current) => ({ ...current, default_asset_status_on_create_id: value }))}
              placeholder="Seleziona stato"
              options={writableStatuses.map((status) => ({ value: String(status.id), label: status.name }))}
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <span>Dimensione max documenti (MB)</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.max_document_size_mb}
              onChange={(event) => setForm((current) => ({ ...current, max_document_size_mb: event.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm text-slate-700">
          <span>MIME types consentiti (separati da virgola)</span>
          <Textarea
            className="min-h-24 resize-y"
            value={form.allowed_document_mime_types}
            onChange={(event) =>
              setForm((current) => ({ ...current, allowed_document_mime_types: event.target.value }))
            }
            placeholder="application/pdf, image/png, image/jpeg"
          />
        </div>

        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isLoading}
          className="rounded-full"
        >
          Salva impostazioni
        </Button>

        {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento impostazioni…</p>}
        {error && <p className="text-sm text-rose-600">{String(error.message)}</p>}
        {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
        {mutation.isSuccess && <p className="text-sm text-emerald-700">Impostazioni aggiornate.</p>}
      </section>
    </div>
  );
}
