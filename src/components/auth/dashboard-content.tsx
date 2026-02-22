"use client";

import { useState } from "react";
import { MapPin, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardContentProps {
  userEmail: string;
  displayName: string | null;
}

export function DashboardContent({ userEmail, displayName }: DashboardContentProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      setIsLoading(false);
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
            disabled={isLoading}
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
        </CardContent>
      </Card>
    </div>
  );
}
