import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { useAssets } from "@/features/assets/hooks/useAssets";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import {
  assignSoftwareLicense,
  revokeSoftwareLicenseAssignment,
  updateSoftwareLicense,
} from "@/features/licenses/api/softwareLicenses";
import { useSoftwareLicense } from "@/features/licenses/hooks/useSoftwareLicenses";
import { softwareLicenseFormSchema, type SoftwareLicenseFormValues } from "@/features/licenses/schemas/software-license-form.schema";
import {
  softwareLicenseAssignmentFormSchema,
  type SoftwareLicenseAssignmentFormValues,
} from "@/features/licenses/schemas/software-license-assignment-form.schema";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const defaultLicenseValues: SoftwareLicenseFormValues = {
  product_name: "",
  license_type: "",
  vendor_id: "",
  purchased_quantity: "1",
  purchase_date: "",
  expiry_date: "",
  renewal_alert_days: "30",
  notes: "",
};

const defaultAssignmentValues: SoftwareLicenseAssignmentFormValues = {
  assignment_mode: "user",
  user_id: "",
  asset_id: "",
  notes: "",
};

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

  const updateForm = useForm<SoftwareLicenseFormValues>({
    resolver: zodResolver(softwareLicenseFormSchema),
    defaultValues: defaultLicenseValues,
  });
  const assignmentForm = useForm<SoftwareLicenseAssignmentFormValues>({
    resolver: zodResolver(softwareLicenseAssignmentFormSchema),
    defaultValues: defaultAssignmentValues,
  });

  useEffect(() => {
    if (!license) {
      return;
    }

    updateForm.reset({
      product_name: license.product_name,
      license_type: license.license_type,
      vendor_id: license.vendor?.id ? String(license.vendor.id) : "",
      purchased_quantity: String(license.purchased_quantity),
      purchase_date: license.purchase_date ?? "",
      expiry_date: license.expiry_date ?? "",
      renewal_alert_days: String(license.renewal_alert_days),
      notes: license.notes ?? "",
    });
  }, [license, updateForm]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["software-license", licenseId] });
    await queryClient.invalidateQueries({ queryKey: ["software-licenses"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };

  const updateMutation = useMutation({
    mutationFn: (values: SoftwareLicenseFormValues) =>
      updateSoftwareLicense(licenseId, {
        product_name: values.product_name,
        license_type: values.license_type,
        vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
        purchased_quantity: Number(values.purchased_quantity),
        purchase_date: values.purchase_date || null,
        expiry_date: values.expiry_date || null,
        renewal_alert_days: Number(values.renewal_alert_days),
        notes: values.notes || null,
      }),
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: (values: SoftwareLicenseAssignmentFormValues) =>
      assignSoftwareLicense(licenseId, {
        user_id: values.assignment_mode === "user" && values.user_id ? Number(values.user_id) : null,
        asset_id: values.assignment_mode === "asset" && values.asset_id ? Number(values.asset_id) : null,
        notes: values.notes || null,
      }),
    onSuccess: async () => {
      assignmentForm.reset(defaultAssignmentValues);
      await invalidate();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (assignmentId: number) =>
      revokeSoftwareLicenseAssignment(assignmentId, {
        notes: "Revoca registrata da interfaccia",
      }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !license) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Licenza non disponibile</AlertTitle>
        <AlertDescription>{error?.message ?? "Licenza non trovata"}</AlertDescription>
      </Alert>
    );
  }

  const assignmentMode = assignmentForm.watch("assignment_mode");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="SAM"
        title={license.product_name}
        description={`${license.license_type} · ${license.available_quantity} disponibili su ${license.purchased_quantity}`}
        actions={(
          <Button asChild variant="outline">
            <Link to="/software-licenses">Torna alle licenze</Link>
          </Button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Anagrafica licenza" eyebrow="Catalogo">
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit((values) => updateMutation.mutate(values))} className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={updateForm.control}
                  name="product_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prodotto</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="license_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo licenza</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormSelectField
                  control={updateForm.control}
                  name="vendor_id"
                  label="Vendor"
                  placeholder="Nessun vendor"
                  options={vendors.map((vendor) => ({ value: String(vendor.id), label: vendor.name }))}
                />
                <FormField
                  control={updateForm.control}
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
                  control={updateForm.control}
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
                  control={updateForm.control}
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
                  control={updateForm.control}
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
                  control={updateForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {updateMutation.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Salvataggio non completato</AlertTitle>
                  <AlertDescription>{updateMutation.error.message}</AlertDescription>
                </Alert>
              ) : null}

              {updateMutation.isSuccess ? (
                <Alert>
                  <CheckCircle2 />
                  <AlertTitle>Licenza aggiornata</AlertTitle>
                  <AlertDescription>I dati principali della licenza sono stati salvati.</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit">
                  {updateMutation.isPending ? "Salvataggio..." : "Salva modifiche"}
                </Button>
              </div>
            </form>
          </Form>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Riepilogo" eyebrow="Contesto">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p><span className="font-medium text-foreground">Vendor:</span> {license.vendor?.name ?? "-"}</p>
              <p><span className="font-medium text-foreground">Acquisto:</span> {license.purchase_date ?? "-"}</p>
              <p><span className="font-medium text-foreground">Scadenza:</span> {license.expiry_date ?? "-"}</p>
              <p><span className="font-medium text-foreground">Alert rinnovo:</span> {license.renewal_alert_days} giorni</p>
              <p><span className="font-medium text-foreground">Assegnazioni attive:</span> {license.active_assignments}</p>
            </div>
          </Panel>

          <Panel title="Assegna licenza" eyebrow="Provisioning">
            <Form {...assignmentForm}>
              <form
                onSubmit={assignmentForm.handleSubmit((values) => assignMutation.mutate(values))}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={assignmentForm.control}
                  name="assignment_mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinazione</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          className="justify-start"
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) {
                              field.onChange(value);
                            }
                          }}
                        >
                          <ToggleGroupItem value="user">A utente</ToggleGroupItem>
                          <ToggleGroupItem value="asset">A asset</ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {assignmentMode === "user" ? (
                  <FormSelectField
                    control={assignmentForm.control}
                    name="user_id"
                    label="Utente"
                    placeholder="Seleziona utente"
                    options={users.map((user) => ({ value: String(user.id), label: user.full_name }))}
                  />
                ) : (
                  <FormSelectField
                    control={assignmentForm.control}
                    name="asset_id"
                    label="Asset"
                    placeholder="Seleziona asset"
                    options={(assetsData?.items ?? []).map((asset) => ({
                      value: String(asset.id),
                      label: `${asset.asset_tag} - ${asset.name}`,
                    }))}
                  />
                )}

                <FormField
                  control={assignmentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note assegnazione</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-28" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {assignMutation.error ? (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertTitle>Assegnazione non completata</AlertTitle>
                    <AlertDescription>{assignMutation.error.message}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={assignMutation.isPending}>
                    {assignMutation.isPending ? "Assegnazione..." : "Conferma assegnazione"}
                  </Button>
                </div>
              </form>
            </Form>
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Assegnazioni" eyebrow="Storico">
          <div className="flex flex-col gap-3">
            {license.assignments.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <KeyRound />
                  </EmptyMedia>
                  <EmptyTitle>Nessuna assegnazione registrata</EmptyTitle>
                  <EmptyDescription>Usa il pannello laterale per assegnare la licenza a un utente o a un asset.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {license.assignments.map((assignment) => {
              const targetLabel = assignment.user?.full_name ?? assignment.asset?.name ?? assignment.asset?.code ?? "Target";
              return (
                <div key={assignment.id} className="rounded-md border border-border bg-muted px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-foreground">{targetLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Assegnata il {new Date(assignment.assigned_at).toLocaleString()} da {assignment.assigned_by_user.full_name}
                      </p>
                      {assignment.notes ? <p className="text-sm text-muted-foreground">{assignment.notes}</p> : null}
                    </div>
                    {assignment.revoked_at ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                        Revocata
                      </span>
                    ) : (
                      <Button
                        onClick={() => revokeMutation.mutate(assignment.id)}
                        disabled={revokeMutation.isPending}
                        variant="secondary"
                        size="sm"
                      >
                        Revoca
                      </Button>
                    )}
                  </div>
                  {assignment.revoked_at ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Revocata il {new Date(assignment.revoked_at).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Timeline licenza" eyebrow="Audit">
          <div className="flex flex-col gap-3">
            {license.events.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <KeyRound />
                  </EmptyMedia>
                  <EmptyTitle>Nessun evento registrato</EmptyTitle>
                  <EmptyDescription>Gli eventi di audit appariranno qui dopo creazioni, assegnazioni e revoche.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {license.events.map((event) => (
              <div key={event.id} className="rounded-md border border-border bg-muted px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                      {event.performed_by_user ? ` · ${event.performed_by_user.full_name}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                    {event.event_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {license.active_assignments >= license.purchased_quantity ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Disponibilita esaurita</AlertTitle>
          <AlertDescription>
            Tutte le postazioni risultano occupate. Revoca un’assegnazione per liberare disponibilita.
          </AlertDescription>
        </Alert>
      ) : null}

      {revokeMutation.error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Revoca non completata</AlertTitle>
          <AlertDescription>{revokeMutation.error.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

