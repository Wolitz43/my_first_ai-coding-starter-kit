"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

const signupSchema = z.object({
  displayName: z
    .string()
    .min(3, "Anzeigename muss mindestens 3 Zeichen lang sein")
    .max(30, "Anzeigename darf maximal 30 Zeichen lang sein")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Nur Buchstaben, Zahlen, Unterstriche und Bindestriche erlaubt"
    ),
  email: z.string().email("Bitte gib eine gueltige E-Mail-Adresse ein"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return strength;
}

function getStrengthColor(strength: number, index: number): string {
  if (index >= strength) return "bg-gray-200";
  switch (strength) {
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-gray-200";
  }
}

function getStrengthLabel(strength: number): string {
  switch (strength) {
    case 1:
      return "Schwach";
    case 2:
      return "Mittel";
    case 3:
      return "Gut";
    case 4:
      return "Stark";
    default:
      return "";
  }
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");
  const passwordStrength = getPasswordStrength(passwordValue);

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            display_name: values.displayName,
          },
        },
      });

      if (authError) {
        // Avoid account enumeration: generic message
        setError(
          "Registrierung fehlgeschlagen. Bitte versuche es mit einer anderen E-Mail-Adresse."
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout title="Registrierung erfolgreich">
        <div className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Bitte ueberpruefe deine E-Mails zur Bestaetigung. Wir haben dir
              einen Bestaetigungslink gesendet.
            </AlertDescription>
          </Alert>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Zurueck zur Anmeldung
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Konto erstellen" description="Erstelle ein neues NearBy-Konto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anzeigename</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dein Anzeigename"
                    autoComplete="username"
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
                  <Input
                    type="password"
                    placeholder="Mindestens 8 Zeichen"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                {/* Password strength indicator */}
                {passwordValue && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${getStrengthColor(
                            passwordStrength,
                            index
                          )}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Passworstaerke: {getStrengthLabel(passwordStrength)}
                    </p>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrieren...
              </>
            ) : (
              "Registrieren"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Bereits ein Konto?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Anmelden
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}
