import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        {
          "bg-pure-white/10 text-pure-white": variant === "default",
          "bg-emerald-green/15 text-emerald-green": variant === "success",
          "bg-sunbeam-yellow/15 text-sunbeam-yellow": variant === "warning",
          "bg-blaze-orange/15 text-blaze-orange": variant === "danger",
          "bg-deep-sea-blue/15 text-deep-sea-blue": variant === "info",
          "bg-iron-gray/30 text-slate-gray": variant === "muted",
        },
        className
      )}
      {...props}
    />
  );
}
