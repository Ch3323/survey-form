"use client";

import { cn } from "@/lib/utils";

type ChoiceButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function ChoiceButton({ label, selected, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "min-h-10 rounded-lg border px-3 py-2 text-left text-sm shadow-sm transition focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:outline-none",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary hover:text-primary",
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
