import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-[12px] text-slate-gray uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "bg-ocean-abyss border border-iron-gray rounded-[10px] px-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-slate-gray transition-colors",
            error && "border-blaze-orange focus:border-blaze-orange",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-blaze-orange">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
