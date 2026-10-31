import { cn } from "@/lib/utils";
import { APP_NAME } from "../constants/brand";

/** The original mark with a transparent dark variant; no surrounding chip. */
export function BrandLogo({ className }: { className?: string }) {
  return <span className={cn("inline-flex shrink-0 items-center justify-center",className)} role="img" aria-label={APP_NAME}>
    {/* eslint-disable-next-line @next/next/no-img-element -- static brand artwork */}
    <img src="/icons/brand/BoSS_Default.svg" alt="" aria-hidden="true" className="h-full w-full dark:hidden" />
    {/* eslint-disable-next-line @next/next/no-img-element -- static brand artwork */}
    <img src="/icons/brand/BoSS_Dark.svg" alt="" aria-hidden="true" className="hidden h-full w-full dark:block" />
  </span>;
}
