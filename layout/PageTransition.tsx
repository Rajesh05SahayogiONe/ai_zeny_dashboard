"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Ported from Setu's PageTransition: fades the page in on navigation and
 * resets the scroll position of the `<main>` it lives in (the shell's page
 * scroller, not the window).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.closest("main")?.scrollTo?.({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <div key={pathname} ref={rootRef} className="page-transition">
      {children}
    </div>
  );
}
