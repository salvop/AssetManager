import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createUser, getUserRoles, getUsers, updateUser } from "@/features/users/api/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { UserDataTable } from "@/features/users/components/user-data-table";
import type { UserListItem } from "@/types/api";

const initialForm = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  department_id: "",
  is_active: true,
  role_codes: [] as string[],
};

export function UserManagementPage() {
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
  const { data: usersResponse, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
  const { data: rolesResponse, isLoading: isRolesLoading, error: rolesError } = useQuery({
    queryKey: ["user-roles"],
    queryFn: getUserRoles,
  });

  const users = usersResponse?.items ?? [];
  const roles = rolesResponse?.items ?? [];
  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name,
        email: form.email || null,
        password: form.password || null,
        department_id: form.department_id ? Number(form.department_id) : null,
        is_active: form.is_active,
        role_codes: form.role_codes,
        ...(editingUserId ? {} : { username: form.username }),
      };

      if (editingUserId) {
        return updateUser(editingUserId, payload);
      }

      return createUser({
        ...payload,
        username: form.username,
        password: form.password,
      });
    },
    onSuccess: async () => {
      resetForm();
      await invalidate();
    },
  });

  const activeUsers = useMemo(() => users.filter((user) => user.is_active !== false).length, [users]);
  const departmentNameById = useMemo(
    () =>
      departments.reduce<Record<number, string>>((acc, department) => {
        acc[department.id] = department.name;
        return acc;
      }, {}),
    [departments],
  );

  const resetForm = () => {
    setEditingUserId(null);
    setForm(initialForm);
  };

  const startEdit = (user: UserListItem) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email ?? "",
      password: "",
      department_id: user.department_id ? String(user.department_id) : "",
      is_active: user.is_active !== false,
      role_codes: user.role_codes,
    });
  };

  const toggleRole = (roleCode: string) => {
    setForm((current) => ({
      ...current,
      role_codes: current.role_codes.includes(roleCode)
        ? current.role_codes.filter((item) => item !== roleCode)
        : [...current.role_codes, roleCode],
    }));
  };

  if (!isAdmin) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h2 className="text-2xl font-semibold">Gestione utenti</h2>
        <p className="mt-2 text-sm">Questa sezione e disponibile solo per gli amministratori di sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Amministrazione"
        title="Utenti & ruoli"
        description="Crea e aggiorna gli utenti interni, assegna il dipartimento e definisci i ruoli applicativi."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Panel title={editingUserId ? "Modifica utente" : "Nuovo utente"} eyebrow="Gestione account" aria-busy={mutation.isPending}>
          <div className="flex items-center justify-between">
            {editingUserId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annulla
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label htmlFor="user-form-username" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Username</span>
                <Input
                  id="user-form-username"
                  name="user-form-username"
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="Username…"
                  disabled={Boolean(editingUserId)}
                />
              </label>
              <label htmlFor="user-form-department" className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dipartimento</span>
                <SelectField
                  value={form.department_id}
                  onValueChange={(value) => setForm((current) => ({ ...current, department_id: value }))}
                  placeholder="Nessun dipartimento"
                  options={departments.map((department) => ({
                    value: String(department.id),
                    label: department.name,
                  }))}
                />
              </label>
            </div>

            <label htmlFor="user-form-full-name" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nome completo</span>
              <Input
                id="user-form-full-name"
                name="user-form-full-name"
                value={form.full_name}
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                placeholder="Nome e cognome…"
              />
            </label>

            <label htmlFor="user-form-email" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</span>
              <Input
                id="user-form-email"
                name="user-form-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email…"
              />
            </label>

            <label htmlFor="user-form-password" className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password</span>
              <Input
                id="user-form-password"
                name="user-form-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUserId ? "Nuova password opzionale…" : "Password iniziale…"}
              />
            </label>

            <label htmlFor="user-form-active" className="flex items-center gap-2 text-sm text-slate-700">
              <input
                id="user-form-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Utente attivo
            </label>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Ruoli</p>
              <div className="grid gap-2 md:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.role_codes.includes(role.code ?? "")}
                      onChange={() => toggleRole(role.code ?? "")}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !form.full_name ||
                !form.role_codes.length ||
                (!editingUserId && (!form.username || !form.password))
              }
            >
              {editingUserId ? "Salva utente" : "Crea utente"}
            </Button>

            {mutation.error && <p className="text-sm text-rose-600" aria-live="polite">{mutation.error.message}</p>}
          </div>
        </Panel>

        <Panel title="Utenti interni" eyebrow="Directory" aria-busy={isUsersLoading || isRolesLoading}>
          <div className="flex items-center justify-between">
            <Badge tone="neutral" className="bg-slate-950 text-white">
              {activeUsers} attivi su {users.length}
            </Badge>
          </div>

          <div className="mt-4">
            <UserDataTable data={users} departmentNameById={departmentNameById} onEdit={startEdit} />
            {(usersError || rolesError) && <p className="text-sm text-rose-600" aria-live="polite">{String(usersError?.message || rolesError?.message)}</p>}
            {(isUsersLoading || isRolesLoading) && <p className="text-sm text-slate-500" aria-live="polite">Caricamento utenti e ruoli…</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
