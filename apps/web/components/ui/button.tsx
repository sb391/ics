import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-clay px-5 py-3 text-white shadow-soft hover:bg-[#934722]",
        secondary: "bg-white px-5 py-3 text-ink ring-1 ring-ink/10 hover:bg-sand",
        ghost: "px-4 py-2 text-slate hover:bg-black/5",
        outline: "bg-transparent px-5 py-3 text-ink ring-1 ring-clay/25 hover:bg-clay/5"
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-xs uppercase tracking-[0.16em]",
        lg: "h-12 px-6 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
