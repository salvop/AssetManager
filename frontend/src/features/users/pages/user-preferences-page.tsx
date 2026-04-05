import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { getMyPreferences, updateMyPreferences } from "@/features/users/api/preferences";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";

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

    form.reset(normalizedValues);
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Profilo utente"
        title="Preferenze"
        description="Imposta formato date, lingua e opzioni di visualizzazione personali."
      />

      <Panel title="Preferenze personali" eyebrow="Profilo" className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormSelectField
                control={form.control}
                name="language"
                label="Lingua"
                placeholder="Seleziona lingua"
                options={[
                  { value: "it-IT", label: "Italiano (it-IT)" },
                  { value: "en-US", label: "English (en-US)" },
                ]}
              />

              <FormSelectField
                control={form.control}
                name="timezone"
                label="Timezone"
                placeholder="Seleziona timezone"
                options={timezoneOptions.map((timezone) => ({ value: timezone, label: timezone }))}
              />

              <FormSelectField
                control={form.control}
                name="date_format"
                label="Formato data"
                placeholder="Seleziona formato data"
                options={[
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                ]}
              />

              <FormSelectField
                control={form.control}
                name="table_density"
                label="Densita tabelle"
                placeholder="Seleziona densita"
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ]}
              />

              <FormField
                control={form.control}
                name="default_page_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Righe per pagina</FormLabel>
                    <FormControl>
                      <Input type="number" min={10} max={200} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Preferenze non disponibili</AlertTitle>
                <AlertDescription>{String(error.message)}</AlertDescription>
              </Alert>
            ) : null}

            {mutation.error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Salvataggio non completato</AlertTitle>
                <AlertDescription>{mutation.error.message}</AlertDescription>
              </Alert>
            ) : null}

            {mutation.isSuccess ? (
              <Alert>
                <CheckCircle2 />
                <AlertTitle>Preferenze aggiornate</AlertTitle>
                <AlertDescription>Le impostazioni personali sono state salvate.</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending || isLoading}>
                Salva preferenze
              </Button>
            </div>
          </form>
        </Form>
      </Panel>
    </div>
  );
}

