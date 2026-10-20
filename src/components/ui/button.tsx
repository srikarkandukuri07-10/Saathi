import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A] focus-visible:ring-offset-2";

    const variantStyles = {
      primary:
        "bg-[#B8F2C9] text-[#0A0A0A] border border-transparent hover:border-[#0A0A0A] hover:shadow-[0_4px_12px_rgba(10,10,10,0.08)] active:translate-y-0 active:scale-[0.98]",
      secondary:
        "bg-[#FFFFFF] text-[#0A0A0A] border-[1.5px] border-[#0A0A0A] hover:bg-[#0A0A0A]/[0.05] active:translate-y-0 active:scale-[0.98]",
      outline:
        "bg-transparent text-[#0A0A0A] border border-[#0A0A0A]/20 hover:border-[#0A0A0A] hover:bg-[#0A0A0A]/[0.03]",
      ghost:
        "bg-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/[0.06] active:bg-[#0A0A0A]/[0.10]",
      link: "bg-transparent text-[#0A0A0A] underline underline-offset-4 hover:opacity-75 p-0 h-auto",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs rounded-[10px] gap-1.5",
      md: "h-11 px-5 text-sm rounded-[12px] gap-2",
      lg: "h-13 px-7 text-base rounded-[14px] gap-2.5",
      icon: "h-11 w-11 rounded-[12px] p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#0A0A0A]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
