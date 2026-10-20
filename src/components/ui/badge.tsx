import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "green" | "black" | "outline" | "subtle";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "green",
  size = "md",
  ...props
}: BadgeProps) {
  const variantStyles = {
    green: "bg-[#B8F2C9] text-[#0A0A0A] border border-[#0A0A0A]/20 font-medium",
    black: "bg-[#0A0A0A] text-[#FFFFFF] border border-[#0A0A0A] font-medium",
    outline: "bg-transparent text-[#0A0A0A] border border-[#0A0A0A] font-medium",
    subtle: "bg-[#0A0A0A]/[0.06] text-[#0A0A0A] border border-transparent font-normal",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs rounded-full",
    md: "px-2.5 py-1 text-xs rounded-full",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
