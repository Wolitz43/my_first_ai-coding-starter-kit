"use client";

import { useState } from "react";
import { MapPin, LogOut, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DashboardContentProps {
  userEmail: string;
  displayName: string | null;
}

export function DashboardContent({ userEmail, displayName }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setIsLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? "Fehler beim Löschen des Kontos.");
        return;
      }
      window.location.href = "/login";
    } catch {
      setDeleteError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md border-0 shadow-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold tracking-tight">NearBy</span>
            </div>
          </div>
          <CardTitle className="text-2xl">
            Willkommen{displayName ? `, ${displayName}` : " bei NearBy"}!
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Angemeldet als <span className="font-medium">{userEmail}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Dein Dashboard wird bald hier verfügbar sein.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
            disabled={isLoading || isDeleting}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Abmelden...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Abmelden
              </>
            )}
          </Button>

          {deleteError && (
            <p className="text-sm text-destructive text-center">{deleteError}</p>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isLoading || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Konto wird gelöscht...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Konto löschen
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Dein Konto und alle
                  zugehörigen Daten werden dauerhaft gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ja, Konto löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
