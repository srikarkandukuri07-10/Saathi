"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/site";
import { Check, ShieldCheck, Sparkles, Terminal, Copy } from "lucide-react";

export default function DesignSystemPage() {
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0A0A0A] pb-24">
      {/* Header */}
      <section className="border-b border-[#0A0A0A]/10 bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="green">Strict 3-Color Standard</Badge>
            <Badge variant="outline">WCAG AA Compliant</Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {APP_CONFIG.name} Living Design System
          </h1>
          <p className="mt-3 text-lg text-[#0A0A0A]/70 max-w-3xl">
            A brutalist, high-craft, monochromatic-plus-mint system built with exactly <strong>three colors</strong>:
            Light Green (<code className="bg-[#B8F2C9] px-1.5 py-0.5 rounded font-mono text-sm border border-[#0A0A0A]/20">#B8F2C9</code>),
            Black (<code className="bg-[#0A0A0A] text-[#FFFFFF] px-1.5 py-0.5 rounded font-mono text-sm">#0A0A0A</code>), and
            White (<code className="border border-[#0A0A0A]/20 px-1.5 py-0.5 rounded font-mono text-sm">#FFFFFF</code>).
            Zero foreign hues allowed.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* 1. Color Tokens */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">1. Primitive Color Tokens</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Click any token swatch to copy hex code to clipboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Light Green */}
            <div
              onClick={() => copyToClipboard("#B8F2C9")}
              className="group cursor-pointer rounded-[18px] border-2 border-[#0A0A0A] bg-[#B8F2C9] p-6 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  --green
                </span>
                <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </div>
              <div className="text-3xl font-extrabold text-[#0A0A0A]">#B8F2C9</div>
              <p className="text-xs text-[#0A0A0A]/80 mt-1 font-medium">
                Primary highlights, action buttons, completeness meters, active badges
              </p>
            </div>

            {/* Black */}
            <div
              onClick={() => copyToClipboard("#0A0A0A")}
              className="group cursor-pointer rounded-[18px] border-2 border-[#0A0A0A] bg-[#0A0A0A] p-6 text-[#FFFFFF] shadow-[4px_4px_0px_rgba(10,10,10,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_rgba(10,10,10,0.3)] transition-all"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFFFFF]/70">
                  --black
                </span>
                <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </div>
              <div className="text-3xl font-extrabold">#0A0A0A</div>
              <p className="text-xs text-[#FFFFFF]/80 mt-1 font-medium">
                Typography, high-contrast borders, solid shadows, dominant outlines
              </p>
            </div>

            {/* White */}
            <div
              onClick={() => copyToClipboard("#FFFFFF")}
              className="group cursor-pointer rounded-[18px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-6 shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0A0A0A] transition-all"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  --white
                </span>
                <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100" />
              </div>
              <div className="text-3xl font-extrabold text-[#0A0A0A]">#FFFFFF</div>
              <p className="text-xs text-[#0A0A0A]/70 mt-1 font-medium">
                Dominant surface, clean cards, modal sheets (~70% of UI canvas)
              </p>
            </div>
          </div>

          {copiedToken && (
            <div className="text-xs font-semibold text-[#0A0A0A] flex items-center gap-1.5 animate-pulse">
              <Check className="h-4 w-4" /> Copied {copiedToken} to clipboard!
            </div>
          )}
        </section>

        {/* 2. Button System */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">2. Button Hierarchy & States</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Interactive states with confident borders, micro-elevation, and loading spinners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>All 5 primary interactive button styles</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Green</Button>
                <Button variant="secondary">Secondary White</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Style</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sizes & Interactive States</CardTitle>
                <CardDescription>Sizes, loading spinner, and disabled contrast</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium Default</Button>
                <Button size="lg">Large Hero</Button>
                <Button isLoading>Processing</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. Non-Color State Communication (Alerts & Errors) */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">3. State Messaging (No Red/Yellow Hues)</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Crucial: Notice how errors and warnings are communicated with bold 2px borders, brutalist shadow, explicit status tags, and sharp iconography without violating the 3-color palette.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert status="error" title="Profile Verification Required">
              You must link your verified GitHub profile and achieve at least 80% completeness before joining hackathon team matching.
            </Alert>

            <Alert status="success" title="Match Request Accepted">
              Arjun accepted your request for Smart India Hackathon. Mutual chat room is now unlocked!
            </Alert>

            <Alert status="warning" title="Team Lock Deadline Approaching">
              The external registration deadline for HackHyderabad closes in 48 hours. Ensure all members confirm team lock.
            </Alert>

            <Alert status="info" title="Hyderabad Cold-Start Waitlist Active">
              Matching unlocks automatically once 50 serious builders in Hyderabad complete their profiles (Currently 23/50).
            </Alert>
          </div>
        </section>

        {/* 4. Badges & Progress Indicators */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">4. Badges, Skills & Progress Meters</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Profile completeness threshold (80% gate) and city cold-start progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill & Role Badges</CardTitle>
                <CardDescription>Categorized tag pills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="green">ML & AI (Proficiency 5/5)</Badge>
                  <Badge variant="black">Team Lead</Badge>
                  <Badge variant="outline">Hyderabad Hub</Badge>
                  <Badge variant="subtle">Full 24h Grind</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="green">GitHub Verified (42 Repos)</Badge>
                  <Badge variant="outline">Reliability: 94/100</Badge>
                  <Badge variant="subtle">SIH Finalist 2025</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Meters</CardTitle>
                <CardDescription>Profile gate meter and city waitlist indicator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Progress
                  value={85}
                  label="Profile Completeness (Matching Unlocked at 80%)"
                />
                <Progress
                  value={23}
                  max={50}
                  label="Hyderabad Waitlist (23/50 Joined - 27 Left)"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. Form Elements */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">5. Form Inputs & Textareas</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Form controls with generous touch targets (min 44px), clear focus rings, and inline error tags.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Input States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Ananya Rao"
                  helperText="Your official name as shown on college ID"
                  required
                />
                <Input
                  label="LinkedIn URL"
                  defaultValue="https://linkedin.com/in/"
                  required
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validation & Error State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="GitHub Profile URL"
                  defaultValue="invalid-url"
                  error="Please enter a valid GitHub profile URL (e.g. https://github.com/username)"
                  required
                />
                <Textarea
                  label="Hackathon Motivation & Bio"
                  placeholder="What drives you to compete? Mention past projects, favorite stacks, and work style..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 6. Cards & Layout Surfaces */}
        <section className="space-y-6">
          <div className="border-b border-[#0A0A0A]/10 pb-3">
            <h2 className="text-2xl font-bold tracking-tight">6. Card Surfaces & Elevation</h2>
            <p className="text-sm text-[#0A0A0A]/60">
              Generous 18-20px radius cards with subtle borders and micro-elevation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <Badge variant="subtle" className="w-fit mb-2">Default Card</Badge>
                <CardTitle>Smart India Hackathon</CardTitle>
                <CardDescription>Offline in Hyderabad</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[#0A0A0A]/70">
                White surface with soft 12% black border and subtle 2px drop shadow.
              </CardContent>
            </Card>

            <Card variant="green">
              <CardHeader>
                <Badge variant="black" className="w-fit mb-2">Green Accent</Badge>
                <CardTitle>94% Match Compatibility</CardTitle>
                <CardDescription>Complementary Skillset</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[#0A0A0A]">
                Light green background for high-priority compatibility cards and match highlights.
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <Badge variant="green" className="w-fit mb-2">Interactive Card</Badge>
                <CardTitle>Hover Me</CardTitle>
                <CardDescription>Micro-lift on hover</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[#0A0A0A]/70">
                Transforms with subtle -2px lift and 8px shadow expansion on hover.
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
