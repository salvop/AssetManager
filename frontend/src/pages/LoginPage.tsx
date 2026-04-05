import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { login } from "../api/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
      <Card className="app-panel-strong relative w-full max-w-md rounded-[30px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="px-8 pt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Accesso interno</p>
            <CardTitle className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">Workspace asset</CardTitle>
            <CardDescription className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Entra nel pannello operativo per controllare inventario, scadenze, assegnazioni e manutenzione.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="login-username" className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <Input
                  id="login-username"
                  autoComplete="username"
                  spellCheck={false}
                  className="bg-white/85"
                  {...register("username")}
                />
                {errors.username && <p className="mt-1 text-sm text-rose-600">{errors.username.message}</p>}
              </div>
              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  className="bg-white/85"
                  {...register("password")}
                />
                {errors.password && <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-8 w-full bg-brand-600 py-3 shadow-[0_18px_30px_rgba(36,88,63,0.24)] hover:bg-brand-700"
            >
              {loginMutation.isPending ? "Accesso in corso…" : "Accedi"}
            </Button>
            {loginMutation.error && (
              <p className="mt-3 text-sm text-rose-600" aria-live="polite">{loginMutation.error.message}</p>
            )}
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
