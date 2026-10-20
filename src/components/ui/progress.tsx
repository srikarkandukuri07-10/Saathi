import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
}

export function Progress({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#0A0A0A]">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums">{percentage}%</span>}
        </div>
      )}
      <div className="relative h-3 w-full overflow-hidden rounded-full border border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.05]">
        <div
          className="h-full bg-[#B8F2C9] border-r border-[#0A0A0A] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
