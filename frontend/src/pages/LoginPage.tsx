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
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Accesso interno</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Accedi</h1>
        <p className="mt-2 text-sm text-slate-500">Usa il tuo account interno per accedere ai flussi di inventario.</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              {...register("username")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring-2"
            />
            {errors.username && <p className="mt-1 text-sm text-rose-600">{errors.username.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-brand-500 focus:ring-2"
            />
            {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
          </div>
        </div>

        <button className="mt-8 w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
        </button>
        {loginMutation.error && (
          <p className="mt-3 text-sm text-rose-600">{loginMutation.error.message}</p>
        )}
      </form>
    </div>
  );
}
