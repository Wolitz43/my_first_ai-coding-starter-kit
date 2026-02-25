"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    confirmPassword: z.string().min(1, "Bitte bestaetigen Sie das Passwort"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwoerter stimmen nicht ueberein",
    path: ["confirmPassword"],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: UpdatePasswordFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (authError) {
        if (authError.message.includes("expired")) {
          setError(
            "Der Link ist abgelaufen. Bitte fordere einen neuen Link an."
          );
        } else {
          setError("Fehler beim Aktualisieren des Passworts. Bitte versuche es erneut.");
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("[update-password] Unexpected error:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout title="Passwort aktualisiert">
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Dein Passwort wurde erfolgreich aktualisiert. Du kannst dich jetzt
              mit deinem neuen Passwort anmelden.
            </AlertDescription>
          </Alert>
          <div className="text-center">
            <Link href="/login">
              <Button className="w-full">Zur Anmeldung</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Neues Passwort festlegen"
      description="Gib dein neues Passwort ein."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {error.includes("abgelaufen") && (
                  <Link
                    href="/auth/reset-password"
                    className="block mt-2 text-primary hover:underline font-medium"
                  >
                    Neuen Link anfordern
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Neues Passwort</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Mindestens 8 Zeichen"
                    autoComplete="new-password"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passwort bestaetigen</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Passwort wiederholen"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              "Passwort speichern"
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Zurueck zur Anmeldung
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
