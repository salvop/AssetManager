import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createUser, getUserRoles, getUsers, updateUser } from "../api/users";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLookupsBundle } from "../hooks/useLookups";
import type { UserListItem } from "../types/api";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

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
    queryFn: getUsers,
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
      <div className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Amministrazione</p>
        <h2 className="mt-2 text-3xl font-semibold">Utenti e ruoli</h2>
        <p className="mt-2 text-sm text-slate-500">
          Crea e aggiorna gli utenti interni, assegna il dipartimento e definisci i ruoli applicativi.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <section className="app-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{editingUserId ? "Modifica utente" : "Nuovo utente"}</h3>
            {editingUserId && (
              <button type="button" onClick={resetForm} className="text-sm font-medium text-brand-700">
                Annulla
              </button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="Username"
                className={inputClassName}
                disabled={Boolean(editingUserId)}
              />
              <select
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

            <input
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Nome e cognome"
              className={inputClassName}
            />

            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className={inputClassName}
            />

            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={editingUserId ? "Nuova password opzionale" : "Password iniziale"}
              className={inputClassName}
            />

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
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

            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !form.full_name ||
                !form.role_codes.length ||
                (!editingUserId && (!form.username || !form.password))
              }
              className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
            >
              {editingUserId ? "Salva utente" : "Crea utente"}
            </button>

            {mutation.error && <p className="text-sm text-rose-600">{mutation.error.message}</p>}
          </div>
        </section>

        <section className="app-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Utenti interni</h3>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              {activeUsers} attivi su {users.length}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {user.full_name} <span className="font-normal text-slate-500">({user.username})</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[user.email, departments.find((department) => department.id === user.department_id)?.name, user.role_codes.join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                    {user.is_active === false ? "Disattivato" : "Attivo"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Modifica
                </button>
              </div>
            ))}
            {!users.length && !isUsersLoading && <p className="text-sm text-slate-500">Nessun utente disponibile.</p>}
            {(usersError || rolesError) && <p className="text-sm text-rose-600">{String(usersError?.message || rolesError?.message)}</p>}
            {(isUsersLoading || isRolesLoading) && <p className="text-sm text-slate-500">Caricamento utenti e ruoli...</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
