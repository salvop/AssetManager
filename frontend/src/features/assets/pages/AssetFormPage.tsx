import { useEffect } from "react";
import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { createAsset, updateAsset } from "@/features/assets/api/assets";
import { Button } from "@/components/ui/button";
import { ControlledSelectField } from "@/components/ui/select-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useAsset } from "@/features/assets/hooks/useAssets";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";

const assetFormSchema = z.object({
  asset_tag: z.string().min(1, "Il tag asset e obbligatorio").optional(),
  name: z.string().min(1, "Il nome e obbligatorio"),
  category_id: z.coerce.number().min(1, "La categoria e obbligatoria"),
  status_id: z.coerce.number().min(1, "Lo stato e obbligatorio"),
  serial_number: z.string().optional(),
  asset_type: z.string().optional(),
  brand: z.string().optional(),
  model_id: z.coerce.number().nullable().optional(),
  location_id: z.coerce.number().nullable().optional(),
  vendor_id: z.coerce.number().nullable().optional(),
  current_department_id: z.coerce.number().nullable().optional(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_expiry_date: z.string().optional(),
  expected_end_of_life_date: z.string().optional(),
  disposal_date: z.string().optional(),
  cost_center: z.string().optional(),
  location_floor: z.string().optional(),
  location_room: z.string().optional(),
  location_rack: z.string().optional(),
  location_slot: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

export function AssetFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const assetId = Number(params.assetId);
  const isEditMode = Number.isFinite(assetId);
  const { data: asset, isLoading: isAssetLoading } = useAsset(assetId);
  const { categories, statuses, models, locations, vendors, departments, isLoading, error } = useLookupsBundle({
    departments: true,
    locations: true,
    vendors: true,
    categories: true,
    models: true,
    statuses: true,
    employees: false,
    users: false,
  });

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_tag: "",
      name: "",
      category_id: 0,
      status_id: 0,
      serial_number: "",
      asset_type: "",
      brand: "",
      model_id: null,
      location_id: null,
      vendor_id: null,
      current_department_id: null,
      description: "",
      purchase_date: "",
      warranty_expiry_date: "",
      expected_end_of_life_date: "",
      disposal_date: "",
      cost_center: "",
      location_floor: "",
      location_room: "",
      location_rack: "",
      location_slot: "",
    },
  });

  useEffect(() => {
    if (!asset) return;
    form.reset({
      asset_tag: asset.asset_tag,
      name: asset.name,
      category_id: asset.category.id,
      status_id: asset.status.id,
      serial_number: asset.serial_number ?? "",
      asset_type: asset.asset_type ?? "",
      brand: asset.brand ?? "",
      model_id: asset.model?.id ?? null,
      location_id: asset.location?.id ?? null,
      vendor_id: asset.vendor?.id ?? null,
      current_department_id: asset.current_department?.id ?? null,
      description: asset.description ?? "",
      purchase_date: asset.purchase_date ?? "",
      warranty_expiry_date: asset.warranty_expiry_date ?? "",
      expected_end_of_life_date: asset.expected_end_of_life_date ?? "",
      disposal_date: asset.disposal_date ?? "",
      cost_center: asset.cost_center ?? "",
      location_floor: asset.location_floor ?? "",
      location_room: asset.location_room ?? "",
      location_rack: asset.location_rack ?? "",
      location_slot: asset.location_slot ?? "",
    });
  }, [asset, form]);

  const mutation = useMutation({
    mutationFn: async (values: AssetFormValues) => {
      const payload = {
        ...(values.asset_tag ? { asset_tag: values.asset_tag } : {}),
        name: values.name,
        category_id: values.category_id,
        status_id: values.status_id,
        model_id: values.model_id || null,
        location_id: values.location_id || null,
        vendor_id: values.vendor_id || null,
        current_department_id: values.current_department_id || null,
        serial_number: values.serial_number || null,
        asset_type: values.asset_type || null,
        brand: values.brand || null,
        description: values.description || null,
        purchase_date: values.purchase_date || null,
        warranty_expiry_date: values.warranty_expiry_date || null,
        expected_end_of_life_date: values.expected_end_of_life_date || null,
        disposal_date: values.disposal_date || null,
        cost_center: values.cost_center || null,
        location_floor: values.location_floor || null,
        location_room: values.location_room || null,
        location_rack: values.location_rack || null,
        location_slot: values.location_slot || null,
      };
      if (isEditMode) {
        const { asset_tag, ...updatePayload } = payload;
        return updateAsset(assetId, updatePayload);
      }
      return createAsset(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      await queryClient.invalidateQueries({ queryKey: ["asset", response.id] });
      navigate(`/assets/${response.id}`);
    },
  });

  if (isEditMode && isAssetLoading) {
    return <p className="text-sm text-slate-500">Caricamento asset…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow={isEditMode ? "Aggiornamento asset" : "Nuovo inserimento"}
        title={isEditMode ? "Modifica asset" : "Crea asset"}
        description="Compila i campi anagrafici e lifecycle necessari per la gestione operativa."
        actions={(
          <Link to="/assets" className="text-sm font-medium text-brand-700">
            Torna alla lista
          </Link>
        )}
      />

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {!isEditMode && (
              <Field label="Tag asset" error={form.formState.errors.asset_tag?.message}>
                <Input {...form.register("asset_tag")} />
              </Field>
            )}
            <Field label="Nome asset" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Categoria" error={form.formState.errors.category_id?.message}>
              <ControlledSelectField
                control={form.control}
                name="category_id"
                placeholder="Seleziona categoria"
                options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Stato" error={form.formState.errors.status_id?.message}>
              <ControlledSelectField
                control={form.control}
                name="status_id"
                placeholder="Seleziona stato"
                options={statuses.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Numero seriale">
              <Input {...form.register("serial_number")} />
            </Field>
            <Field label="Tipo asset">
              <Input {...form.register("asset_type")} placeholder="Es. Notebook, Server, Monitor" />
            </Field>
            <Field label="Marca">
              <Input {...form.register("brand")} placeholder="Es. Lenovo, Dell, Apple" />
            </Field>
            <Field label="Modello">
              <ControlledSelectField
                control={form.control}
                name="model_id"
                placeholder="Nessun modello"
                options={models.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Sede">
              <ControlledSelectField
                control={form.control}
                name="location_id"
                placeholder="Nessuna sede"
                options={locations.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Fornitore">
              <ControlledSelectField
                control={form.control}
                name="vendor_id"
                placeholder="Nessun fornitore"
                options={vendors.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Dipartimento">
              <ControlledSelectField
                control={form.control}
                name="current_department_id"
                placeholder="Nessun dipartimento"
                options={departments.map((item) => ({ value: String(item.id), label: item.name }))}
              />
            </Field>
            <Field label="Data acquisto">
              <Input type="date" {...form.register("purchase_date")} />
            </Field>
            <Field label="Scadenza garanzia">
              <Input type="date" {...form.register("warranty_expiry_date")} />
            </Field>
            <Field label="Fine vita prevista">
              <Input type="date" {...form.register("expected_end_of_life_date")} />
            </Field>
            <Field label="Data dismissione">
              <Input type="date" {...form.register("disposal_date")} />
            </Field>
            <Field label="Cost center">
              <Input {...form.register("cost_center")} />
            </Field>
            <Field label="Piano">
              <Input {...form.register("location_floor")} />
            </Field>
            <Field label="Stanza">
              <Input {...form.register("location_room")} />
            </Field>
            <Field label="Rack">
              <Input {...form.register("location_rack")} />
            </Field>
            <Field label="Slot">
              <Input {...form.register("location_slot")} />
            </Field>
          </div>
          <Field label="Descrizione" className="mt-4">
            <Textarea {...form.register("description")} className="min-h-28" />
          </Field>
        </Panel>

        <div className="flex items-center justify-between">
          <div>
            {isLoading && <p className="text-sm text-slate-500">Caricamento tabelle di supporto…</p>}
            {error && <p className="text-sm text-rose-600" aria-live="polite">{error.message}</p>}
            {mutation.error && <p className="text-sm text-rose-600" aria-live="polite">{mutation.error.message}</p>}
          </div>
          <Button type="submit" className="bg-brand-600 hover:bg-brand-700">
            {mutation.isPending ? "Salvataggio…" : isEditMode ? "Salva modifiche" : "Crea asset"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
