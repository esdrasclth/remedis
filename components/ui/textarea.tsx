import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "bg-ocean-abyss border border-iron-gray rounded-[10px] px-3 py-2 text-[13px] text-pure-white placeholder:text-iron-gray focus:outline-none focus:border-slate-gray transition-colors resize-none",
            error && "border-blaze-orange",
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-blaze-orange">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
