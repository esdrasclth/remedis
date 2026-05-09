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
          <label htmlFor={id} className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "bg-[#2a2825] rounded-[8px] px-3 py-2 text-[13px] text-white placeholder:text-iron-gray focus:outline-none focus:bg-[#322f2c] transition-colors h-9",
            error && "outline outline-1 outline-blaze-orange/60",
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
