import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-[11px] font-medium text-slate-gray uppercase tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "bg-input-bg rounded-[8px] px-3 py-2 text-[13px] text-pure-white focus:outline-none focus:bg-input-focus transition-colors appearance-none cursor-pointer h-9",
            error && "outline outline-1 outline-blaze-orange/60",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[11px] text-blaze-orange">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
