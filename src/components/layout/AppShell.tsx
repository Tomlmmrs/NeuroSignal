"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname, searchKey]);

  useEffect(() => {
    if (!navOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        unreadCount={unreadCount}
        mobileNavOpen={navOpen}
        onToggleMobileNav={() => setNavOpen((current) => !current)}
      />
      <div className="flex min-h-[calc(100dvh-4rem)]">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
