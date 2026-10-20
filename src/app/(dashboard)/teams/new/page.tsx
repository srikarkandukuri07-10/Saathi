"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/site";
import { Plus, Trash2, ArrowRight, ShieldCheck, Users } from "lucide-react";

function NewTeamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHackathonId = searchParams.get("hackathonId") ?? "";

  const [hackathons, setHackathons] = React.useState<
    Array<{ id: string; name: string; city_name?: string }>
  >([]);
  const [hackathonId, setHackathonId] = React.useState(initialHackathonId);
  const [teamName, setTeamName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [githubRepoUrl, setGithubRepoUrl] = React.useState("");
  const [ideaBoard, setIdeaBoard] = React.useState("");

  const [openSlots, setOpenSlots] = React.useState<
    Array<{ title: string; category: any; description: string }>
  >([]);

  const [newSlotTitle, setNewSlotTitle] = React.useState("");
  const [newSlotCategory, setNewSlotCategory] = React.useState("frontend");
  const [newSlotDesc, setNewSlotDesc] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Load the published events so the picker only offers real hackathons.
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/hackathons", { cache: "no-store" });
        if (!res.ok) throw new Error("events unavailable");

        const body = await res.json();
        const list = body.hackathons ?? [];
        if (cancelled) return;

        setHackathons(list);
        setHackathonId((current) => current || list[0]?.id || "");
      } catch {
        if (!cancelled) {
          setErrorMessage("The event list could not be loaded. Please try again.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddSlot = () => {
    if (!newSlotTitle.trim()) return;
    setOpenSlots([
      ...openSlots,
      {
        title: newSlotTitle,
        category: newSlotCategory,
        description: newSlotDesc || "Collaborate on architecture and implementation.",
      },
    ]);
    setNewSlotTitle("");
    setNewSlotDesc("");
  };

  const handleRemoveSlot = (index: number) => {
    setOpenSlots(openSlots.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hackathonId) {
      setErrorMessage("Select the hackathon this squad is for.");
      return;
    }

    if (teamName.trim().length < 3) {
      setErrorMessage("Give the squad a name of at least 3 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonId,
          name: teamName,
          description: description || undefined,
          githubRepoUrl: githubRepoUrl || undefined,
          ideaBoard: ideaBoard || undefined,
          openSlots,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The squad could not be created.");
      }

      router.push("/teams");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The squad could not be created. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/teams" className="text-xs font-semibold text-[#0A0A0A]/60 hover:underline block mb-2">
            &larr; Back to Teams
          </Link>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="green">Squad Formation</Badge>
            <Badge variant="outline">Role Slots</Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Create a Hackathon Team</h1>
          <p className="mt-1 text-sm text-[#0A0A0A]/70">
            Define your hackathon project, list the missing roles you need, and recruit serious peers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMessage && (
            <Alert status="error" title="Check the form">
              {errorMessage}
            </Alert>
          )}

          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>1. Team & Event Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                  Select Target Hackathon
                </label>
                <select
                  value={hackathonId}
                  onChange={(e) => setHackathonId(e.target.value)}
                  className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                >
                  {hackathons.length === 0 && (
                    <option value="">No published events</option>
                  )}
                  {hackathons.map((hackathon) => (
                    <option key={hackathon.id} value={hackathon.id}>
                      {hackathon.name}
                      {hackathon.city_name ? ` (${hackathon.city_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Autonomous Agents Lab"
                required
              />

              <Textarea
                label="Project Idea & Problem Statement"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building? Which problem statement does this address?"
                required
              />

              <Input
                label="GitHub Organization or Repo URL (Optional)"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/team-repo"
              />

              <Textarea
                label="Idea Board & Execution Checklist"
                value={ideaBoard}
                onChange={(e) => setIdeaBoard(e.target.value)}
                placeholder="1. Ideation&#10;2. Architecture&#10;3. Demo Deck"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Open Role Slots */}
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>2. Open Role Slots ({openSlots.length})</CardTitle>
              <CardDescription>
                Candidates with complementary skills in these categories will receive a 40% algorithmic boost to join your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing slots */}
              <div className="space-y-3">
                {openSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="rounded-[12px] border border-[#0A0A0A] p-3 bg-[#FFFFFF] flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#0A0A0A] block">{slot.title}</span>
                      <span className="text-[10px] text-[#0A0A0A]/60">
                        Category: <strong className="capitalize">{slot.category}</strong> &bull; {slot.description}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add slot sub-form */}
              <div className="p-4 rounded-[14px] border-2 border-dashed border-[#0A0A0A]/30 bg-[#0A0A0A]/[0.02] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block">
                  Add An Open Role Slot
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Slot Title"
                    value={newSlotTitle}
                    onChange={(e) => setNewSlotTitle(e.target.value)}
                    placeholder="e.g. Need 1 Backend & Database Dev"
                  />
                  <div>
                    <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                      Skill Category
                    </label>
                    <select
                      value={newSlotCategory}
                      onChange={(e) => setNewSlotCategory(e.target.value)}
                      className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A]"
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="ml_ai">ML / AI</option>
                      <option value="mobile">Mobile</option>
                      <option value="hardware_iot">Hardware / IoT</option>
                      <option value="design">UI/UX Design</option>
                      <option value="product">Product Management</option>
                      <option value="devops">DevOps / Cloud</option>
                      <option value="blockchain">Blockchain</option>
                      <option value="pitching">Pitching & Storytelling</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Role Expectations (Optional)"
                  value={newSlotDesc}
                  onChange={(e) => setNewSlotDesc(e.target.value)}
                  placeholder="e.g. Experience with PostgreSQL, Prisma, and Docker"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSlot}
                  className="font-bold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Append Role Slot
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#0A0A0A]">
            <Link href="/teams">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="font-bold shadow-[4px_4px_0px_#0A0A0A]"
            >
              Publish Team & Open Slots <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewTeamPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFFFF] py-20 text-center text-xs font-semibold text-[#0A0A0A]/60">
          Loading team workspace creator...
        </div>
      }
    >
      <NewTeamForm />
    </React.Suspense>
  );
}
