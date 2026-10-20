import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "green" | "black" | "interactive";
}

export function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-[#FFFFFF] text-[#0A0A0A] border border-[#0A0A0A]/12 shadow-[0_2px_12px_rgba(10,10,10,0.03)]",
    green: "bg-[#B8F2C9] text-[#0A0A0A] border border-[#0A0A0A]/15 shadow-[0_4px_16px_rgba(10,10,10,0.05)]",
    black: "bg-[#0A0A0A] text-[#FFFFFF] border border-[#0A0A0A] shadow-[0_6px_20px_rgba(10,10,10,0.15)]",
    interactive:
      "bg-[#FFFFFF] text-[#0A0A0A] border border-[#0A0A0A]/12 hover:border-[#0A0A0A] hover:shadow-[0_8px_24px_rgba(10,10,10,0.08)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
  };

  return (
    <div
      className={cn("rounded-[18px] p-6 transition-all duration-200", variantStyles[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-bold tracking-tight leading-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm opacity-65 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4 border-t border-[#0A0A0A]/8 mt-4", className)}
      {...props}
    />
  );
}
