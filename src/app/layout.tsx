import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearBy - Entdecke, was in deiner Naehe passiert",
  description: "NearBy hilft dir, Events und Inhalte in deiner Umgebung zu entdecken.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
