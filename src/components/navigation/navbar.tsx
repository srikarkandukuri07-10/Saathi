"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Users,
  Sparkles,
  Trophy,
  ShieldCheck,
  User,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    role: string;
    completeness: number;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "/hackathons", label: "Hackathons", icon: Calendar },
    { href: "/matches", label: "Matches", icon: Compass },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/spin", label: "Lucky Spin", icon: Sparkles },
    { href: "/hall-of-fame", label: "Hall of Fame", icon: Trophy },
    { href: "/waitlist", label: "Hyderabad Launch", icon: Sparkles },
  ];

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#0A0A0A]/10 bg-[#FFFFFF]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#B8F2C9] border border-[#0A0A0A] font-bold text-base text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
              H
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#0A0A0A]">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0A0A0A]/50 -mt-1">
                External Hackathons
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold tracking-wide transition-all",
                    isActive
                      ? "bg-[#B8F2C9] text-[#0A0A0A] border border-[#0A0A0A]"
                      : "text-[#0A0A0A]/70 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/[0.04]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA / User State */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/design" className="text-xs font-medium text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:underline">
            Design Guide
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <Badge variant="black" className="hover:opacity-80 cursor-pointer">
                <ShieldCheck className="h-3 w-3" />
                Admin Panel
              </Badge>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-[#0A0A0A]/10">
              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-[#0A0A0A] group-hover:underline">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-[#0A0A0A]/60">
                    <span>Profile:</span>
                    <span className="font-bold text-[#0A0A0A]">
                      {user.completeness}%
                    </span>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="primary" size="sm">
                  Join Hackpact
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-[10px] border border-[#0A0A0A]/20 text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b-2 border-[#0A0A0A] bg-[#FFFFFF] px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-[12px] text-xs font-semibold border",
                    isActive
                      ? "bg-[#B8F2C9] text-[#0A0A0A] border-[#0A0A0A]"
                      : "bg-[#FFFFFF] border-[#0A0A0A]/15 text-[#0A0A0A]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#0A0A0A]/10 flex flex-col gap-2">
            <Link
              href="/design"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded"
            >
              🎨 View Design Tokens & Style Guide (/design)
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Concierge & Tools
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
