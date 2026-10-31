"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { previewOnly } from "./preview";

/** A button that only announces it isn't wired up yet — for server-rendered pages that have no client state. */
export function PreviewButton({ action, onClick, ...props }: ComponentProps<typeof Button> & { action: string }) {
  return (
    <Button
      type="button"
      onClick={(event) => {
        previewOnly(action);
        onClick?.(event);
      }}
      {...props}
    />
  );
}
