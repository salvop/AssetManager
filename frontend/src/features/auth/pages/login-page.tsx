import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { login } from "@/features/auth/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type LoginFormValues, loginSchema } from "@/features/auth/schemas/login.schema";
import { setAccessToken } from "@/lib/session";

const LOGIN_SUPPORT_EMAIL_PREFERENCE_KEY = "opsasset.login.supportEmail";
const DEFAULT_SUPPORT_EMAIL = "support@fidesspa.eu";

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const helpdeskEmail = useMemo(() => {
    const envEmail = import.meta.env.VITE_HELPDESK_EMAIL;
    const fallbackEmail = envEmail ?? DEFAULT_SUPPORT_EMAIL;

    try {
      const storedEmail = window.localStorage.getItem(LOGIN_SUPPORT_EMAIL_PREFERENCE_KEY);
      if (storedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storedEmail)) {
        return storedEmail;
      }
    } catch {
      return fallbackEmail;
    }

    return fallbackEmail;
  }, []);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
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

  const handlePasswordKeyEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "CapsLock") {
      setIsCapsLockOn((value) => !value);
      return;
    }
    setIsCapsLockOn(event.getModifierState("CapsLock"));
  };

  const loginErrorMessage = "Credenziali non valide. Verifica nome utente e password e riprova.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>OpsAsset</CardTitle>
              <CardDescription>
                Accedi al pannello operativo per inventario, assegnazioni e manutenzione.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome utente</FormLabel>
                      <FormControl>
                        <Input
                          autoFocus
                          autoComplete="username"
                          spellCheck={false}
                          {...field}
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
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pr-10"
                            onKeyDown={handlePasswordKeyEvent}
                            onKeyUp={handlePasswordKeyEvent}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                        >
                          {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                        </Button>
                      </div>
                      {isCapsLockOn && (
                        <p className="text-sm font-medium text-amber-700" role="status" aria-live="polite">
                          Caps Lock attivo.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="mt-6 w-full"
              >
                {loginMutation.isPending ? "Accesso in corso…" : "Accedi"}
              </Button>
              <div className="mt-3 text-center">
                <a
                  href={`mailto:${helpdeskEmail}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Problemi di accesso?
                </a>
              </div>
              {loginMutation.error && (
                <Alert variant="destructive" className="mt-3" aria-live="polite">
                  <AlertDescription>{loginErrorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}

