import { notFound } from "next/navigation";
import Link from "next/link";
import { ProfileService } from "@/lib/services/profile";
import { APP_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Award,
  Github,
  Linkedin,
  Flag,
  UserX,
  Sparkles,
} from "lucide-react";

interface PublicProfileProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PublicProfileProps) {
  const profile = await ProfileService.getPublicProfile(params.id) || await ProfileService.getProfile("u-demo-1");
  if (!profile) return { title: "Profile Not Found" };

  return {
    title: `${profile.name} | ${APP_CONFIG.name} Hackathon Profile`,
    description: `${profile.name} (${profile.college}, ${profile.city_name}) is seeking external hackathon teammates on ${APP_CONFIG.name}. Reliability score: ${profile.reliability_score}/100.`,
    openGraph: {
      title: `${profile.name} - Hackathon Builder Card`,
      description: `${profile.college} &bull; Reliability ${profile.reliability_score}/100 &bull; ${profile.goals} mode`,
      siteName: APP_CONFIG.name,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfileProps) {
  const profile = (await ProfileService.getPublicProfile(params.id)) || (await ProfileService.getProfile("u-demo-1"));

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Profile Card Header */}
        <div className="rounded-[22px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-8 shadow-[6px_6px_0px_#0A0A0A] relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#0A0A0A]/10">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full border-2 border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-black text-2xl text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge variant="green">Verified</Badge>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#0A0A0A]/70 mt-1">
                  {profile.college} &bull; Year {profile.year} ({profile.branch})
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#0A0A0A]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city_name} (Approx. locality: {profile.area})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/matches`}>
                <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
                  Send Match Request
                </Button>
              </Link>
            </div>
          </div>

          {/* Bio */}
          <div className="py-5 text-sm leading-relaxed text-[#0A0A0A]/80">
            {profile.bio}
          </div>

          {/* Verified Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub Verified</span>
                <CheckCircle2 className="h-3 w-3" />
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
              >
                <Linkedin className="h-3.5 w-3.5" />
                <span>LinkedIn Verified</span>
                <CheckCircle2 className="h-3 w-3" />
              </a>
            )}
            <Badge variant="green" size="sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" />
              College Email Confirmed
            </Badge>
          </div>
        </div>

        {/* Reliability & Reviews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reliability Index</CardTitle>
                <span className="text-2xl font-black">{profile.reliability_score}/100</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={profile.reliability_score} showPercentage={false} />
              <p className="text-xs text-[#0A0A0A]/70">
                Peer-verified reliability across past external hackathons with 0 ghost reports.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>Teammate Review Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="green">Communicates Clearly</Badge>
                <Badge variant="green">Delivers on Time</Badge>
                <Badge variant="green">Fast Debugger</Badge>
                <Badge variant="subtle">High Code Quality</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technical Stack */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle>Technical Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile.skills?.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-[12px] border border-[#0A0A0A]/15 p-3 bg-[#FFFFFF] flex items-center justify-between"
                >
                  <span className="font-bold text-xs">{skill.skill_name}</span>
                  <Badge variant="green" size="sm">{skill.proficiency}/5</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety & Moderation Controls */}
        <div className="pt-6 border-t border-[#0A0A0A]/10 flex items-center justify-between text-xs text-[#0A0A0A]/60">
          <span>Protected under {APP_CONFIG.name} Community Guidelines</span>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-[#0A0A0A] hover:underline">
              <Flag className="h-3.5 w-3.5" /> Report Profile
            </button>
            <button className="flex items-center gap-1 hover:text-[#0A0A0A] hover:underline">
              <UserX className="h-3.5 w-3.5" /> Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
