"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  Compass,
  Users,
  Sparkles,
  Trophy,
  ShieldCheck,
  Menu,
  X,
  Calendar,
  Settings,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const navLinks = [
    { href: "/hackathons", label: "Hackathons", icon: Calendar },
    { href: "/matches", label: "Matches", icon: Compass },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/chat", label: "Chat", icon: MessageCircle },
    { href: "/spin", label: "Lucky Spin", icon: Sparkles },
    { href: "/hall-of-fame", label: "Hall of Fame", icon: Trophy },
  ];

  // Derive display name from Supabase user metadata
  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "You";

  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = user?.user_metadata?.role === "admin";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

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
          {isAdmin && (
            <Link href="/admin">
              <Badge variant="black" className="hover:opacity-80 cursor-pointer">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#0A0A0A]/10">
              {/* Settings */}
              <Link
                href="/settings"
                className={cn(
                  "p-2 rounded-[10px] transition-colors",
                  pathname === "/settings"
                    ? "bg-[#B8F2C9] text-[#0A0A0A]"
                    : "text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
                )}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>

              {/* Avatar + name */}
              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-[#0A0A0A] group-hover:underline">
                    {displayName}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-bold text-xs">
                  {initial}
                </div>
              </Link>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="p-2 rounded-[10px] text-[#0A0A0A]/50 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Join {APP_CONFIG.name}
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
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded flex items-center gap-2"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <Link
              href="/waitlist"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> Hyderabad Launch
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleSignOut() }}
                className="text-xs font-semibold text-[#0A0A0A]/60 p-2 hover:bg-[#0A0A0A]/5 rounded flex items-center gap-2 text-left"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-semibold text-[#0A0A0A] p-2 hover:bg-[#0A0A0A]/5 rounded"
              >
                Sign in / Join
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
