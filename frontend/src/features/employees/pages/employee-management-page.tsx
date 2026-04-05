import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { createEmployee, getEmployees, updateEmployee } from "@/features/employees/api/employees";
import { employeeFormSchema, type EmployeeFormValues } from "@/features/employees/schemas/employee-form.schema";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { EmployeeListItem } from "@/types/api";

const defaultValues: EmployeeFormValues = {
  employee_code: "",
  full_name: "",
  email: "",
  department_id: "",
  is_active: true,
  notes: "",
};

export function EmployeeManagementPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { departments } = useLookupsBundle({
    departments: true,
    locations: false,
    vendors: false,
    categories: false,
    models: false,
    statuses: false,
    employees: false,
    users: false,
  });
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });
  const { data: employeesResponse, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(),
  });
  const employees = employeesResponse?.items ?? [];
  const canManage =
    currentUser?.role_codes.some((code) => ["ADMIN", "ASSET_MANAGER", "OPERATOR"].includes(code)) ?? false;

  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.is_active).length, [employees]);

  const resetForm = () => {
    setEditingEmployeeId(null);
    form.reset(defaultValues);
  };

  const mutation = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      const payload = {
        employee_code: values.employee_code,
        full_name: values.full_name,
        email: values.email || null,
        department_id: values.department_id ? Number(values.department_id) : null,
        is_active: values.is_active,
        notes: values.notes || null,
      };
      return editingEmployeeId
        ? updateEmployee(editingEmployeeId, payload)
        : createEmployee(payload);
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const startEdit = (employee: EmployeeListItem) => {
    setEditingEmployeeId(employee.id);
    form.reset({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      email: employee.email ?? "",
      department_id: employee.department_id ? String(employee.department_id) : "",
      is_active: employee.is_active,
      notes: employee.notes ?? "",
    });
  };

  const onSubmit = (values: EmployeeFormValues) => {
    mutation.mutate(values);
  };

  if (!canManage) {
    return (
      <Alert>
        <AlertCircle />
        <AlertTitle>Anagrafica persone</AlertTitle>
        <AlertDescription>
          Questa sezione e disponibile solo per chi gestisce operativamente gli asset.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Assegnatari"
        title="Persone aziendali"
        description="Qui gestisci gli assegnatari reali degli asset, separati dagli account che accedono a OpsAsset."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Panel title={editingEmployeeId ? "Modifica persona" : "Nuova persona"} eyebrow="Directory interna">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex items-center justify-end">
                {editingEmployeeId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Annulla
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="employee_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice dipendente</FormLabel>
                      <FormControl>
                        <Input {...field} id="employee-code" placeholder="Codice dipendente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormSelectField
                  control={form.control}
                  name="department_id"
                  label="Dipartimento"
                  placeholder="Nessun dipartimento"
                  options={departments.map((department) => ({
                    value: String(department.id),
                    label: department.name,
                  }))}
                />
              </div>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome e cognome</FormLabel>
                    <FormControl>
                      <Input {...field} id="employee-full-name" placeholder="Nome e cognome" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="employee-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="Email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="employee-notes"
                        placeholder="Note operative"
                        className="min-h-28"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 rounded-md border border-border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                    </FormControl>
                    <FormLabel className="text-sm">Persona attiva</FormLabel>
                  </FormItem>
                )}
              />

              {mutation.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>Operazione non completata</AlertTitle>
                  <AlertDescription>{mutation.error.message}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={mutation.isPending} className="self-start">
                {editingEmployeeId ? "Salva persona" : "Crea persona"}
              </Button>
            </form>
          </Form>
        </Panel>

        <Panel title="Assegnatari censiti" eyebrow="Anagrafica" aria-busy={isLoading}>
          <div className="flex items-center justify-between">
            <Badge tone="neutral">
              {activeEmployees} attivi su {employees.length}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {isLoading ? (
              <>
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
                <Skeleton className="h-24 rounded-md" />
              </>
            ) : null}

            {!isLoading && error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Directory non disponibile</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : null}

            {!isLoading && !error && !employees.length ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>Nessuna persona disponibile</EmptyTitle>
                  <EmptyDescription>
                    Crea il primo assegnatario per poter associare gli asset agli utenti interni.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {!isLoading && !error
              ? employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex flex-col gap-3 rounded-md border border-border bg-muted px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {employee.full_name}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({employee.employee_code})
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[employee.email, departments.find((department) => department.id === employee.department_id)?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {employee.notes ? (
                        <p className="text-xs text-muted-foreground">{employee.notes}</p>
                      ) : null}
                    </div>
                    <Button type="button" onClick={() => startEdit(employee)} variant="secondary">
                      Modifica
                    </Button>
                  </div>
                ))
              : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

