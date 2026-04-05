import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getMyPreferences, updateMyPreferences } from "@/features/users/api/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ControlledSelectField } from "@/components/ui/select-field";

const timezoneOptions = [
  "Europe/Rome",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;
const languageOptions = ["it-IT", "en-US"] as const;
const dateFormatOptions = ["DD/MM/YYYY", "YYYY-MM-DD", "MM/DD/YYYY"] as const;
const tableDensityOptions = ["compact", "comfortable"] as const;

const preferencesSchema = z.object({
  language: z.enum(languageOptions),
  timezone: z.enum(timezoneOptions),
  date_format: z.enum(dateFormatOptions),
  table_density: z.enum(tableDensityOptions),
  default_page_size: z.coerce.number().min(10).max(200),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

const defaultPreferences: PreferencesFormValues = {
  language: "it-IT",
  timezone: "Europe/Rome",
  date_format: "DD/MM/YYYY",
  table_density: "comfortable",
  default_page_size: 25,
};

function includesOption<T extends readonly string[]>(options: T, value: string): value is T[number] {
  return options.includes(value);
}

export function UserPreferencesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: getMyPreferences,
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: defaultPreferences,
  });

  useEffect(() => {
    if (!data) return;

    const normalizedValues: PreferencesFormValues = {
      language: includesOption(languageOptions, data.language) ? data.language : defaultPreferences.language,
      timezone: includesOption(timezoneOptions, data.timezone) ? data.timezone : defaultPreferences.timezone,
      date_format: includesOption(dateFormatOptions, data.date_format) ? data.date_format : defaultPreferences.date_format,
      table_density: includesOption(tableDensityOptions, data.table_density)
        ? data.table_density
        : defaultPreferences.table_density,
      default_page_size:
        Number.isFinite(data.default_page_size) && data.default_page_size >= 10 && data.default_page_size <= 200
          ? data.default_page_size
          : defaultPreferences.default_page_size,
    };

    form.reset({
      ...normalizedValues,
    });
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (values: PreferencesFormValues) =>
      updateMyPreferences({
        language: values.language,
        timezone: values.timezone,
        date_format: values.date_format,
        table_density: values.table_density,
        default_page_size: values.default_page_size,
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
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <div className="grid gap-x-4 gap-y-6 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span>Lingua</span>
              <ControlledSelectField
                control={form.control}
                name="language"
                placeholder="Seleziona lingua"
                options={[
                  { value: "it-IT", label: "Italiano (it-IT)" },
                  { value: "en-US", label: "English (en-US)" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span>Timezone</span>
              <ControlledSelectField
                control={form.control}
                name="timezone"
                placeholder="Seleziona timezone"
                options={timezoneOptions.map((timezone) => ({ value: timezone, label: timezone }))}
              />
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span>Formato data</span>
              <ControlledSelectField
                control={form.control}
                name="date_format"
                placeholder="Seleziona formato data"
                options={[
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span>Densita tabelle</span>
              <ControlledSelectField
                control={form.control}
                name="table_density"
                placeholder="Seleziona densita"
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-700">
              <span>Righe per pagina</span>
              <Input type="number" min={10} max={200} {...form.register("default_page_size")} />
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending || isLoading}>
            Salva preferenze
          </Button>
        </form>

        {isLoading && <p className="text-sm text-slate-500" aria-live="polite">Caricamento preferenze…</p>}
        {error && <p className="text-sm text-rose-600">{String(error.message)}</p>}
        {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
        {mutation.isSuccess && <p className="text-sm text-emerald-700">Preferenze aggiornate.</p>}
      </section>
    </div>
  );
}
