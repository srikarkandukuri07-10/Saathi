"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Compass, Users, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/hackathons", label: "Events", icon: Calendar },
    { href: "/matches", label: "Matches", icon: Compass },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/spin", label: "Spin", icon: Sparkles },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-[#0A0A0A]/15 bg-[#FFFFFF]/95 backdrop-blur-lg px-2 flex items-center justify-around safe-area-bottom"
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center min-w-[54px] min-h-[44px] rounded-[10px] py-1 px-2 transition-all",
              isActive
                ? "text-[#0A0A0A] font-bold"
                : "text-[#0A0A0A]/50 hover:text-[#0A0A0A]"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-[8px] transition-colors",
                isActive && "bg-[#B8F2C9] border border-[#0A0A0A]"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
