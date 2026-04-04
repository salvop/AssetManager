import { useEffect } from "react";
import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { createAsset, updateAsset } from "../api/assets";
import { useAsset } from "../hooks/useAssets";
import { useLookupsBundle } from "../hooks/useLookups";

const assetFormSchema = z.object({
  asset_tag: z.string().min(1, "Il tag asset e obbligatorio").optional(),
  name: z.string().min(1, "Il nome e obbligatorio"),
  category_id: z.coerce.number().min(1, "La categoria e obbligatoria"),
  status_id: z.coerce.number().min(1, "Lo stato e obbligatorio"),
  serial_number: z.string().optional(),
  model_id: z.coerce.number().nullable().optional(),
  location_id: z.coerce.number().nullable().optional(),
  vendor_id: z.coerce.number().nullable().optional(),
  current_department_id: z.coerce.number().nullable().optional(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

const inputClassName = "w-full rounded-md border border-slate-300 px-3 py-2";

export function AssetFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams();
  const assetId = Number(params.assetId);
  const isEditMode = Number.isFinite(assetId);
  const { data: asset, isLoading: isAssetLoading } = useAsset(assetId);
  const { categories, statuses, models, locations, vendors, departments, isLoading, error } = useLookupsBundle();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      asset_tag: "",
      name: "",
      category_id: 0,
      status_id: 0,
      serial_number: "",
      model_id: null,
      location_id: null,
      vendor_id: null,
      current_department_id: null,
      description: "",
      purchase_date: "",
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
      model_id: asset.model?.id ?? null,
      location_id: asset.location?.id ?? null,
      vendor_id: asset.vendor?.id ?? null,
      current_department_id: asset.current_department?.id ?? null,
      description: asset.description ?? "",
      purchase_date: asset.purchase_date ?? "",
    });
  }, [asset, form]);

  const mutation = useMutation({
    mutationFn: async (values: AssetFormValues) => {
      const payload = {
        ...values,
        model_id: values.model_id || null,
        location_id: values.location_id || null,
        vendor_id: values.vendor_id || null,
        current_department_id: values.current_department_id || null,
        serial_number: values.serial_number || null,
        description: values.description || null,
        purchase_date: values.purchase_date || null,
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
    return <p className="text-sm text-slate-500">Caricamento asset...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
            {isEditMode ? "Aggiornamento asset" : "Nuovo inserimento"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">{isEditMode ? "Modifica asset" : "Crea asset"}</h2>
        </div>
        <Link to="/assets" className="text-sm font-medium text-brand-700">
          Torna alla lista
        </Link>
      </div>

      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            {!isEditMode && (
              <Field label="Tag asset" error={form.formState.errors.asset_tag?.message}>
                <input {...form.register("asset_tag")} className={inputClassName} />
              </Field>
            )}
            <Field label="Nome asset" error={form.formState.errors.name?.message}>
              <input {...form.register("name")} className={inputClassName} />
            </Field>
            <Field label="Categoria" error={form.formState.errors.category_id?.message}>
              <select {...form.register("category_id")} className={inputClassName}>
                <option value={0}>Seleziona categoria</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stato" error={form.formState.errors.status_id?.message}>
              <select {...form.register("status_id")} className={inputClassName}>
                <option value={0}>Seleziona stato</option>
                {statuses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Numero seriale">
              <input {...form.register("serial_number")} className={inputClassName} />
            </Field>
            <Field label="Modello">
              <select {...form.register("model_id")} className={inputClassName}>
                <option value="">Nessun modello</option>
                {models.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sede">
              <select {...form.register("location_id")} className={inputClassName}>
                <option value="">Nessuna sede</option>
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fornitore">
              <select {...form.register("vendor_id")} className={inputClassName}>
                <option value="">Nessun fornitore</option>
                {vendors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dipartimento">
              <select {...form.register("current_department_id")} className={inputClassName}>
                <option value="">Nessun dipartimento</option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Data acquisto">
              <input type="date" {...form.register("purchase_date")} className={inputClassName} />
            </Field>
          </div>
          <Field label="Descrizione" className="mt-4">
            <textarea {...form.register("description")} className={`${inputClassName} min-h-28`} />
          </Field>
        </section>

        <div className="flex items-center justify-between">
          <div>
            {isLoading && <p className="text-sm text-slate-500">Caricamento tabelle di supporto...</p>}
            {error && <p className="text-sm text-rose-600">{error.message}</p>}
            {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
          </div>
          <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {mutation.isPending ? "Salvataggio..." : isEditMode ? "Salva modifiche" : "Crea asset"}
          </button>
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
  error?: string;
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
