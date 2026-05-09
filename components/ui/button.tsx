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
            "bg-sunbeam-yellow text-deep-space-black hover:opacity-90 rounded-[6px]",
          variant === "secondary" &&
            "bg-[#252320] text-[#d4d0cc] border border-[#3d3b38] hover:bg-[#2e2c29] hover:text-white rounded-[6px]",
          variant === "ghost" &&
            "text-slate-gray hover:text-white hover:bg-[#252320] rounded-[6px]",
          variant === "danger" &&
            "bg-[#ff492c]/10 text-blaze-orange border border-[#ff492c]/25 hover:bg-[#ff492c]/20 rounded-[6px]",
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
