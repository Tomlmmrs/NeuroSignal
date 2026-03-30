import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="mb-8 text-2xl font-semibold text-foreground">
          Datenschutzerkl&auml;rung / Privacy Policy
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">Overview</h2>
            <p>
              NeuroSignal is a non-commercial AI news aggregation project. We collect as
              little personal data as possible. This page explains what data is processed
              when you use this website.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">Hosting</h2>
            <p>
              This website is hosted on{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                Vercel
              </a>
              . When you visit this site, Vercel may collect standard server log data
              including your IP address, browser type, and the pages you visit. This data
              is processed to deliver the website and ensure its security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">Analytics</h2>
            <p>
              This site uses{" "}
              <a
                href="https://vercel.com/docs/analytics/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                Vercel Web Analytics
              </a>
              , a privacy-friendly analytics service that does not use cookies and does
              not collect personal data. It provides aggregated, anonymized usage
              statistics only.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              External content
            </h2>
            <p>
              This site links to external websites (news articles, research papers,
              GitHub repositories). When you follow these links, the respective third
              party&apos;s privacy policy applies. We have no control over the data
              collected by external sites.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Cookies
            </h2>
            <p>
              This site does not set cookies for tracking or advertising purposes.
              A functional cookie may be used for admin authentication only.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium text-foreground">
              Your rights (GDPR)
            </h2>
            <p>
              Under the EU General Data Protection Regulation, you have the right to
              access, rectify, or delete any personal data we may hold. You also have the
              right to data portability and the right to lodge a complaint with a
              supervisory authority. Since we do not collect personal data beyond server
              logs, these rights are largely satisfied by default.
            </p>
            <p className="mt-2">
              For any questions, contact:{" "}
              <span className="text-foreground">
                tomlmmrs.work@gmail.com
              </span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
