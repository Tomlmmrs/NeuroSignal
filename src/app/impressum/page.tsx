import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="mb-8 text-2xl font-semibold text-foreground">Impressum</h1>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Angaben gem&auml;&szlig; &sect;5 TMG
            </h2>
            <p>
              Tom Lammers
              <br />
              E-Mail: tomlmmrs.work@gmail.com
              <br />
              Adresse: Auf Anfrage
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">Hinweis</h2>
            <p>
              Dieses Projekt ist ein nicht-kommerzielles Informationsangebot.
              Es dient der Aggregation und Aufbereitung &ouml;ffentlich zug&auml;nglicher
              Informationen aus dem Bereich K&uuml;nstliche Intelligenz.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Haftung f&uuml;r Inhalte
            </h2>
            <p>
              Die Inhalte dieser Seite wurden mit gr&ouml;&szlig;ter Sorgfalt erstellt.
              F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der
              Inhalte kann jedoch keine Gew&auml;hr &uuml;bernommen werden.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Haftung f&uuml;r Links
            </h2>
            <p>
              Diese Seite enth&auml;lt Links zu externen Websites Dritter, auf deren
              Inhalte kein Einfluss besteht. F&uuml;r die Inhalte der verlinkten Seiten
              ist stets der jeweilige Anbieter verantwortlich.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
