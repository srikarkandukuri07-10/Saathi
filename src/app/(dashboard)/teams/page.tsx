"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/site";
import type { Team } from "@/types/models";
import {
  Users,
  Lock,
  CheckCircle2,
  ExternalLink,
  Plus,
  Github,
  Calendar,
  AlertOctagon,
  Sparkles,
} from "lucide-react";

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lockNotice, setLockNotice] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/teams", { cache: "no-store" });
        if (!res.ok) throw new Error("teams unavailable");

        const body = await res.json();
        if (!cancelled) setTeams(body.teams ?? []);
      } catch {
        if (!cancelled) {
          setTeams([]);
          setLoadError("The squads could not be loaded. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirmLock = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/lock`, { method: "POST" });
      if (!res.ok) throw new Error("lock failed");

      const body = await res.json();
      if (body.team) {
        setTeams(teams.map((t) => (t.id === teamId ? body.team : t)));
        setLockNotice(
          body.allLocked
            ? "All members confirmed! The team is now LOCKED (+10 Reliability awarded to every confirmed member)."
            : "Your individual commitment confirmed! Waiting for the remaining teammates to lock in."
        );
      }
    } catch {
      setLoadError("Your commitment could not be saved. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="green">Squad Workspaces</Badge>
              <Badge variant="black">Anti-Ghosting Protocol</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Teams & Open Role Slots
            </h1>
            <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
              Form squads with complementary skillsets, assign open role slots, and lock your team commitment before submission deadlines.
            </p>
          </div>

          <Link href="/teams/new">
            <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
              <Plus className="h-4 w-4 mr-1.5" /> Create New Team
            </Button>
          </Link>
        </div>

        {lockNotice && (
          <Alert status="success" title="Commitment Updated">
            {lockNotice}
          </Alert>
        )}

        {loadError && (
          <Alert status="error" title="Something went wrong">
            {loadError}
          </Alert>
        )}

        {/* Team Workspaces Feed */}
        {loading ? (
          <div className="text-center py-20 text-xs font-semibold text-[#0A0A0A]/60">
            Loading team squads...
          </div>
        ) : teams.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
            <CardContent>
              <h3 className="text-lg font-bold">No squads yet</h3>
              <p className="text-xs text-[#0A0A0A]/70 mt-2 max-w-md mx-auto leading-relaxed">
                Nobody has published open role slots yet. Create the first squad and
                let the matching engine find the teammates you are missing.
              </p>
              <div className="mt-5">
                <Link href="/teams/new">
                  <Button variant="primary" size="sm" className="font-bold">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Create the first squad
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-6 space-y-6"
              >
                {/* Team Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#0A0A0A]/10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60">
                        {team.hackathon_name}
                      </span>
                      {team.is_locked ? (
                        <Badge variant="black" size="sm">
                          <Lock className="h-3 w-3 inline mr-1" /> Team Locked
                        </Badge>
                      ) : (
                        <Badge variant="green" size="sm">
                          Recruiting Open Slots
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#0A0A0A]">
                      {team.name}
                    </h2>
                    <p className="text-xs font-medium text-[#0A0A0A]/70 mt-1">
                      Lead:{" "}
                      <strong>{team.lead_profile?.name ?? "Team lead"}</strong>
                      {team.lead_profile?.reliability_score
                        ? ` • Reliability: ${team.lead_profile.reliability_score}/100`
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {team.github_repo_url && (
                      <a
                        href={team.github_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
                      >
                        <Github className="h-4 w-4" /> Repo Link
                      </a>
                    )}
                    <Link href={`/chat`}>
                      <Button variant="secondary" size="sm" className="font-bold">
                        Team Chat Space &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Description & Idea Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[14px] border border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.02]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block mb-1.5">
                      Project Objective & Pitch:
                    </span>
                    <p className="text-xs text-[#0A0A0A]/80 leading-relaxed">
                      {team.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-[14px] border border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.02]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block mb-1.5">
                      Idea Board & Execution Checklist:
                    </span>
                    <pre className="text-xs font-mono text-[#0A0A0A]/80 whitespace-pre-line leading-relaxed">
                      {team.idea_board}
                    </pre>
                  </div>
                </div>

                {/* Team Members List */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-3">
                    Active Teammates ({team.members.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] p-3 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#B8F2C9] border border-[#0A0A0A] flex items-center justify-center font-bold text-xs">
                            {m.profile?.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#0A0A0A] block">
                              {m.profile?.name || "Teammate"}
                            </span>
                            <span className="text-[10px] text-[#0A0A0A]/60 font-medium">
                              {m.role_name} &bull; {m.profile?.college}
                            </span>
                          </div>
                        </div>

                        <Badge variant={m.confirmed_lock ? "green" : "subtle"} size="sm">
                          {m.confirmed_lock ? "Locked In" : "Pending Lock"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Role Slots */}
                {team.open_slots.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-3">
                      Open Role Slots Wanted:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {team.open_slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-[12px] border-2 border-dashed border-[#0A0A0A] p-3 bg-[#FFFFFF] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-[#0A0A0A] block">{slot.title}</span>
                            <span className="text-[10px] text-[#0A0A0A]/60">{slot.description}</span>
                          </div>
                          <Link href="/matches">
                            <Button variant="secondary" size="sm">
                              Match Candidates &rarr;
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Lock Anti-Ghosting Bar */}
                <div className="pt-4 border-t-2 border-[#0A0A0A] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-[#0A0A0A]/70">
                    <strong className="text-[#0A0A0A]">Anti-Ghosting Lock:</strong> Every member must click confirm to lock team for the hackathon. Locking prevents dropouts and awards +10 reliability.
                  </div>

                  <Button
                    variant={team.is_locked ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => handleConfirmLock(team.id)}
                    disabled={team.is_locked}
                    className="font-bold shadow-[2px_2px_0px_#0A0A0A] shrink-0"
                  >
                    {team.is_locked ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Team Verified & Locked
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1.5" /> Confirm Team Commitment
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
