import { notFound } from "next/navigation";
import Link from "next/link";
import { HackathonService } from "@/lib/services/hackathon";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
} from "lucide-react";

interface HackathonDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: HackathonDetailPageProps) {
  const hackathon = await HackathonService.getHackathonBySlug(params.slug);
  if (!hackathon) return { title: "Hackathon Not Found" };
  return {
    title: `${hackathon.name} | Teammates & Teams on ${APP_CONFIG.name}`,
    description: `Find verified teammates and open team slots for ${hackathon.name} (${hackathon.mode}, ${hackathon.city_name}).`,
  };
}

export default async function HackathonDetailPage({ params }: HackathonDetailPageProps) {
  const hackathon = await HackathonService.getHackathonBySlug(params.slug);
  if (!hackathon) {
    notFound();
  }

  // Pre-seeded teams and participants for this event
  const openTeams = [
    {
      id: "t-1",
      name: "Autonomous Agents Lab",
      lead: "Aditya Narang (IIIT Hyderabad)",
      openSlots: [
        { id: "s-1", title: "Need 1 ML / AI Engineer", category: "ml_ai" },
        { id: "s-2", title: "Need 1 Pitch / Product Lead", category: "pitching" },
      ],
      membersCount: 2,
      maxSize: hackathon.max_team_size,
    },
    {
      id: "t-2",
      name: "Hyderabad Smart Grid",
      lead: "Sneha Reddy (CBIT)",
      openSlots: [
        { id: "s-3", title: "Need 1 Backend & PostGIS Dev", category: "backend" },
      ],
      membersCount: 3,
      maxSize: hackathon.max_team_size,
    },
  ];

  const attendeesSeekingTeams = [
    {
      id: "u-1",
      name: "Rohan Kulkarni",
      college: "VNR VJIET",
      role: "Frontend Engineer (Next.js)",
      reliability: 92,
      intensity: "Full Grind",
      matchScore: 94,
    },
    {
      id: "u-2",
      name: "Divya Teja",
      college: "BITS Pilani Hyderabad",
      role: "AI & Computer Vision",
      reliability: 88,
      intensity: "Full Grind",
      matchScore: 91,
    },
    {
      id: "u-3",
      name: "Karan Singhania",
      college: "Osmania University",
      role: "Hardware & IoT",
      reliability: 85,
      intensity: "Serious",
      matchScore: 86,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0A0A0A]/60">
          <Link href="/hackathons" className="hover:underline">
            &larr; Back to Directory
          </Link>
          <span>/</span>
          <span className="text-[#0A0A0A]">{hackathon.name}</span>
        </div>

        {/* Hero Header */}
        <div className="rounded-[22px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-6 sm:p-8 shadow-[6px_6px_0px_#0A0A0A] relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#0A0A0A]/10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={hackathon.mode === "offline" ? "green" : "subtle"}>
                  <span className="capitalize">{hackathon.mode}</span> &bull; {hackathon.city_name}
                </Badge>
                <Badge variant="black">
                  {hackathon.min_team_size === hackathon.max_team_size
                    ? `${hackathon.min_team_size} Members Required`
                    : `${hackathon.min_team_size}-${hackathon.max_team_size} Members`}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {hackathon.name}
              </h1>
              <p className="text-sm font-semibold text-[#0A0A0A]/70 mt-1">
                Organized by {hackathon.organizer}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a href={hackathon.website_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  Official Website <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </a>
              <Link href={`/matches?hackathonId=${hackathon.id}`}>
                <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
                  <Sparkles className="h-4 w-4 mr-1.5" /> Match Teammates
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
            <div>
              <span className="text-[#0A0A0A]/60 block mb-0.5">Registration Deadline:</span>
              <span className="font-extrabold text-[#0A0A0A] text-sm">
                {new Date(hackathon.registration_deadline).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-[#0A0A0A]/60 block mb-0.5">Prize Pool:</span>
              <span className="font-extrabold text-[#0A0A0A] text-sm">
                {hackathon.prize_pool || "TBA"}
              </span>
            </div>
            <div>
              <span className="text-[#0A0A0A]/60 block mb-0.5">Registered on {APP_CONFIG.name}:</span>
              <span className="font-extrabold text-[#0A0A0A] text-sm">
                {hackathon.participant_count} builders
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#0A0A0A]/10 text-sm leading-relaxed text-[#0A0A0A]/80">
            {hackathon.description}
          </div>
        </div>

        {/* Action Bar: Create Team vs Lucky Spin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-[#0A0A0A] bg-[#B8F2C9]/20 flex items-center justify-between p-5">
            <div>
              <h3 className="font-bold text-base text-[#0A0A0A]">Have an idea? Build a squad.</h3>
              <p className="text-xs text-[#0A0A0A]/70 mt-0.5">
                Post open role slots (e.g. Need 1 ML, 1 Frontend) and review applicants.
              </p>
            </div>
            <Link href={`/teams/new?hackathonId=${hackathon.id}`}>
              <Button variant="primary" size="sm" className="shrink-0 font-bold shadow-[2px_2px_0px_#0A0A0A]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Team
              </Button>
            </Link>
          </Card>

          <Card className="border-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between p-5">
            <div>
              <h3 className="font-bold text-base text-[#0A0A0A]">Lucky Spin (&ldquo;Mystery Teammate&rdquo;)</h3>
              <p className="text-xs text-[#0A0A0A]/70 mt-0.5">
                Randomly pick a high-compatibility attendee for {hackathon.name}.
              </p>
            </div>
            <Link href={`/spin?hackathonId=${hackathon.id}`}>
              <Button variant="secondary" size="sm" className="shrink-0 font-bold">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Spin Teammate
              </Button>
            </Link>
          </Card>
        </div>

        {/* Teams Looking for Members */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Teams with Open Role Slots
              </h2>
              <p className="text-xs text-[#0A0A0A]/60">
                Join an existing team preparing for this hackathon
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openTeams.map((team) => (
              <Card key={team.id} className="border-2 border-[#0A0A0A] space-y-4 shadow-[3px_3px_0px_#0A0A0A]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">{team.name}</h3>
                    <p className="text-xs text-[#0A0A0A]/60">Lead: {team.lead}</p>
                  </div>
                  <Badge variant="subtle" size="sm">
                    {team.membersCount}/{team.maxSize} Members
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/60 block">
                    Needed Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.openSlots.map((slot) => (
                      <Badge key={slot.id} variant="green" size="sm">
                        {slot.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#0A0A0A]/10 flex justify-end">
                  <Link href={`/teams`}>
                    <Button variant="secondary" size="sm">
                      Apply for Slot &rarr;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Attendees Seeking Teams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Builders Seeking Teams
              </h2>
              <p className="text-xs text-[#0A0A0A]/60">
                Ranked by algorithmic compatibility with your profile
              </p>
            </div>
            <Link href={`/matches?hackathonId=${hackathon.id}`} className="text-xs font-bold underline">
              View All Compatibility Cards &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {attendeesSeekingTeams.map((user) => (
              <Card key={user.id} className="border-2 border-[#0A0A0A] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="green" size="sm">
                      {user.matchScore}% Match
                    </Badge>
                    <span className="text-xs font-bold tabular-nums">
                      {user.reliability}/100 Trust
                    </span>
                  </div>
                  <h4 className="font-bold text-base">{user.name}</h4>
                  <p className="text-xs text-[#0A0A0A]/60">{user.college}</p>
                  <p className="text-xs font-medium text-[#0A0A0A] mt-2">{user.role}</p>
                </div>

                <div className="pt-3 border-t border-[#0A0A0A]/10 mt-3">
                  <Link href={`/matches`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Request Teammate
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
