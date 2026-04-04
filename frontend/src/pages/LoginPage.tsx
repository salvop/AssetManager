import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { login } from "../api/auth";
import { setAccessToken } from "../lib/session";

const loginSchema = z.object({
  username: z.string().min(1, "Lo username e obbligatorio"),
  password: z.string().min(1, "La password e obbligatoria"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginFormValues) => login(username, password),
    onSuccess: async (response) => {
      setAccessToken(response.access_token);
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      navigate("/dashboard");
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(140deg,#f5f2ea,#ece7dc)] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,107,79,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(198,163,86,0.14),transparent_26%)]" />
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="app-panel-strong relative w-full max-w-md rounded-[30px] p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Accesso interno</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Workspace asset</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
          Entra nel pannello operativo per controllare inventario, scadenze, assegnazioni e manutenzione.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              {...register("username")}
              className="w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 outline-none ring-brand-500 transition focus:ring-2"
            />
            {errors.username && <p className="mt-1 text-sm text-rose-600">{errors.username.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 outline-none ring-brand-500 transition focus:ring-2"
            />
            {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
          </div>
        </div>

        <button className="mt-8 w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(36,88,63,0.24)] transition hover:bg-brand-700">
          {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
        </button>
        {loginMutation.error && (
          <p className="mt-3 text-sm text-rose-600">{loginMutation.error.message}</p>
        )}
      </form>
    </div>
  );
}
