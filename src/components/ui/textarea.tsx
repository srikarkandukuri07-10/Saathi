import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-[#0A0A0A] flex items-center justify-between"
          >
            <span>{label}</span>
            {props.required && <span className="text-xs opacity-60">Required</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "flex min-h-[90px] w-full rounded-[12px] border bg-[#FFFFFF] p-3 text-sm text-[#0A0A0A] placeholder:text-[#0A0A0A]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-2 border-[#0A0A0A] bg-[#0A0A0A]/[0.02]"
              : "border-[#0A0A0A]/20 hover:border-[#0A0A0A]/40 focus:border-[#0A0A0A]",
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-[#0A0A0A]/60">{helperText}</p>
        )}
        {error && (
          <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-[#0A0A0A]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0A0A0A]" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
