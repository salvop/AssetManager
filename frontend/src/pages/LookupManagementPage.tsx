import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createAssetCategory,
  createAssetModel,
  createDepartment,
  createLocation,
  createVendor,
  deleteAssetCategory,
  deleteAssetModel,
  deleteDepartment,
  deleteLocation,
  deleteVendor,
  updateAssetCategory,
  updateAssetModel,
  updateDepartment,
  updateLocation,
  updateVendor,
} from "../api/lookups";
import { useLookupsBundle } from "../hooks/useLookups";
import type { LookupReference } from "../types/api";

const inputClassName = "w-full rounded-md border border-slate-300 px-3 py-2";

export function LookupManagementPage() {
  const queryClient = useQueryClient();
  const { departments, locations, vendors, categories, models, isLoading, error } = useLookupsBundle({
    departments: true,
    locations: true,
    vendors: true,
    categories: true,
    models: true,
    statuses: false,
    employees: false,
    users: false,
  });

  const [department, setDepartment] = useState({ code: "", name: "" });
  const [departmentEditingId, setDepartmentEditingId] = useState<number | null>(null);
  const [location, setLocation] = useState({ code: "", name: "", parent_id: "" });
  const [locationEditingId, setLocationEditingId] = useState<number | null>(null);
  const [category, setCategory] = useState({ code: "", name: "", parent_id: "" });
  const [categoryEditingId, setCategoryEditingId] = useState<number | null>(null);
  const [vendor, setVendor] = useState({ name: "", contact_email: "", contact_phone: "" });
  const [vendorEditingId, setVendorEditingId] = useState<number | null>(null);
  const [model, setModel] = useState({ category_id: "", vendor_id: "", name: "", manufacturer: "" });
  const [modelEditingId, setModelEditingId] = useState<number | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["departments"] });
    await queryClient.invalidateQueries({ queryKey: ["locations"] });
    await queryClient.invalidateQueries({ queryKey: ["vendors"] });
    await queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["asset-models"] });
  };

  const departmentMutation = useMutation({
    mutationFn: () =>
      departmentEditingId
        ? updateDepartment(departmentEditingId, department)
        : createDepartment(department),
    onSuccess: async () => {
      setDepartment({ code: "", name: "" });
      setDepartmentEditingId(null);
      await invalidate();
    },
  });
  const locationMutation = useMutation({
    mutationFn: () =>
      locationEditingId
        ? updateLocation(locationEditingId, {
            ...location,
            parent_id: location.parent_id ? Number(location.parent_id) : null,
          })
        : createLocation({
            ...location,
            parent_id: location.parent_id ? Number(location.parent_id) : null,
          }),
    onSuccess: async () => {
      setLocation({ code: "", name: "", parent_id: "" });
      setLocationEditingId(null);
      await invalidate();
    },
  });
  const categoryMutation = useMutation({
    mutationFn: () =>
      categoryEditingId
        ? updateAssetCategory(categoryEditingId, {
            ...category,
            parent_id: category.parent_id ? Number(category.parent_id) : null,
          })
        : createAssetCategory({
            ...category,
            parent_id: category.parent_id ? Number(category.parent_id) : null,
          }),
    onSuccess: async () => {
      setCategory({ code: "", name: "", parent_id: "" });
      setCategoryEditingId(null);
      await invalidate();
    },
  });
  const vendorMutation = useMutation({
    mutationFn: () =>
      vendorEditingId
        ? updateVendor(vendorEditingId, {
            name: vendor.name,
            contact_email: vendor.contact_email || null,
            contact_phone: vendor.contact_phone || null,
          })
        : createVendor({
            name: vendor.name,
            contact_email: vendor.contact_email || null,
            contact_phone: vendor.contact_phone || null,
          }),
    onSuccess: async () => {
      setVendor({ name: "", contact_email: "", contact_phone: "" });
      setVendorEditingId(null);
      await invalidate();
    },
  });
  const modelMutation = useMutation({
    mutationFn: () =>
      modelEditingId
        ? updateAssetModel(modelEditingId, {
            category_id: Number(model.category_id),
            vendor_id: model.vendor_id ? Number(model.vendor_id) : null,
            name: model.name,
            manufacturer: model.manufacturer || null,
          })
        : createAssetModel({
            category_id: Number(model.category_id),
            vendor_id: model.vendor_id ? Number(model.vendor_id) : null,
            name: model.name,
            manufacturer: model.manufacturer || null,
          }),
    onSuccess: async () => {
      setModel({ category_id: "", vendor_id: "", name: "", manufacturer: "" });
      setModelEditingId(null);
      await invalidate();
    },
  });

  const departmentDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: invalidate,
  });
  const locationDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: invalidate,
  });
  const categoryDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteAssetCategory(id),
    onSuccess: invalidate,
  });
  const vendorDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: invalidate,
  });
  const modelDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteAssetModel(id),
    onSuccess: invalidate,
  });

  const resetDepartmentForm = () => {
    setDepartment({ code: "", name: "" });
    setDepartmentEditingId(null);
  };
  const resetLocationForm = () => {
    setLocation({ code: "", name: "", parent_id: "" });
    setLocationEditingId(null);
  };
  const resetCategoryForm = () => {
    setCategory({ code: "", name: "", parent_id: "" });
    setCategoryEditingId(null);
  };
  const resetVendorForm = () => {
    setVendor({ name: "", contact_email: "", contact_phone: "" });
    setVendorEditingId(null);
  };
  const resetModelForm = () => {
    setModel({ category_id: "", vendor_id: "", name: "", manufacturer: "" });
    setModelEditingId(null);
  };

  const handleDelete = (label: string, action: () => void) => {
    if (window.confirm(`Confermi l'eliminazione di "${label}"?`)) {
      action();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Amministrazione</p>
        <h2 className="mt-2 text-3xl font-semibold">Gestione tabelle</h2>
        <p className="mt-2 text-sm text-slate-500">
          Mantieni i dati di riferimento usati da asset, assegnazioni e manutenzione.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LookupPanel title="Dipartimenti" items={departments}>
          <div className="grid gap-3 md:grid-cols-2">
            <input aria-label="Codice dipartimento" value={department.code} onChange={(e) => setDepartment((v) => ({ ...v, code: e.target.value }))} placeholder="Codice" className={inputClassName} />
            <input aria-label="Nome dipartimento" value={department.name} onChange={(e) => setDepartment((v) => ({ ...v, name: e.target.value }))} placeholder="Nome" className={inputClassName} />
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={!department.code || !department.name || departmentMutation.isPending} onClick={() => departmentMutation.mutate()}>
              {departmentEditingId ? "Salva dipartimento" : "Aggiungi dipartimento"}
            </ActionButton>
            {departmentEditingId && <SecondaryButton onClick={resetDepartmentForm}>Annulla modifica</SecondaryButton>}
          </div>
          <LookupList
            items={departments}
            onEdit={(item) => {
              setDepartmentEditingId(item.id);
              setDepartment({ code: item.code ?? "", name: item.name });
            }}
            onDelete={(item) => handleDelete(item.name, () => departmentDeleteMutation.mutate(item.id))}
          />
        </LookupPanel>

        <LookupPanel title="Sedi" items={locations}>
          <div className="grid gap-3 md:grid-cols-3">
            <input aria-label="Codice sede" value={location.code} onChange={(e) => setLocation((v) => ({ ...v, code: e.target.value }))} placeholder="Codice" className={inputClassName} />
            <input aria-label="Nome sede" value={location.name} onChange={(e) => setLocation((v) => ({ ...v, name: e.target.value }))} placeholder="Nome" className={inputClassName} />
            <select aria-label="Sede padre" value={location.parent_id} onChange={(e) => setLocation((v) => ({ ...v, parent_id: e.target.value }))} className={inputClassName}>
              <option value="">Sede padre</option>
              {locations.filter((item) => item.id !== locationEditingId).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={!location.code || !location.name || locationMutation.isPending} onClick={() => locationMutation.mutate()}>
              {locationEditingId ? "Salva sede" : "Aggiungi sede"}
            </ActionButton>
            {locationEditingId && <SecondaryButton onClick={resetLocationForm}>Annulla modifica</SecondaryButton>}
          </div>
          <LookupList
            items={locations}
            onEdit={(item) => {
              setLocationEditingId(item.id);
              setLocation({ code: item.code ?? "", name: item.name, parent_id: item.parent_id ? String(item.parent_id) : "" });
            }}
            onDelete={(item) => handleDelete(item.name, () => locationDeleteMutation.mutate(item.id))}
            describeItem={(item) => {
              const parentName = locations.find((parentItem) => parentItem.id === item.parent_id)?.name;
              return parentName ? `Padre: ${parentName}` : "";
            }}
          />
        </LookupPanel>

        <LookupPanel title="Categorie asset" items={categories}>
          <div className="grid gap-3 md:grid-cols-3">
            <input aria-label="Codice categoria" value={category.code} onChange={(e) => setCategory((v) => ({ ...v, code: e.target.value }))} placeholder="Codice" className={inputClassName} />
            <input aria-label="Nome categoria" value={category.name} onChange={(e) => setCategory((v) => ({ ...v, name: e.target.value }))} placeholder="Nome" className={inputClassName} />
            <select aria-label="Categoria padre" value={category.parent_id} onChange={(e) => setCategory((v) => ({ ...v, parent_id: e.target.value }))} className={inputClassName}>
              <option value="">Categoria padre</option>
              {categories.filter((item) => item.id !== categoryEditingId).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={!category.code || !category.name || categoryMutation.isPending} onClick={() => categoryMutation.mutate()}>
              {categoryEditingId ? "Salva categoria" : "Aggiungi categoria"}
            </ActionButton>
            {categoryEditingId && <SecondaryButton onClick={resetCategoryForm}>Annulla modifica</SecondaryButton>}
          </div>
          <LookupList
            items={categories}
            onEdit={(item) => {
              setCategoryEditingId(item.id);
              setCategory({ code: item.code ?? "", name: item.name, parent_id: item.parent_id ? String(item.parent_id) : "" });
            }}
            onDelete={(item) => handleDelete(item.name, () => categoryDeleteMutation.mutate(item.id))}
            describeItem={(item) => {
              const parentName = categories.find((parentItem) => parentItem.id === item.parent_id)?.name;
              return parentName ? `Padre: ${parentName}` : "";
            }}
          />
        </LookupPanel>

        <LookupPanel title="Fornitori" items={vendors}>
          <div className="grid gap-3">
            <input aria-label="Nome fornitore" value={vendor.name} onChange={(e) => setVendor((v) => ({ ...v, name: e.target.value }))} placeholder="Nome fornitore" className={inputClassName} />
            <div className="grid gap-3 md:grid-cols-2">
              <input aria-label="Email contatto fornitore" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={vendor.contact_email} onChange={(e) => setVendor((v) => ({ ...v, contact_email: e.target.value }))} placeholder="Email contatto" className={inputClassName} />
              <input aria-label="Telefono contatto fornitore" type="tel" inputMode="tel" autoComplete="tel" value={vendor.contact_phone} onChange={(e) => setVendor((v) => ({ ...v, contact_phone: e.target.value }))} placeholder="Telefono contatto" className={inputClassName} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={!vendor.name || vendorMutation.isPending} onClick={() => vendorMutation.mutate()}>
              {vendorEditingId ? "Salva fornitore" : "Aggiungi fornitore"}
            </ActionButton>
            {vendorEditingId && <SecondaryButton onClick={resetVendorForm}>Annulla modifica</SecondaryButton>}
          </div>
          <LookupList
            items={vendors}
            describeItem={(item) => [item.contact_email, item.contact_phone].filter(Boolean).join(" · ")}
            onEdit={(item) => {
              setVendorEditingId(item.id);
              setVendor({
                name: item.name,
                contact_email: item.contact_email ?? "",
                contact_phone: item.contact_phone ?? "",
              });
            }}
            onDelete={(item) => handleDelete(item.name, () => vendorDeleteMutation.mutate(item.id))}
          />
        </LookupPanel>

        <LookupPanel title="Modelli asset" items={models} className="xl:col-span-2">
          <div className="grid gap-3 xl:grid-cols-4">
            <select aria-label="Categoria modello" value={model.category_id} onChange={(e) => setModel((v) => ({ ...v, category_id: e.target.value }))} className={inputClassName}>
              <option value="">Categoria</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select aria-label="Fornitore modello" value={model.vendor_id} onChange={(e) => setModel((v) => ({ ...v, vendor_id: e.target.value }))} className={inputClassName}>
              <option value="">Fornitore</option>
              {vendors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input aria-label="Nome modello" value={model.name} onChange={(e) => setModel((v) => ({ ...v, name: e.target.value }))} placeholder="Nome modello" className={inputClassName} />
            <input aria-label="Produttore modello" value={model.manufacturer} onChange={(e) => setModel((v) => ({ ...v, manufacturer: e.target.value }))} placeholder="Produttore" className={inputClassName} />
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton disabled={!model.category_id || !model.name || modelMutation.isPending} onClick={() => modelMutation.mutate()}>
              {modelEditingId ? "Salva modello" : "Aggiungi modello"}
            </ActionButton>
            {modelEditingId && <SecondaryButton onClick={resetModelForm}>Annulla modifica</SecondaryButton>}
          </div>
          <LookupList
            items={models}
            describeItem={(item) =>
              [
                categories.find((categoryItem) => categoryItem.id === item.category_id)?.name,
                vendors.find((vendorItem) => vendorItem.id === item.vendor_id)?.name,
                item.manufacturer,
              ]
                .filter(Boolean)
                .join(" · ")
            }
            onEdit={(item) => {
              setModelEditingId(item.id);
              setModel({
                category_id: item.category_id ? String(item.category_id) : "",
                vendor_id: item.vendor_id ? String(item.vendor_id) : "",
                name: item.name,
                manufacturer: item.manufacturer ?? "",
              });
            }}
            onDelete={(item) => handleDelete(item.name, () => modelDeleteMutation.mutate(item.id))}
          />
        </LookupPanel>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Caricamento tabelle di supporto…</p>}
      {error && <p className="text-sm text-rose-600" aria-live="polite">{error.message}</p>}
      {(departmentMutation.error ||
        locationMutation.error ||
        categoryMutation.error ||
        vendorMutation.error ||
        modelMutation.error ||
        departmentDeleteMutation.error ||
        locationDeleteMutation.error ||
        categoryDeleteMutation.error ||
        vendorDeleteMutation.error ||
        modelDeleteMutation.error) && (
        <p className="text-sm text-rose-600" aria-live="polite">
          {String(
            departmentMutation.error?.message ||
              locationMutation.error?.message ||
              categoryMutation.error?.message ||
              vendorMutation.error?.message ||
              modelMutation.error?.message ||
              departmentDeleteMutation.error?.message ||
              locationDeleteMutation.error?.message ||
              categoryDeleteMutation.error?.message ||
              vendorDeleteMutation.error?.message ||
              modelDeleteMutation.error?.message,
          )}
        </p>
      )}
    </div>
  );
}

function LookupPanel({
  title,
  items,
  className,
  children,
}: {
  title: string;
  items: Array<{ id: number; name: string; code?: string | null }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={["rounded-xl border border-slate-200 bg-white p-6 shadow-sm", className ?? ""].join(" ")}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-500">{items.length} elementi</span>
      </div>
      <div className="mt-4 space-y-4">
        {children}
      </div>
    </section>
  );
}

function LookupList({
  items,
  onEdit,
  onDelete,
  describeItem,
}: {
  items: LookupReference[];
  onEdit: (item: LookupReference) => void;
  onDelete: (item: LookupReference) => void;
  describeItem?: (item: LookupReference) => string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.code ? `${item.code} · ${item.name}` : item.name}</p>
              {describeItem && describeItem(item) && <p className="text-xs text-slate-500">{describeItem(item)}</p>}
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={() => onEdit(item)}>Modifica</SecondaryButton>
              <DangerButton onClick={() => onDelete(item)}>Elimina</DangerButton>
            </div>
          </div>
        ))}
        {items.length === 0 && <span className="text-sm text-slate-500">Nessun elemento presente.</span>}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
    >
      {children}
    </button>
  );
}

function DangerButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
    >
      {children}
    </button>
  );
}
