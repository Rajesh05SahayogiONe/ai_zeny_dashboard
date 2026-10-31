"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ value, label }: { value: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy — select the text instead");
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className="tap-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--search-bg)]"
    >
      <Copy size={15} />
    </button>
  );
}
