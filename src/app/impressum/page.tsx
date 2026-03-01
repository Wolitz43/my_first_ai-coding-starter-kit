import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Impressum – NearByMe24",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
          <span className="font-semibold">Impressum</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-sm text-foreground">
        <section>
          <h1 className="text-2xl font-bold mb-1">Impressum</h1>
          <p className="text-muted-foreground">Angaben gemäß § 5 TMG</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-base">Betreiber</h2>
          <p>[Arnd Stielow]</p>
          <p>[Stobäusplatz 2]</p>
          <p>[93047] [Regensburg]</p>
          <p>[Deutschland]</p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-base">Kontakt</h2>
          <p>
            E-Mail:{"arnd.stielow@onlinehome.de"}
            <a
              href="mailto:[deine@email.de]"
              className="underline underline-offset-2 hover:text-primary"
            >
              [deine@email.de]
            </a>
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold text-base">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p>[Arnd Stielow]</p>
          <p>[Adresse wie oben]</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Haftungsausschluss</h2>
          <p className="text-muted-foreground leading-relaxed">
            Die Inhalte dieser Seite wurden mit größter Sorgfalt erstellt. Für die
            Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine
            Gewähr übernommen werden. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG
            für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
            verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch
            nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-base">Kartendaten</h2>
          <p className="text-muted-foreground leading-relaxed">
            Diese Anwendung verwendet Kartendaten von{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              OpenStreetMap
            </a>{" "}
            (© OpenStreetMap-Mitwirkende, ODbL-Lizenz) sowie den
            Geocodierungsdienst{" "}
            <a
              href="https://nominatim.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary"
            >
              Nominatim
            </a>
            .
          </p>
        </section>

        <p className="text-xs text-muted-foreground pt-4 border-t">
          Bitte ersetze die Platzhalter in eckigen Klammern mit deinen echten Angaben,
          bevor du diese Seite veröffentlichst.
        </p>
      </main>
    </div>
  );
}
