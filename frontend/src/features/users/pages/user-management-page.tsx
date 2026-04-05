import { zodResolver } from "@hookform/resolvers/zod";
import { type PaginationState, type SortingState } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/ui/select-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { createUser, getUserRoles, getUsers, updateUser } from "@/features/users/api/users";
import { userFormSchema, type UserFormValues } from "@/features/users/schemas/user-form.schema";
import { UserDataTable } from "@/features/users/components/user-data-table";
import type { UserListItem } from "@/types/api";

const defaultValues: UserFormValues = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  department_id: "",
  is_active: true,
  role_codes: [],
};

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
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
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  const { data: usersResponse, isLoading: isUsersLoading, error: usersError } = useQuery({
    queryKey: ["users", pagination],
    queryFn: () =>
      getUsers({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      }),
  });
  const { data: rolesResponse, isLoading: isRolesLoading, error: rolesError } = useQuery({
    queryKey: ["user-roles"],
    queryFn: getUserRoles,
  });

  const users = usersResponse?.items ?? [];
  const roles = rolesResponse?.items ?? [];
  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const resetForm = () => {
    setEditingUserId(null);
    form.reset(defaultValues);
  };

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload = {
        full_name: values.full_name,
        email: values.email || null,
        password: values.password || null,
        department_id: values.department_id ? Number(values.department_id) : null,
        is_active: values.is_active,
        role_codes: values.role_codes,
        ...(editingUserId ? {} : { username: values.username }),
      };

      if (editingUserId) {
        return updateUser(editingUserId, payload);
      }

      return createUser({
        ...payload,
        username: values.username,
        password: values.password,
      });
    },
    onSuccess: async () => {
      resetForm();
      await invalidate();
    },
  });

  const activeUsersOnPage = useMemo(() => users.filter((user) => user.is_active !== false).length, [users]);
  const totalUsers = usersResponse?.total ?? 0;
  const departmentNameById = useMemo(
    () =>
      departments.reduce<Record<number, string>>((acc, department) => {
        acc[department.id] = department.name;
        return acc;
      }, {}),
    [departments],
  );

  const startEdit = (user: UserListItem) => {
    setEditingUserId(user.id);
    form.reset({
      username: user.username,
      full_name: user.full_name,
      email: user.email ?? "",
      password: "",
      department_id: user.department_id ? String(user.department_id) : "",
      is_active: user.is_active !== false,
      role_codes: user.role_codes,
    });
  };

  const onSubmit = (values: UserFormValues) => {
    if (!editingUserId && !values.password.trim()) {
      form.setError("password", {
        type: "manual",
        message: "La password iniziale e obbligatoria.",
      });
      return;
    }

    mutation.mutate(values);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle />
        <AlertTitle>Gestione utenti</AlertTitle>
        <AlertDescription>
          Questa sezione e disponibile solo per gli amministratori di sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Amministrazione"
        title="Utenti & ruoli"
        description="Crea e aggiorna gli utenti interni, assegna il dipartimento e definisci i ruoli applicativi."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Panel
          title={editingUserId ? "Modifica utente" : "Nuovo utente"}
          eyebrow="Gestione account"
          aria-busy={mutation.isPending}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div className="flex items-center justify-end">
                {editingUserId ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Annulla
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="user-form-username"
                          autoComplete="username"
                          placeholder="Username"
                          disabled={Boolean(editingUserId)}
                        />
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
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input {...field} id="user-form-full-name" placeholder="Nome e cognome" />
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
                        id="user-form-email"
                        type="email"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="user-form-password"
                        type="password"
                        autoComplete={editingUserId ? "new-password" : "current-password"}
                        placeholder={
                          editingUserId ? "Nuova password opzionale" : "Password iniziale"
                        }
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
                    <div className="flex flex-col gap-1">
                      <FormLabel className="text-sm">Utente attivo</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role_codes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ruoli applicativi</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="multiple"
                        variant="outline"
                        className="flex flex-wrap justify-start gap-2"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {roles.map((role) => (
                          <ToggleGroupItem key={role.id} value={role.code ?? ""} className="rounded-full px-4">
                            {role.name}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                    </FormControl>
                    <FormMessage />
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

              <Button
                type="submit"
                disabled={mutation.isPending || isRolesLoading}
                className="self-start"
              >
                {editingUserId ? "Salva utente" : "Crea utente"}
              </Button>
            </form>
          </Form>
        </Panel>

        <Panel title="Utenti interni" eyebrow="Directory" aria-busy={isUsersLoading || isRolesLoading}>
          <div className="flex items-center justify-between">
            <Badge tone="neutral">
              {activeUsersOnPage} attivi nella pagina • {totalUsers} totali
            </Badge>
          </div>

          <div className="mt-4">
            <UserDataTable
              data={users}
              departmentNameById={departmentNameById}
              onEdit={startEdit}
              sorting={sorting}
              pagination={pagination}
              onSortingChange={setSorting}
              onPaginationChange={setPagination}
              rowCount={totalUsers}
              pageCount={Math.max(1, Math.ceil(totalUsers / pagination.pageSize))}
              isLoading={isUsersLoading || isRolesLoading}
              errorMessage={String(usersError?.message || rolesError?.message || "") || null}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}

