"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileService } from "@/lib/services/profile";
import type { Profile, Project, PastHackathon } from "@/types/models";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Share2,
  Calendar,
  Award,
  Github,
  Linkedin,
  MapPin,
  TrendingUp,
  Sparkles,
  Lock,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Modals for adding project / past hackathon
  const [projectModalOpen, setProjectModalOpen] = React.useState(false);
  const [projectTitle, setProjectTitle] = React.useState("");
  const [projectDesc, setProjectDesc] = React.useState("");
  const [projectStack, setProjectStack] = React.useState("");
  const [projectRepo, setProjectRepo] = React.useState("");
  const [projectDemo, setProjectDemo] = React.useState("");

  const [hackathonModalOpen, setHackathonModalOpen] = React.useState(false);
  const [hackathonName, setHackathonName] = React.useState("");
  const [hackathonYear, setHackathonYear] = React.useState(2025);
  const [hackathonResult, setHackathonResult] = React.useState<"Winner" | "Runner Up" | "Finalist" | "Participant">("Winner");
  const [hackathonProof, setHackathonProof] = React.useState("");

  React.useEffect(() => {
    async function load() {
      // In demo/dev mode, load seeded user
      const data = await ProfileService.getProfile("u-demo-1");
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const newProject: Project = {
      id: `prj-${Date.now()}`,
      profile_id: profile.id,
      title: projectTitle,
      description: projectDesc,
      tech_stack: projectStack.split(",").map((s) => s.trim()).filter(Boolean),
      repo_url: projectRepo || undefined,
      demo_url: projectDemo || undefined,
      created_at: new Date().toISOString(),
    };

    setProfile({
      ...profile,
      projects: [...(profile.projects || []), newProject],
    });
    setProjectModalOpen(false);
    setProjectTitle("");
    setProjectDesc("");
    setProjectStack("");
    setProjectRepo("");
    setProjectDemo("");
  };

  const handleAddHackathon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const newHackathon: PastHackathon = {
      id: `ph-${Date.now()}`,
      profile_id: profile.id,
      event_name: hackathonName,
      year: hackathonYear,
      result: hackathonResult,
      proof_url: hackathonProof || undefined,
      verification_status: "pending",
      created_at: new Date().toISOString(),
    };

    setProfile({
      ...profile,
      past_hackathons: [...(profile.past_hackathons || []), newHackathon],
    });
    setHackathonModalOpen(false);
    setHackathonName("");
    setHackathonProof("");
  };

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-4xl py-20 px-4 text-center">
        <p className="text-sm font-semibold text-[#0A0A0A]/60">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Profile Header Banner */}
        <div className="rounded-[20px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-6 sm:p-8 shadow-[4px_4px_0px_#0A0A0A] relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full border-2 border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-extrabold text-2xl text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                {profile.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {profile.name}
                  </h1>
                  <Badge variant="green" size="sm">
                    Verified Builder
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#0A0A0A]/70 mt-1">
                  {profile.college} &bull; Year {profile.year} ({profile.branch})
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#0A0A0A]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city_name} ({profile.area})
                  </span>
                  <span>&bull;</span>
                  <span className="capitalize">{profile.goals} Goal</span>
                  <span>&bull;</span>
                  <span className="capitalize">{profile.intensity} Intensity</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-end gap-2 w-full sm:w-auto">
              <Link href={`/p/${profile.id}`} target="_blank">
                <Button variant="secondary" size="sm">
                  <Share2 className="h-3.5 w-3.5 mr-1" /> Public Card
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="outline" size="sm">
                  Edit Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6 pt-6 border-t border-[#0A0A0A]/10 text-sm leading-relaxed text-[#0A0A0A]/80">
            {profile.bio}
          </div>

          {/* Social Proof Badges */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A]/5 shadow-[1px_1px_0px_#0A0A0A]"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub ({profile.github_stats?.public_repos || 25} repos)</span>
                <CheckCircle2 className="h-3 w-3 text-[#0A0A0A]" />
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A]/5 shadow-[1px_1px_0px_#0A0A0A]"
              >
                <Linkedin className="h-3.5 w-3.5" />
                <span>LinkedIn Verified</span>
                <CheckCircle2 className="h-3 w-3 text-[#0A0A0A]" />
              </a>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] border border-[#0A0A0A] bg-[#B8F2C9] text-xs font-bold text-[#0A0A0A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>College Email Confirmed</span>
            </div>
          </div>
        </div>

        {/* Reliability & Completeness Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reliability Score</CardTitle>
                <span className="text-2xl font-black tabular-nums">{profile.reliability_score}/100</span>
              </div>
              <CardDescription>
                Calculated from completed hackathons, teammate confirmations, and responsiveness.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={profile.reliability_score} showPercentage={false} />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#0A0A0A]/80">
                  <span>+10 Team Lock Completed (SIH 2025)</span>
                  <Badge variant="subtle" size="sm">+10 pts</Badge>
                </div>
                <div className="flex items-center justify-between text-[#0A0A0A]/80">
                  <span>+5 Peer Review: &ldquo;Delivers on time&rdquo;</span>
                  <Badge variant="subtle" size="sm">+5 pts</Badge>
                </div>
                <div className="flex items-center justify-between text-[#0A0A0A]/80">
                  <span>0 No-Show / Ghost reports</span>
                  <Badge variant="green" size="sm">Clean Record</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>Aggregated Peer Feedback</CardTitle>
              <CardDescription>
                Teammate reviews post-hackathons are displayed as verified skill & character tags.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="green">Communicates Clearly (5 reviews)</Badge>
                <Badge variant="green">Delivers on Time (4 reviews)</Badge>
                <Badge variant="green">Fast Debugger (3 reviews)</Badge>
                <Badge variant="outline">Calm Under Pressure (2 reviews)</Badge>
                <Badge variant="subtle">High Code Quality</Badge>
              </div>
              <p className="text-xs text-[#0A0A0A]/60 pt-2">
                Individual ratings and qualitative notes remain private to protect teammates.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skills Section */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle>Skills & Proficiency Breakdown</CardTitle>
            <CardDescription>Primary technical proficiencies used by the matching engine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {profile.skills?.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-[12px] border border-[#0A0A0A]/15 bg-[#FFFFFF] p-3 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-[#0A0A0A] block">{skill.skill_name}</span>
                    <span className="text-[10px] text-[#0A0A0A]/50 capitalize">{skill.category}</span>
                  </div>
                  <Badge variant="green" size="sm">
                    {skill.proficiency} / 5
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Showcase */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Projects Showcase</CardTitle>
                <CardDescription>Verifiable proof of what you have built</CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProjectModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects?.map((project) => (
                <div
                  key={project.id}
                  className="rounded-[14px] border border-[#0A0A0A] bg-[#FFFFFF] p-4 shadow-[2px_2px_0px_#0A0A0A] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-base text-[#0A0A0A]">{project.title}</h4>
                    {project.repo_url && (
                      <a href={project.repo_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4 text-[#0A0A0A]/60 hover:text-[#0A0A0A]" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#0A0A0A]/70 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.map((tech) => (
                      <Badge key={tech} variant="subtle" size="sm">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past Hackathons & Certificates */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Past External Hackathons</CardTitle>
                <CardDescription>
                  Verified proof links from Devpost, Devfolio, or Unstop
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHackathonModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Past Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.past_hackathons?.map((h) => (
                <div
                  key={h.id}
                  className="rounded-[12px] border border-[#0A0A0A]/15 bg-[#FFFFFF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[10px] bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center font-bold">
                      <Award className="h-5 w-5 text-[#0A0A0A]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{h.event_name} ({h.year})</h4>
                      <p className="text-xs text-[#0A0A0A]/60">
                        Result: <strong>{h.result}</strong> &bull; Team of {h.team_size || 4}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {h.proof_url && (
                      <a
                        href={h.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#0A0A0A] underline hover:opacity-75"
                      >
                        Proof Link &rarr;
                      </a>
                    )}
                    <Badge
                      variant={h.verification_status === "verified" ? "green" : "subtle"}
                      size="sm"
                    >
                      {h.verification_status === "verified" ? "Verified Link" : "Pending Review"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Project Dialog */}
      <Dialog
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Add Project to Showcase"
        description="Add notable projects with live links or repos."
      >
        <form onSubmit={handleAddProject} className="space-y-4">
          <Input
            label="Project Title"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g. Distributed Task Queue"
            required
          />
          <Textarea
            label="Description"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
            placeholder="What does it do? What problems did it solve?"
            required
          />
          <Input
            label="Tech Stack (comma separated)"
            value={projectStack}
            onChange={(e) => setProjectStack(e.target.value)}
            placeholder="Go, Redis, Docker, Next.js"
            required
          />
          <Input
            label="GitHub Repository URL (Optional)"
            value={projectRepo}
            onChange={(e) => setProjectRepo(e.target.value)}
            placeholder="https://github.com/..."
          />
          <Input
            label="Demo / Deployment URL (Optional)"
            value={projectDemo}
            onChange={(e) => setProjectDemo(e.target.value)}
            placeholder="https://myproject.dev"
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Project</Button>
          </div>
        </form>
      </Dialog>

      {/* Add Hackathon Dialog */}
      <Dialog
        isOpen={hackathonModalOpen}
        onClose={() => setHackathonModalOpen(false)}
        title="Record Past Hackathon"
        description="Share verifiable participation from external hackathons."
      >
        <form onSubmit={handleAddHackathon} className="space-y-4">
          <Input
            label="Event Name"
            value={hackathonName}
            onChange={(e) => setHackathonName(e.target.value)}
            placeholder="e.g. EthIndia 2024"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                Year
              </label>
              <select
                value={hackathonYear}
                onChange={(e) => setHackathonYear(Number(e.target.value))}
                className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A]"
              >
                {[2026, 2025, 2024, 2023, 2022].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                Result
              </label>
              <select
                value={hackathonResult}
                onChange={(e) => setHackathonResult(e.target.value as any)}
                className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A]"
              >
                <option value="Winner">Winner</option>
                <option value="Runner Up">Runner Up</option>
                <option value="Finalist">Finalist</option>
                <option value="Participant">Participant</option>
              </select>
            </div>
          </div>
          <Input
            label="Devpost / Devfolio / Unstop Proof Link"
            value={hackathonProof}
            onChange={(e) => setHackathonProof(e.target.value)}
            placeholder="https://devpost.com/software/..."
            helperText="Verifiable proof links receive priority verification status."
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHackathonModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit Event</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
