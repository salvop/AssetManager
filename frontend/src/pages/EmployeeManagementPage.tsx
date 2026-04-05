import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createEmployee, getEmployees, updateEmployee } from "../api/employees";
import { PageHeader } from "../components/ui/page-header";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLookupsBundle } from "../hooks/useLookups";
import type { EmployeeListItem } from "../types/api";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

const initialForm = {
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
  const { data: employeesResponse, isLoading, error } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployees(),
  });
  const employees = employeesResponse?.items ?? [];
  const canManage = currentUser?.role_codes.some((code) => ["ADMIN", "ASSET_MANAGER", "OPERATOR"].includes(code)) ?? false;

  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.is_active).length, [employees]);

  const resetForm = () => {
    setEditingEmployeeId(null);
    setForm(initialForm);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        employee_code: form.employee_code,
        full_name: form.full_name,
        email: form.email || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        is_active: form.is_active,
        notes: form.notes || null,
      };
      return editingEmployeeId ? updateEmployee(editingEmployeeId, payload) : createEmployee(payload);
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const startEdit = (employee: EmployeeListItem) => {
    setEditingEmployeeId(employee.id);
    setForm({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      email: employee.email ?? "",
      department_id: employee.department_id ? String(employee.department_id) : "",
      is_active: employee.is_active,
      notes: employee.notes ?? "",
    });
  };

  if (!canManage) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-2xl font-semibold">Anagrafica persone</h2>
        <p className="mt-2 text-sm">Questa sezione e disponibile solo per chi gestisce operativamente gli asset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assegnatari"
        title="Persone aziendali"
        description="Qui gestisci gli assegnatari reali degli asset, separati dagli account che accedono ad Asset Manager."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <section className="app-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{editingEmployeeId ? "Modifica persona" : "Nuova persona"}</h3>
            {editingEmployeeId && (
              <button type="button" onClick={resetForm} className="text-sm font-medium text-brand-700">
                Annulla
              </button>
            )}
          </div>
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="employee-code" className="mb-2 block text-sm font-medium text-slate-700">Codice Dipendente</label>
              <input
                id="employee-code"
                aria-label="Codice dipendente"
                value={form.employee_code}
                onChange={(event) => setForm((current) => ({ ...current, employee_code: event.target.value }))}
                placeholder="Codice dipendente"
                className={inputClassName}
              />
              </div>
              <div>
                <label htmlFor="employee-department" className="mb-2 block text-sm font-medium text-slate-700">Dipartimento</label>
              <select
                id="employee-department"
                aria-label="Dipartimento"
                value={form.department_id}
                onChange={(event) => setForm((current) => ({ ...current, department_id: event.target.value }))}
                className={inputClassName}
              >
                <option value="">Dipartimento</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              </div>
            </div>
            <div>
              <label htmlFor="employee-full-name" className="mb-2 block text-sm font-medium text-slate-700">Nome E Cognome</label>
            <input
              id="employee-full-name"
              aria-label="Nome e cognome"
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Nome e cognome"
              className={inputClassName}
            />
            </div>
            <div>
              <label htmlFor="employee-email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="employee-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              aria-label="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className={inputClassName}
            />
            </div>
            <div>
              <label htmlFor="employee-notes" className="mb-2 block text-sm font-medium text-slate-700">Note</label>
            <textarea
              id="employee-notes"
              aria-label="Note"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Note"
              className={`${inputClassName} min-h-28`}
            />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Persona attiva
            </label>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.employee_code || !form.full_name}
              className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
            >
              {editingEmployeeId ? "Salva persona" : "Crea persona"}
            </button>
            {mutation.error && <p className="text-sm text-rose-600" aria-live="polite">{mutation.error.message}</p>}
          </div>
        </section>

        <section className="app-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Assegnatari censiti</h3>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              {activeEmployees} attivi su {employees.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {employees.map((employee) => (
              <div key={employee.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {employee.full_name} <span className="font-normal text-slate-500">({employee.employee_code})</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[employee.email, departments.find((department) => department.id === employee.department_id)?.name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {employee.notes && <p className="mt-2 text-xs text-slate-500">{employee.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(employee)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Modifica
                </button>
              </div>
            ))}
            {!employees.length && !isLoading && <p className="text-sm text-slate-500">Nessuna persona disponibile.</p>}
            {error && <p className="text-sm text-rose-600">{error.message}</p>}
            {isLoading && <p className="text-sm text-slate-500">Caricamento persone…</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
