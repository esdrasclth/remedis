import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-sunbeam-yellow text-deep-space-black hover:opacity-90 rounded-[4px]":
              variant === "primary",
            "bg-ocean-abyss text-pure-white border border-iron-gray hover:border-slate-gray rounded-[4px]":
              variant === "secondary",
            "text-slate-gray hover:text-pure-white":
              variant === "ghost",
            "bg-blaze-orange/10 text-blaze-orange border border-blaze-orange/30 hover:bg-blaze-orange/20 rounded-[4px]":
              variant === "danger",
          },
          {
            "text-[12px] px-3 py-1.5": size === "sm",
            "text-[13px] px-4 py-2": size === "md",
            "text-[14px] px-5 py-2.5": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
