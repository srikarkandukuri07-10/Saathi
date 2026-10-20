"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Github, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [magicLinkSent, setMagicLinkSent] = React.useState(false);

  const handleOAuthLogin = (provider: "github" | "google") => {
    setIsLoading(true);
    // In dev / demo environment, fast-track to onboarding/dashboard
    setTimeout(() => {
      router.push("/onboarding");
    }, 600);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setMagicLinkSent(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-[12px] bg-[#B8F2C9] border-2 border-[#0A0A0A] flex items-center justify-center font-black text-lg text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
            H
          </div>
          <span className="text-2xl font-black tracking-tight">{APP_CONFIG.name}</span>
        </Link>
        <p className="text-sm text-[#0A0A0A]/70">
          Find serious teammates for external hackathons
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Connect with GitHub to pull your verified repositories & commit stats.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full font-bold shadow-[2px_2px_0px_#0A0A0A]"
                onClick={() => handleOAuthLogin("github")}
                isLoading={isLoading}
              >
                <Github className="h-4 w-4 mr-2" /> Continue with GitHub (Recommended)
              </Button>

              <Button
                variant="secondary"
                className="w-full font-bold"
                onClick={() => handleOAuthLogin("google")}
                isLoading={isLoading}
              >
                Continue with Google
              </Button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-[#0A0A0A]/15" />
              <span className="absolute bg-[#FFFFFF] px-3 text-xs uppercase font-bold tracking-wider text-[#0A0A0A]/40">
                Or passwordless email
              </span>
            </div>

            {magicLinkSent ? (
              <Alert status="success" title="Check your inbox">
                We sent a secure sign-in link to <strong>{email}</strong>. Click it to log in immediately.
              </Alert>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  label="College or Personal Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu.in"
                  helperText="Use your college email if you have one to claim a verified student badge."
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full font-bold"
                  isLoading={isLoading}
                >
                  <Mail className="h-4 w-4 mr-2" /> Send Magic Link
                </Button>
              </form>
            )}

            <div className="pt-4 border-t border-[#0A0A0A]/10 text-center text-xs text-[#0A0A0A]/60 leading-relaxed">
              By proceeding, you agree to the{" "}
              <Link href="/terms" className="underline font-semibold text-[#0A0A0A]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/dpdp" className="underline font-semibold text-[#0A0A0A]">
                DPDP Privacy Consent
              </Link>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
