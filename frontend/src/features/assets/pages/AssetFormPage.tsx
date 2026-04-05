import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAsset, updateAsset } from "@/features/assets/api/assets";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
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
    return (
      <div className="mx-auto grid max-w-5xl gap-6">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <PageHeader
        eyebrow={isEditMode ? "Aggiornamento asset" : "Nuovo inserimento"}
        title={isEditMode ? "Modifica asset" : "Crea asset"}
        description="Compila i campi anagrafici e lifecycle necessari per la gestione operativa."
        actions={(
          <Button asChild variant="ghost">
            <Link to="/assets">Torna alla lista</Link>
          </Button>
        )}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="grid gap-6">
          <Panel>
            <div className="grid gap-4 md:grid-cols-2">
              {!isEditMode && (
                <AssetTextField control={form.control} name="asset_tag" label="Tag asset" />
              )}
              <AssetTextField control={form.control} name="name" label="Nome asset" />
              <FormSelectField
                control={form.control}
                name="category_id"
                label="Categoria"
                placeholder="Seleziona categoria"
                options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <FormSelectField
                control={form.control}
                name="status_id"
                label="Stato"
                placeholder="Seleziona stato"
                options={statuses.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <AssetTextField control={form.control} name="serial_number" label="Numero seriale" />
              <AssetTextField
                control={form.control}
                name="asset_type"
                label="Tipo asset"
                placeholder="Es. Notebook, Server, Monitor"
              />
              <AssetTextField
                control={form.control}
                name="brand"
                label="Marca"
                placeholder="Es. Lenovo, Dell, Apple"
              />
              <FormSelectField
                control={form.control}
                name="model_id"
                label="Modello"
                placeholder="Nessun modello"
                options={models.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <FormSelectField
                control={form.control}
                name="location_id"
                label="Sede"
                placeholder="Nessuna sede"
                options={locations.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <FormSelectField
                control={form.control}
                name="vendor_id"
                label="Fornitore"
                placeholder="Nessun fornitore"
                options={vendors.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <FormSelectField
                control={form.control}
                name="current_department_id"
                label="Dipartimento"
                placeholder="Nessun dipartimento"
                options={departments.map((item) => ({ value: String(item.id), label: item.name }))}
              />
              <AssetTextField control={form.control} name="purchase_date" label="Data acquisto" type="date" />
              <AssetTextField control={form.control} name="warranty_expiry_date" label="Scadenza garanzia" type="date" />
              <AssetTextField control={form.control} name="expected_end_of_life_date" label="Fine vita prevista" type="date" />
              <AssetTextField control={form.control} name="disposal_date" label="Data dismissione" type="date" />
              <AssetTextField control={form.control} name="cost_center" label="Cost center" />
              <AssetTextField control={form.control} name="location_floor" label="Piano" />
              <AssetTextField control={form.control} name="location_room" label="Stanza" />
              <AssetTextField control={form.control} name="location_rack" label="Rack" />
              <AssetTextField control={form.control} name="location_slot" label="Slot" />
            </div>
            <AssetTextareaField
              control={form.control}
              name="description"
              label="Descrizione"
              className="mt-4"
              textareaClassName="min-h-28"
            />
          </Panel>

          <div className="flex items-center justify-between">
            <div className="grid gap-3">
              {isLoading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : null}
              {error ? (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              ) : null}
              {mutation.error ? (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{mutation.error.message}</AlertDescription>
                </Alert>
              ) : null}
            </div>
            <Button type="submit">
              {mutation.isPending ? "Salvataggio…" : isEditMode ? "Salva modifiche" : "Crea asset"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function AssetTextField({
  control,
  name,
  label,
  type = "text",
  placeholder,
}: {
  control: Control<AssetFormValues>;
  name: FieldPath<AssetFormValues>;
  label: string;
  type?: React.ComponentProps<typeof Input>["type"];
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AssetTextareaField({
  control,
  name,
  label,
  className,
  textareaClassName,
}: {
  control: Control<AssetFormValues>;
  name: FieldPath<AssetFormValues>;
  label: string;
  className?: string;
  textareaClassName?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              className={textareaClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

