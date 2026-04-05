import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { getAppSettings, updateAppSettings } from "@/features/users/api/preferences";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { appSettingsFormSchema, type AppSettingsFormValues } from "@/features/settings/schemas/app-settings-form.schema";
import { Textarea } from "@/components/ui/textarea";

const defaultValues: AppSettingsFormValues = {
  org_name: "",
  default_asset_status_on_create_id: "",
  max_document_size_mb: "10",
  allowed_document_mime_types: "",
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
  const form = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsFormSchema),
    defaultValues,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["app-settings"],
    queryFn: getAppSettings,
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    form.reset({
      org_name: data.org_name,
      default_asset_status_on_create_id: String(data.default_asset_status_on_create_id),
      max_document_size_mb: String(data.max_document_size_mb),
      allowed_document_mime_types: data.allowed_document_mime_types.join(", "),
    });
  }, [data, form]);

  const writableStatuses = useMemo(
    () => statuses.filter((status) => !["RETIRED", "DISPOSED"].includes(status.code ?? "")),
    [statuses],
  );

  const mutation = useMutation({
    mutationFn: (values: AppSettingsFormValues) =>
      updateAppSettings({
        org_name: values.org_name,
        default_asset_status_on_create_id: Number(values.default_asset_status_on_create_id),
        max_document_size_mb: Number(values.max_document_size_mb),
        allowed_document_mime_types: values.allowed_document_mime_types
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
      <Alert>
        <AlertCircle />
        <AlertTitle>Impostazioni applicazione</AlertTitle>
        <AlertDescription>
          Questa sezione e disponibile solo per gli amministratori di sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Amministrazione"
        title="Impostazioni applicazione"
        description="Configura valori globali dell'istanza per creazione asset e documenti."
      />

      <Panel title="Configurazione istanza" eyebrow="Valori globali" className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="org_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome organizzazione</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="OpsAsset" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormSelectField
                control={form.control}
                name="default_asset_status_on_create_id"
                label="Stato default alla creazione asset"
                placeholder="Seleziona stato"
                options={writableStatuses.map((status) => ({
                  value: String(status.id),
                  label: status.name,
                }))}
              />

              <FormField
                control={form.control}
                name="max_document_size_mb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensione max documenti (MB)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={1} max={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowed_document_mime_types"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MIME types consentiti</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-24 resize-y"
                      placeholder="application/pdf, image/png, image/jpeg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-11 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Impostazioni non disponibili</AlertTitle>
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
                <AlertTitle>Impostazioni aggiornate</AlertTitle>
                <AlertDescription>I valori globali dell'istanza sono stati salvati.</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending || isLoading}>
                Salva impostazioni
              </Button>
            </div>
          </form>
        </Form>
      </Panel>
    </div>
  );
}

