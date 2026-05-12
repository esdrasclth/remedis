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
          "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-sunbeam-yellow text-charcoal-black hover:opacity-90 rounded-[6px]",
          variant === "secondary" &&
            "bg-hover-bg text-slate-gray hover:bg-[var(--surface-input-focus)] hover:text-pure-white rounded-[6px]",
          variant === "ghost" &&
            "text-slate-gray hover:text-pure-white hover:bg-hover-bg rounded-[6px]",
          variant === "danger" &&
            "bg-[#ff492c]/10 text-blaze-orange hover:bg-[#ff492c]/20 rounded-[6px]",
          size === "sm" && "text-[12px] px-3 py-1.5 h-7",
          size === "md" && "text-[13px] px-4 py-2 h-8",
          size === "lg" && "text-[14px] px-5 py-2.5 h-10",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
