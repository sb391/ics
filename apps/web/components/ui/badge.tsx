import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-clay",
        className
      )}
      {...props}
    />
  );
}
