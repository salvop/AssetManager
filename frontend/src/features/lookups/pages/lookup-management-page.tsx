import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
} from "@/features/lookups/api/lookups";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import {
  categoryFormSchema,
  departmentFormSchema,
  locationFormSchema,
  modelFormSchema,
  vendorFormSchema,
  type CategoryFormValues,
  type DepartmentFormValues,
  type LocationFormValues,
  type ModelFormValues,
  type VendorFormValues,
} from "@/features/lookups/schemas/lookup-management.schema";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import type { LookupReference } from "@/types/api";

const DEPARTMENT_DEFAULTS: DepartmentFormValues = { code: "", name: "" };
const LOCATION_DEFAULTS: LocationFormValues = { code: "", name: "", parent_id: "" };
const CATEGORY_DEFAULTS: CategoryFormValues = { code: "", name: "", parent_id: "" };
const VENDOR_DEFAULTS: VendorFormValues = { name: "", contact_email: "", contact_phone: "" };
const MODEL_DEFAULTS: ModelFormValues = { category_id: "", vendor_id: "", name: "", manufacturer: "" };
type PendingDeletion =
  | { entity: "department" | "location" | "category" | "vendor" | "model"; id: number; label: string }
  | null;

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

  const [departmentEditingId, setDepartmentEditingId] = useState<number | null>(null);
  const [locationEditingId, setLocationEditingId] = useState<number | null>(null);
  const [categoryEditingId, setCategoryEditingId] = useState<number | null>(null);
  const [vendorEditingId, setVendorEditingId] = useState<number | null>(null);
  const [modelEditingId, setModelEditingId] = useState<number | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion>(null);

  const departmentForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: DEPARTMENT_DEFAULTS,
  });
  const locationForm = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: LOCATION_DEFAULTS,
  });
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: CATEGORY_DEFAULTS,
  });
  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: VENDOR_DEFAULTS,
  });
  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: MODEL_DEFAULTS,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["departments"] });
    await queryClient.invalidateQueries({ queryKey: ["locations"] });
    await queryClient.invalidateQueries({ queryKey: ["vendors"] });
    await queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    await queryClient.invalidateQueries({ queryKey: ["asset-models"] });
  };

  const departmentMutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      departmentEditingId
        ? updateDepartment(departmentEditingId, values)
        : createDepartment(values),
    onSuccess: async () => {
      departmentForm.reset(DEPARTMENT_DEFAULTS);
      setDepartmentEditingId(null);
      await invalidate();
    },
  });

  const locationMutation = useMutation({
    mutationFn: (values: LocationFormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        parent_id: values.parent_id ? Number(values.parent_id) : null,
      };

      return locationEditingId ? updateLocation(locationEditingId, payload) : createLocation(payload);
    },
    onSuccess: async () => {
      locationForm.reset(LOCATION_DEFAULTS);
      setLocationEditingId(null);
      await invalidate();
    },
  });

  const categoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const payload = {
        code: values.code,
        name: values.name,
        parent_id: values.parent_id ? Number(values.parent_id) : null,
      };

      return categoryEditingId
        ? updateAssetCategory(categoryEditingId, payload)
        : createAssetCategory(payload);
    },
    onSuccess: async () => {
      categoryForm.reset(CATEGORY_DEFAULTS);
      setCategoryEditingId(null);
      await invalidate();
    },
  });

  const vendorMutation = useMutation({
    mutationFn: (values: VendorFormValues) => {
      const payload = {
        name: values.name,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
      };

      return vendorEditingId ? updateVendor(vendorEditingId, payload) : createVendor(payload);
    },
    onSuccess: async () => {
      vendorForm.reset(VENDOR_DEFAULTS);
      setVendorEditingId(null);
      await invalidate();
    },
  });

  const modelMutation = useMutation({
    mutationFn: (values: ModelFormValues) => {
      const payload = {
        category_id: Number(values.category_id),
        vendor_id: values.vendor_id ? Number(values.vendor_id) : null,
        name: values.name,
        manufacturer: values.manufacturer || null,
      };

      return modelEditingId ? updateAssetModel(modelEditingId, payload) : createAssetModel(payload);
    },
    onSuccess: async () => {
      modelForm.reset(MODEL_DEFAULTS);
      setModelEditingId(null);
      await invalidate();
    },
  });

  const departmentDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: async () => {
      setPendingDeletion(null);
      await invalidate();
    },
  });
  const locationDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteLocation(id),
    onSuccess: async () => {
      setPendingDeletion(null);
      await invalidate();
    },
  });
  const categoryDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteAssetCategory(id),
    onSuccess: async () => {
      setPendingDeletion(null);
      await invalidate();
    },
  });
  const vendorDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: async () => {
      setPendingDeletion(null);
      await invalidate();
    },
  });
  const modelDeleteMutation = useMutation({
    mutationFn: (id: number) => deleteAssetModel(id),
    onSuccess: async () => {
      setPendingDeletion(null);
      await invalidate();
    },
  });

  const resetDepartmentForm = () => {
    departmentForm.reset(DEPARTMENT_DEFAULTS);
    setDepartmentEditingId(null);
  };
  const resetLocationForm = () => {
    locationForm.reset(LOCATION_DEFAULTS);
    setLocationEditingId(null);
  };
  const resetCategoryForm = () => {
    categoryForm.reset(CATEGORY_DEFAULTS);
    setCategoryEditingId(null);
  };
  const resetVendorForm = () => {
    vendorForm.reset(VENDOR_DEFAULTS);
    setVendorEditingId(null);
  };
  const resetModelForm = () => {
    modelForm.reset(MODEL_DEFAULTS);
    setModelEditingId(null);
  };

  const isMutating =
    departmentMutation.isPending ||
    locationMutation.isPending ||
    categoryMutation.isPending ||
    vendorMutation.isPending ||
    modelMutation.isPending ||
    departmentDeleteMutation.isPending ||
    locationDeleteMutation.isPending ||
    categoryDeleteMutation.isPending ||
    vendorDeleteMutation.isPending ||
    modelDeleteMutation.isPending;

  const mutationErrorMessage =
    departmentMutation.error?.message ||
    locationMutation.error?.message ||
    categoryMutation.error?.message ||
    vendorMutation.error?.message ||
    modelMutation.error?.message ||
    departmentDeleteMutation.error?.message ||
    locationDeleteMutation.error?.message ||
    categoryDeleteMutation.error?.message ||
    vendorDeleteMutation.error?.message ||
    modelDeleteMutation.error?.message ||
    null;

  const hasLookupData =
    departments.length > 0 || locations.length > 0 || vendors.length > 0 || categories.length > 0 || models.length > 0;

  const confirmDeletion = () => {
    if (!pendingDeletion) {
      return;
    }

    switch (pendingDeletion.entity) {
      case "department":
        departmentDeleteMutation.mutate(pendingDeletion.id);
        break;
      case "location":
        locationDeleteMutation.mutate(pendingDeletion.id);
        break;
      case "category":
        categoryDeleteMutation.mutate(pendingDeletion.id);
        break;
      case "vendor":
        vendorDeleteMutation.mutate(pendingDeletion.id);
        break;
      case "model":
        modelDeleteMutation.mutate(pendingDeletion.id);
        break;
      default:
        break;
    }
  };

  if (isLoading && !hasLookupData) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Panel key={index}>
              <div className="grid gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            </Panel>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Amministrazione"
        title="Gestione tabelle"
        description="Mantieni i dati di riferimento usati da asset, assegnazioni e manutenzione."
      />

      {error ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Errore caricamento lookup</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {mutationErrorMessage ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertTitle>Operazione non completata</AlertTitle>
          <AlertDescription>{mutationErrorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2" aria-busy={isLoading || isMutating}>
        <LookupPanel title="Dipartimenti" itemCount={departments.length}>
          <Form {...departmentForm}>
            <form onSubmit={departmentForm.handleSubmit((values) => departmentMutation.mutate(values))} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={departmentForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Codice dipartimento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={departmentForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome dipartimento" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <LookupFormActions
                isEditing={departmentEditingId !== null}
                isPending={departmentMutation.isPending}
                createLabel="Aggiungi dipartimento"
                updateLabel="Salva dipartimento"
                onCancel={resetDepartmentForm}
              />
            </form>
          </Form>
          <LookupList
            items={departments}
            onEdit={(item) => {
              setDepartmentEditingId(item.id);
              departmentForm.reset({ code: item.code ?? "", name: item.name });
            }}
            onDelete={(item) => setPendingDeletion({ entity: "department", id: item.id, label: item.name })}
          />
        </LookupPanel>

        <LookupPanel title="Sedi" itemCount={locations.length}>
          <Form {...locationForm}>
            <form onSubmit={locationForm.handleSubmit((values) => locationMutation.mutate(values))} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={locationForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Codice sede" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={locationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome sede" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormSelectField
                  control={locationForm.control}
                  name="parent_id"
                  label="Sede padre"
                  placeholder="Nessuna sede padre"
                  options={locations
                    .filter((item) => item.id !== locationEditingId)
                    .map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </div>
              <LookupFormActions
                isEditing={locationEditingId !== null}
                isPending={locationMutation.isPending}
                createLabel="Aggiungi sede"
                updateLabel="Salva sede"
                onCancel={resetLocationForm}
              />
            </form>
          </Form>
          <LookupList
            items={locations}
            onEdit={(item) => {
              setLocationEditingId(item.id);
              locationForm.reset({
                code: item.code ?? "",
                name: item.name,
                parent_id: item.parent_id ? String(item.parent_id) : "",
              });
            }}
            onDelete={(item) => setPendingDeletion({ entity: "location", id: item.id, label: item.name })}
            describeItem={(item) => {
              const parentName = locations.find((parentItem) => parentItem.id === item.parent_id)?.name;
              return parentName ? `Padre: ${parentName}` : "";
            }}
          />
        </LookupPanel>

        <LookupPanel title="Categorie asset" itemCount={categories.length}>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit((values) => categoryMutation.mutate(values))} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={categoryForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Codice categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome categoria" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormSelectField
                  control={categoryForm.control}
                  name="parent_id"
                  label="Categoria padre"
                  placeholder="Nessuna categoria padre"
                  options={categories
                    .filter((item) => item.id !== categoryEditingId)
                    .map((item) => ({ value: String(item.id), label: item.name }))}
                />
              </div>
              <LookupFormActions
                isEditing={categoryEditingId !== null}
                isPending={categoryMutation.isPending}
                createLabel="Aggiungi categoria"
                updateLabel="Salva categoria"
                onCancel={resetCategoryForm}
              />
            </form>
          </Form>
          <LookupList
            items={categories}
            onEdit={(item) => {
              setCategoryEditingId(item.id);
              categoryForm.reset({
                code: item.code ?? "",
                name: item.name,
                parent_id: item.parent_id ? String(item.parent_id) : "",
              });
            }}
            onDelete={(item) => setPendingDeletion({ entity: "category", id: item.id, label: item.name })}
            describeItem={(item) => {
              const parentName = categories.find((parentItem) => parentItem.id === item.parent_id)?.name;
              return parentName ? `Padre: ${parentName}` : "";
            }}
          />
        </LookupPanel>

        <LookupPanel title="Fornitori" itemCount={vendors.length}>
          <Form {...vendorForm}>
            <form onSubmit={vendorForm.handleSubmit((values) => vendorMutation.mutate(values))} className="grid gap-4">
              <FormField
                control={vendorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fornitore</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome fornitore" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={vendorForm.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email contatto</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" inputMode="email" autoComplete="email" spellCheck={false} placeholder="Email contatto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={vendorForm.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono contatto</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" inputMode="tel" autoComplete="tel" placeholder="Telefono contatto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <LookupFormActions
                isEditing={vendorEditingId !== null}
                isPending={vendorMutation.isPending}
                createLabel="Aggiungi fornitore"
                updateLabel="Salva fornitore"
                onCancel={resetVendorForm}
              />
            </form>
          </Form>
          <LookupList
            items={vendors}
            describeItem={(item) => [item.contact_email, item.contact_phone].filter(Boolean).join(" · ")}
            onEdit={(item) => {
              setVendorEditingId(item.id);
              vendorForm.reset({
                name: item.name,
                contact_email: item.contact_email ?? "",
                contact_phone: item.contact_phone ?? "",
              });
            }}
            onDelete={(item) => setPendingDeletion({ entity: "vendor", id: item.id, label: item.name })}
          />
        </LookupPanel>

        <LookupPanel title="Modelli asset" itemCount={models.length} className="xl:col-span-2">
          <Form {...modelForm}>
            <form onSubmit={modelForm.handleSubmit((values) => modelMutation.mutate(values))} className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-4">
                <FormSelectField
                  control={modelForm.control}
                  name="category_id"
                  label="Categoria"
                  placeholder="Seleziona categoria"
                  options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
                />
                <FormSelectField
                  control={modelForm.control}
                  name="vendor_id"
                  label="Fornitore"
                  placeholder="Nessun fornitore"
                  options={vendors.map((item) => ({ value: String(item.id), label: item.name }))}
                />
                <FormField
                  control={modelForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome modello</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome modello" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={modelForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produttore</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Produttore" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <LookupFormActions
                isEditing={modelEditingId !== null}
                isPending={modelMutation.isPending}
                createLabel="Aggiungi modello"
                updateLabel="Salva modello"
                onCancel={resetModelForm}
              />
            </form>
          </Form>
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
              modelForm.reset({
                category_id: item.category_id ? String(item.category_id) : "",
                vendor_id: item.vendor_id ? String(item.vendor_id) : "",
                name: item.name,
                manufacturer: item.manufacturer ?? "",
              });
            }}
            onDelete={(item) => setPendingDeletion({ entity: "model", id: item.id, label: item.name })}
          />
        </LookupPanel>
      </div>

      <AlertDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il valore selezionato?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion
                ? `Conferma la rimozione di "${pendingDeletion.label}". L'operazione non e reversibile.`
                : "Conferma la rimozione del valore selezionato."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletion}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LookupPanel({
  title,
  itemCount,
  className,
  children,
}: {
  title: string;
  itemCount: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel {...(className ? { className } : {})} eyebrow="Lookup" title={title}>
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Configura i valori utilizzati nei workflow operativi.</p>
          <Badge tone="neutral">{itemCount} elementi</Badge>
        </div>
        {children}
      </div>
    </Panel>
  );
}

function LookupFormActions({
  isEditing,
  isPending,
  createLabel,
  updateLabel,
  onCancel,
}: {
  isEditing: boolean;
  isPending: boolean;
  createLabel: string;
  updateLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvataggio..." : isEditing ? updateLabel : createLabel}
      </Button>
      {isEditing ? (
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annulla modifica
        </Button>
      ) : null}
    </div>
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
  if (items.length === 0) {
    return (
      <Empty className="border border-dashed border-border bg-muted py-10">
        <EmptyHeader>
          <EmptyTitle>Nessun elemento presente</EmptyTitle>
          <EmptyDescription>Aggiungi il primo valore di riferimento per iniziare a popolare il catalogo.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-border bg-muted p-3">
      {items.map((item) => {
        const description = describeItem ? describeItem(item) : "";

        return (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="grid gap-1">
              <p className="text-sm font-semibold text-foreground">
                {item.code ? `${item.code} · ${item.name}` : item.name}
              </p>
              {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => onEdit(item)}>
                Modifica
              </Button>
              <Button type="button" variant="destructive" onClick={() => onDelete(item)}>
                Elimina
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

