import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Intelligence",
  description: "AI intelligence dashboard — stay ahead of the curve",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
