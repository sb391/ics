import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate/60 focus:border-clay/40 focus:ring-2 focus:ring-clay/10",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
