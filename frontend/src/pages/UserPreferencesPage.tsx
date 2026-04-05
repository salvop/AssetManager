import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMyPreferences, updateMyPreferences } from "../api/preferences";
import { PageHeader } from "../components/ui/page-header";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

type PreferencesFormState = {
  language: string;
  timezone: string;
  date_format: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY";
  table_density: "compact" | "comfortable";
  default_page_size: string;
};

export function UserPreferencesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: getMyPreferences,
  });

  const [form, setForm] = useState<PreferencesFormState>({
    language: "it-IT",
    timezone: "Europe/Rome",
    date_format: "DD/MM/YYYY",
    table_density: "comfortable",
    default_page_size: "25",
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    setForm({
      language: data.language,
      timezone: data.timezone,
      date_format: data.date_format,
      table_density: data.table_density,
      default_page_size: String(data.default_page_size),
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyPreferences({
        language: form.language,
        timezone: form.timezone,
        date_format: form.date_format,
        table_density: form.table_density,
        default_page_size: Number(form.default_page_size),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profilo utente"
        title="Preferenze"
        description="Imposta formato date, lingua e opzioni di visualizzazione personali."
      />

      <section className="app-panel max-w-3xl space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Lingua
            <select
              className={`${inputClassName} mt-2`}
              value={form.language}
              onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
            >
              <option value="it-IT">Italiano (it-IT)</option>
              <option value="en-US">English (en-US)</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Timezone
            <input
              className={`${inputClassName} mt-2`}
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              placeholder="Europe/Rome"
            />
          </label>

          <label className="text-sm text-slate-700">
            Formato data
            <select
              className={`${inputClassName} mt-2`}
              value={form.date_format}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date_format: event.target.value as PreferencesFormState["date_format"],
                }))
              }
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Densita tabelle
            <select
              className={`${inputClassName} mt-2`}
              value={form.table_density}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  table_density: event.target.value as PreferencesFormState["table_density"],
                }))
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Righe per pagina
            <input
              type="number"
              min={10}
              max={200}
              className={`${inputClassName} mt-2`}
              value={form.default_page_size}
              onChange={(event) => setForm((current) => ({ ...current, default_page_size: event.target.value }))}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isLoading}
          className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
        >
          Salva preferenze
        </button>

        {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento preferenze…</p>}
        {error && <p className="text-sm text-rose-600">{String(error.message)}</p>}
        {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
        {mutation.isSuccess && <p className="text-sm text-emerald-700">Preferenze aggiornate.</p>}
      </section>
    </div>
  );
}
