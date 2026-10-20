import Link from "next/link";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { listHackathons } from "@/lib/data/hackathons";
import { getCityWaitlistStats } from "@/lib/data/waitlist";
import { getPlatformStats } from "@/lib/data/notifications";
import {
  Calendar,
  Compass,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  Users,
} from "lucide-react";

function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return "Registration closed";
  if (days === 0) return "Closes today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

export default async function HomePage() {
  const launchCityId = "c0000000-0000-0000-0000-000000000001";

  const [hackathons, waitlist, stats] = await Promise.all([
    listHackathons(null),
    getCityWaitlistStats(launchCityId),
    getPlatformStats(),
  ]);

  const featured = hackathons.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative border-b border-[#0A0A0A]/10 bg-[#FFFFFF] px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] px-3.5 py-1 text-xs font-bold text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch City: {APP_CONFIG.initialCity} Chapter Active</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0A0A0A] max-w-4xl mx-auto leading-[1.1]">
            Stop gambling on random Discord chats. Build serious hackathon teams.
          </h1>

          <p className="text-lg sm:text-xl text-[#0A0A0A]/70 max-w-2xl mx-auto font-normal leading-relaxed">
            {APP_CONFIG.name} matches dedicated collegiate builders for major{" "}
            <strong>external hackathons</strong> using skill complementarity, verified commits, and locked commitments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold text-base shadow-[4px_4px_0px_#0A0A0A]">
                Join Hyderabad Chapter <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/hackathons" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto font-bold text-base">
                Explore External Hackathons
              </Button>
            </Link>
          </div>

          {/* Hyderabad Cold Start Banner */}
          <div className="mt-12 max-w-xl mx-auto rounded-[18px] border-2 border-[#0A0A0A] bg-[#B8F2C9]/30 p-5 shadow-[4px_4px_0px_#0A0A0A] text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0A0A0A] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Hyderabad Waitlist Milestone
                </span>
              </div>
              <Badge variant="black" size="sm">
                {waitlist.currentCount} / {waitlist.targetCount} Joined
              </Badge>
            </div>
            <p className="text-xs text-[#0A0A0A]/80 mb-3">
              Matching pool unlocks across Hyderabad as soon as {waitlist.targetCount} verified builders join. Invite driven peers to fast-track matching.
            </p>
            <Progress
              value={waitlist.currentCount}
              max={waitlist.targetCount}
              showPercentage={false}
            />
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-[#0A0A0A]">
              <span>
                {waitlist.remaining} spot{waitlist.remaining === 1 ? "" : "s"} left for Founding Badge
              </span>
              <Link href="/waitlist" className="underline hover:opacity-75">
                Share Referral Link &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Hackathons Calendar Feed (Immediate Cold-Start Value) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#0A0A0A]/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-[#0A0A0A]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60">
                  External Hackathons Directory
                </span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                Upcoming Hackathons in Focus
              </h2>
            </div>
            <Link href="/hackathons">
              <Button variant="outline" size="sm">
                View All Events & Filters &rarr;
              </Button>
            </Link>
          </div>

          {featured.length === 0 ? (
            <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
              <CardContent>
                <h3 className="text-lg font-bold">No events published yet</h3>
                <p className="text-xs text-[#0A0A0A]/70 mt-2 max-w-md mx-auto leading-relaxed">
                  The external hackathon directory is empty. Published events appear
                  here with their registration deadline, prize pool and team size.
                </p>
                <div className="mt-5">
                  <Link href="/hackathons">
                    <Button variant="secondary" size="sm" className="font-bold">
                      Open the directory
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((hackathon) => (
                <Card
                  key={hackathon.id}
                  variant="interactive"
                  className="flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge variant="green" size="sm">
                        {daysUntil(hackathon.registration_deadline)}
                      </Badge>
                      <span className="text-xs font-bold text-[#0A0A0A]">
                        {hackathon.min_team_size}-{hackathon.max_team_size} members
                      </span>
                    </div>

                    <CardTitle className="text-xl mb-1">{hackathon.name}</CardTitle>
                    <p className="text-xs text-[#0A0A0A]/60 mb-3 font-medium">
                      {hackathon.organizer}
                    </p>
                    <p className="text-xs text-[#0A0A0A]/80 line-clamp-2 mb-4">
                      {hackathon.theme}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#0A0A0A]/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#0A0A0A]/60">Prize Pool:</span>
                      <span className="font-bold text-[#0A0A0A]">
                        {hackathon.prize_pool ?? "To be announced"}
                      </span>
                    </div>
                    <Link
                      href={`/hackathons/${hackathon.slug}`}
                      className="block w-full"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        Find Teammates for This
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. The 4 Trust Pillars */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#0A0A0A]/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Engineered for Serious Competitors
            </h2>
            <p className="mt-3 text-base text-[#0A0A0A]/70">
              Why finding a team on {APP_CONFIG.name} eliminates the friction of random group chats.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
              <div className="h-10 w-10 rounded-[12px] bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center mb-4">
                <Compass className="h-5 w-5 text-[#0A0A0A]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Skill Complementarity</h3>
              <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                Matches are weighted by gap filling. If your team has ML & frontend, you are paired with backend or IoT engineers.
              </p>
            </Card>

            <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
              <div className="h-10 w-10 rounded-[12px] bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-[#0A0A0A]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Proof & Trust Badges</h3>
              <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                GitHub commit stats, college email confirmation, and verifiable Devfolio/Devpost win links.
              </p>
            </Card>

            <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
              <div className="h-10 w-10 rounded-[12px] bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center mb-4">
                <Lock className="h-5 w-5 text-[#0A0A0A]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Anti-Ghosting Lock</h3>
              <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                Teams lock in with explicit member confirmation before submission. Completing hackathons increases reliability scores.
              </p>
            </Card>

            <Card className="border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
              <div className="h-10 w-10 rounded-[12px] bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-[#0A0A0A]" />
              </div>
              <h3 className="text-lg font-bold mb-2">Mutual Accept Chat</h3>
              <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                No unsolicited DMs or spam. Chat rooms unlock strictly after both hackers agree to connect.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Live platform counters */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-[#0A0A0A]/10 bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Live network, counted from the database
            </h2>
            <p className="mt-2 text-sm text-[#0A0A0A]/70">
              No placeholder numbers: every figure below is a live row count.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Published hackathons", value: stats.hackathons },
              { label: "Onboarded builders", value: stats.builders },
              { label: "Squads formed", value: stats.teams },
              { label: "Active city chapters", value: stats.cities },
            ].map((stat) => (
              <Card key={stat.label} className="border-2 border-[#0A0A0A] text-center">
                <CardContent>
                  <div className="text-3xl font-black tabular-nums text-[#0A0A0A]">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-[#0A0A0A]/60 mt-1">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer with India DPDP & Legal Compliance */}
      <footer className="border-t-2 border-[#0A0A0A] bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center font-bold text-xs">
                H
              </div>
              <span className="font-extrabold text-base">{APP_CONFIG.name}</span>
            </div>
            <p className="text-xs text-[#0A0A0A]/60 mt-1 max-w-sm">
              The external hackathon teammate network for students across India. Cold-start active in Hyderabad.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-semibold text-[#0A0A0A]">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/dpdp" className="hover:underline">
              India DPDP Rights & Consent
            </Link>
            <Link href="/design" className="hover:underline">
              Style Guide (/design)
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-8 pt-6 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#0A0A0A]/50">
          <span>&copy; {new Date().getFullYear()} {APP_CONFIG.name} ({APP_CONFIG.codeName}). All rights reserved.</span>
          <span>Grievance Officer: {APP_CONFIG.grievanceOfficer.email}</span>
        </div>
      </footer>
    </div>
  );
}
