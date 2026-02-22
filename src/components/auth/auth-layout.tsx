import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Logo and Tagline */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-2xl font-bold tracking-tight">NearBy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Entdecke, was in deiner N&auml;he passiert
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="space-y-1 pb-4">
            {title && (
              <h1 className="text-xl font-semibold tracking-tight text-center">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground text-center">
                {description}
              </p>
            )}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
