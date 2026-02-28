"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, MailCheck } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gueltige E-Mail-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const searchParams = useSearchParams();

  // Show message when session has expired
  const sessionExpiredMessage =
    searchParams.get("reason") === "session_expired"
      ? "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
      : null;

  // Show message when auth callback failed (e.g. email confirmation link error)
  const authCallbackFailedMessage =
    searchParams.get("error") === "auth_callback_failed"
      ? "Anmeldung fehlgeschlagen. Bitte versuche es erneut."
      : null;

  const infoMessage = sessionExpiredMessage ?? authCallbackFailedMessage;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function handleResendConfirmation() {
    setResendLoading(true);
    try {
      await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.getValues("email") }),
      });
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    setEmailNotConfirmed(false);
    setResendSuccess(false);

    try {
      // BUG-2 + BUG-1: Use API route for rate limiting + remember-me support
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe ?? false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.emailNotConfirmed) {
          setEmailNotConfirmed(true);
        } else {
          setError(data.error ?? "Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        }
        setIsLoading(false);
        return;
      }

      // Use window.location.href for post-login redirect (not router.push)
      window.location.href = "/dashboard";
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout title="Anmelden" description="Melde dich bei deinem Konto an">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {infoMessage && !error && !emailNotConfirmed && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>
          )}
          {emailNotConfirmed && (
            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>
                  Bitte bestätige zuerst deine E-Mail-Adresse. Schau in deinem Postfach nach.
                </p>
                {resendSuccess ? (
                  <p className="text-sm font-medium">Bestätigungsmail wurde erneut gesendet.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="text-sm font-medium underline underline-offset-2 disabled:opacity-50"
                  >
                    {resendLoading ? "Wird gesendet..." : "Bestätigungsmail erneut senden"}
                  </button>
                )}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@beispiel.de"
                    autoComplete="email"
                    disabled={isLoading}
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
                <FormLabel>Passwort</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Dein Passwort"
                      autoComplete="current-password"
                      disabled={isLoading}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Angemeldet bleiben
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              href="/auth/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Passwort vergessen?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Anmelden...
              </>
            ) : (
              "Anmelden"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Noch kein Konto?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              Registrieren
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
