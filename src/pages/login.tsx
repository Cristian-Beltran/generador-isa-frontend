import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Mail, Lock, Footprints } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/auth/useAuth";

const formSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setServerError("");
    try {
      await login({ email: values.email, password: values.password });
      navigate("/");
    } catch {
      form.setError("email", { type: "server", message: " " });
      form.setError("password", { type: "server", message: " " });
      setServerError("Credenciales inválidas o sesión no autorizada.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      </div>
    );
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden">
      {/* Fondo con gradientes suaves y textura médica sutil */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(1000px_600px_at_10%_10%,hsl(var(--primary)/0.08),transparent_60%),radial-gradient(800px_500px_at_90%_90%,hsl(var(--blue)/0.08),transparent_60%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Encabezado con icono y nombre del sistema */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-primary/40 via-foreground/10 to-blue-400/40 blur-md" />
              <div className="relative h-12 w-12 grid place-items-center rounded-2xl border border-border/50 bg-card/60 backdrop-blur">
                <Footprints className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h1 className="text-lg font-semibold tracking-tight">
              Login de sistema
            </h1>
          </div>

          {/* Contenedor principal */}
          <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-lg">
            <div className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {serverError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{serverError}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground/85">
                          Correo
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="admin@clinic.com"
                              className="pl-10 h-11 rounded-2xl border-input/60 bg-background/60 backdrop-blur placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/40"
                              autoComplete="email"
                              {...field}
                            />
                          </div>
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
                        <FormLabel className="text-sm font-medium text-foreground/85">
                          Contraseña
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-11 rounded-2xl border-input/60 bg-background/60 backdrop-blur placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/40"
                              autoComplete="current-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={
                                showPassword
                                  ? "Ocultar contraseña"
                                  : "Mostrar contraseña"
                              }
                            >
                              {showPassword ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 3l18 18" />
                                  <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                                  <path d="M16.24 7.76A9.77 9.77 0 0121 12s-3 5-9 5a9.77 9.77 0 01-4.24-1.01" />
                                  <path d="M9.88 4.24A9.77 9.77 0 0112 4c6 0 9 5 9 5a16.9 16.9 0 01-1.64 2.56" />
                                </svg>
                              ) : (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 rounded-2xl text-[15px] font-medium transition-all duration-200 hover:shadow-md"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando…
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </Button>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Al continuar aceptas las políticas de privacidad y uso de
                    datos.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
