"use client";

import { toast } from "sonner";

/** The Boss Bridge screens are UI only: actions that would hit a backend say so instead of faking success. */
export function previewOnly(action: string) {
  toast(`${action} isn't connected yet`, { description: "This is a UI preview." });
}
