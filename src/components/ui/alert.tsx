import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertOctagon, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "error" | "success" | "warning" | "info";
  title?: string;
}

export function Alert({
  status = "info",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const getIcon = () => {
    switch (status) {
      case "error":
        return <AlertOctagon className="h-5 w-5 text-[#0A0A0A] shrink-0" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-[#0A0A0A] shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-[#0A0A0A] shrink-0" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-[#0A0A0A] shrink-0" />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "error":
        return "Action Needed";
      case "success":
        return "Success";
      case "warning":
        return "Notice";
      case "info":
      default:
        return "Information";
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-[14px] p-4 border-2 border-[#0A0A0A] bg-[#FFFFFF] text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] flex items-start gap-3.5",
        status === "success" && "bg-[#B8F2C9]/20",
        status === "error" && "bg-[#0A0A0A]/[0.02]",
        className
      )}
      {...props}
    >
      <div className="pt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-[#0A0A0A] uppercase tracking-wider text-xs px-1.5 py-0.5 rounded border border-[#0A0A0A] bg-[#FFFFFF]">
            {getStatusLabel()}
          </span>
          {title && <span className="font-bold text-[#0A0A0A]">{title}</span>}
        </div>
        <div className="text-[#0A0A0A]/80 leading-relaxed font-normal">{children}</div>
      </div>
    </div>
  );
}
