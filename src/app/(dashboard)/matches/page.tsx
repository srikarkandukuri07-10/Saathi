"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { APP_CONFIG } from "@/config/site";
import type { MatchCandidate } from "@/types/models";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Send,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  AlertOctagon,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function MatchesPage() {
  const [matches, setMatches] = React.useState<MatchCandidate[]>([]);
  const [hackathons, setHackathons] = React.useState<
    Array<{ id: string; name: string; city_name?: string }>
  >([]);
  const [chapter, setChapter] = React.useState<{
    cityName: string;
    currentCount: number;
    targetCount: number;
  } | null>(null);
  const [selectedHackathon, setSelectedHackathon] = React.useState("");
  const [firstTimerFriendly, setFirstTimerFriendly] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [gateMessage, setGateMessage] = React.useState<string | null>(null);
  const [feedNotice, setFeedNotice] = React.useState<string | null>(null);

  // Request modal state
  const [requestModalOpen, setRequestModalOpen] = React.useState(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState<MatchCandidate | null>(null);
  const [requestNote, setRequestNote] = React.useState("");
  const [sendingRequest, setSendingRequest] = React.useState(false);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);
  const [requestError, setRequestError] = React.useState<string | null>(null);

  // Load the event list and the chapter progress, then the ranked feed.
  React.useEffect(() => {
    async function loadContext() {
      try {
        const [hackathonsRes, waitlistRes] = await Promise.all([
          fetch("/api/hackathons", { cache: "no-store" }),
          fetch("/api/waitlist", { cache: "no-store" }),
        ]);

        if (hackathonsRes.ok) {
          const body = await hackathonsRes.json();
          const list = body.hackathons ?? [];
          setHackathons(list);
          setSelectedHackathon((current) => current || list[0]?.id || "");
        }

        if (waitlistRes.ok) {
          const body = await waitlistRes.json();
          if (body.stats) {
            setChapter({
              cityName: body.stats.cityName,
              currentCount: body.stats.currentCount,
              targetCount: body.stats.targetCount,
            });
          }
        }
      } catch {
        // The feed request below reports the failure to the user.
      }
    }

    loadContext();
  }, []);

  React.useEffect(() => {
    async function load() {
      if (!selectedHackathon) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setGateMessage(null);

      try {
        const res = await fetch(
          `/api/matches?hackathonId=${encodeURIComponent(selectedHackathon)}`,
          { cache: "no-store" }
        );

        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          setGateMessage(
            body.message ??
              "Complete your profile to unlock teammate matching."
          );
          setMatches([]);
          setLoading(false);
          return;
        }

        if (res.status === 401) {
          setGateMessage("Sign in to see the teammates who match your profile.");
          setMatches([]);
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("match feed unavailable");

        const body = await res.json();
        setMatches(body.matches ?? []);
        setFeedNotice(body.notice ?? null);
        setLoading(false);
      } catch {
        setMatches([]);
        setFeedNotice(
          "The matching pool could not be loaded. Check your connection and try again."
        );
        setLoading(false);
      }
    }
    load();
  }, [selectedHackathon]);

  const handleOpenRequest = (cand: MatchCandidate) => {
    setSelectedCandidate(cand);
    setRequestNote(
      `Hey ${cand.candidate.name.split(" ")[0]}! Saw your background in ${cand.candidate.skills?.[0]?.skill_name || "tech"}. We are forming a serious 24h grind team for this event. Would love to team up!`
    );
    setRequestModalOpen(true);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setSendingRequest(true);
    setRequestError(null);

    try {
      const res = await fetch("/api/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: selectedCandidate.candidate.id,
          hackathon_id: selectedHackathon,
          note: requestNote,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not send the request");
      }

      setRequestModalOpen(false);
      setSuccessNotice(
        `Match request dispatched to ${selectedCandidate.candidate.name}. Once mutually accepted, direct chat will unlock!`
      );
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Could not send the request. Please try again."
      );
    } finally {
      setSendingRequest(false);
    }
  };

  // Filter list if first-timer friendly mode is toggled
  const displayedMatches = React.useMemo(() => {
    if (!firstTimerFriendly) return matches;
    return [...matches].sort((a, b) => {
      // The fairness bonus is only awarded to first-time participants, so it
      // is the signal the server computed for "rising builder".
      const aIsFirst = a.breakdown.fairnessBonus > 0;
      const bIsFirst = b.breakdown.fairnessBonus > 0;
      if (aIsFirst && !bIsFirst) return -1;
      if (!aIsFirst && bIsFirst) return 1;
      return b.score - a.score;
    });
  }, [matches, firstTimerFriendly]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="green">Algorithmic Pairing</Badge>
              <Badge variant="outline">Explainable Reasons</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Teammate Suggestions
            </h1>
            <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
              Every match card details <strong>Why you match</strong> based on skill complementarity, shared 24h grind goals, and location proximity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/spin">
              <Button variant="secondary" size="sm" className="font-bold">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Lucky Spin Wheel
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <Alert status="success" title="Request Sent">
            {successNotice}
          </Alert>
        )}

        {/* Completeness gate */}
        {gateMessage && (
          <Alert status="warning" title="Matching locked">
            {gateMessage}
            <div className="mt-2">
              <Link href="/onboarding" className="underline font-semibold">
                Finish your profile &rarr;
              </Link>
            </div>
          </Alert>
        )}

        {/* Feed notice */}
        {feedNotice && !gateMessage && (
          <Alert status="info" title="Matching pool">
            {feedNotice}
          </Alert>
        )}

        {/* Request failure */}
        {requestError && (
          <Alert status="error" title="Request not sent">
            {requestError}
          </Alert>
        )}

        {/* Event Selector & Fairness Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[16px] border-2 border-[#0A0A0A] bg-[#0A0A0A]/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/70">
              Matching For:
            </span>
            <select
              value={selectedHackathon}
              onChange={(e) => setSelectedHackathon(e.target.value)}
              className="rounded-[10px] border border-[#0A0A0A] bg-[#FFFFFF] px-3 py-1.5 text-xs font-bold text-[#0A0A0A]"
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

          {/* Fairness: First-timer friendly toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={firstTimerFriendly}
              onChange={(e) => setFirstTimerFriendly(e.target.checked)}
              className="h-4 w-4 rounded border-[#0A0A0A] text-[#0A0A0A] focus:ring-[#0A0A0A]"
            />
            <span className="text-xs font-bold text-[#0A0A0A]">
              First-Timer Friendly Mode (Fairness Boost)
            </span>
          </label>
        </div>

        {/* Cold-Start Banner: Never show an empty dead screen */}
        <div className="rounded-[16px] border border-[#0A0A0A]/15 bg-[#B8F2C9]/25 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[#0A0A0A] block">
              {chapter
                ? `${chapter.cityName} Chapter Growth: ${chapter.currentCount} / ${chapter.targetCount} Verified Builders Joined`
                : "Chapter growth is shown once a city chapter is active."}
            </span>
            <span className="text-[#0A0A0A]/70">
              Matches are computed from the onboarded builders of the active chapter.
            </span>
          </div>
          <Link href="/waitlist">
            <Button variant="secondary" size="sm" className="font-bold shrink-0">
              Invite Peer & Fast-Track Matching &rarr;
            </Button>
          </Link>
        </div>

        {/* Matches Feed */}
        {loading ? (
          <div className="text-center py-20 text-xs font-semibold text-[#0A0A0A]/60">
            Running background compatibility scorer...
          </div>
        ) : displayedMatches.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
            <CardContent>
              <h3 className="text-lg font-bold">No compatible teammates yet</h3>
              <p className="text-xs text-[#0A0A0A]/70 mt-2 max-w-md mx-auto leading-relaxed">
                {gateMessage
                  ? "Your profile needs a few more signals before the matching engine can rank teammates for you."
                  : "No one in the Hyderabad chapter matches this event yet. Lock in more skills, or invite peers to fast-track the cold start."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-5">
                <Link href="/onboarding">
                  <Button variant="primary" size="sm" className="font-bold">
                    Strengthen my profile
                  </Button>
                </Link>
                <Link href="/waitlist">
                  <Button variant="secondary" size="sm" className="font-bold">
                    Invite peers
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {displayedMatches.map((match) => (
              <Card
                key={match.id}
                className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] p-6 hover:shadow-[6px_6px_0px_#0A0A0A] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  {/* Candidate Bio & Header */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-16 w-16 rounded-full border-2 border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-black text-xl text-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                      {match.candidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/p/${match.candidate.id}`} className="hover:underline">
                          <h3 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
                            {match.candidate.name}
                          </h3>
                        </Link>
                        <Badge variant="green" size="sm">
                          Verified
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-[#0A0A0A]/60 mt-0.5">
                        {match.candidate.college} &bull; Year {match.candidate.year} ({match.candidate.branch})
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#0A0A0A]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {match.candidate.city_name} ({match.candidate.area})
                        </span>
                        <span>&bull;</span>
                        <span className="capitalize">{match.candidate.intensity}</span>
                      </div>

                      {/* Technical Stack Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {match.candidate.skills?.map((s) => (
                          <Badge key={s.id} variant="subtle" size="sm">
                            {s.skill_name} ({s.proficiency}/5)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Score & Action */}
                  <div className="flex flex-col md:items-end justify-between gap-4 md:w-56 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[#0A0A0A]/10">
                    <div className="text-left md:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#0A0A0A] bg-[#B8F2C9] shadow-[2px_2px_0px_#0A0A0A]">
                        <Sparkles className="h-3.5 w-3.5 text-[#0A0A0A]" />
                        <span className="text-sm font-black tabular-nums text-[#0A0A0A]">
                          {match.score}% Compatibility
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#0A0A0A]/70 mt-1.5">
                        Reliability: <strong>{match.candidate.reliability_score}/100</strong>
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenRequest(match)}
                        className="w-full font-bold shadow-[2px_2px_0px_#0A0A0A]"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Send Match Request
                      </Button>
                      <Link href={`/p/${match.candidate.id}`} className="block w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          View Full Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* "Why You Match" Compatibility Card */}
                <div className="mt-5 pt-4 border-t-2 border-[#0A0A0A] bg-[#0A0A0A]/[0.02] -mx-6 -mb-6 p-5 rounded-b-[16px]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block mb-2">
                    Why You Match (Compatibility Signals):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#0A0A0A]/85">
                    {match.reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A0A0A] shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Match Request Dialog */}
      <Dialog
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title={selectedCandidate ? `Request to Team Up with ${selectedCandidate.candidate.name}` : "Match Request"}
        description="Write a short introductory note. Direct chat opens ONLY after mutual accept (anti-spam)."
      >
        <form onSubmit={handleSendRequest} className="space-y-4">
          <div className="p-3 rounded-[12px] border border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.02] text-xs">
            <span className="font-bold text-[#0A0A0A] block mb-1">Mutual Accept Shield:</span>
            To protect participants from unsolicited spam and harassment, contact details and direct chat remain hidden until both members confirm interest.
          </div>

          <Textarea
            label="Introductory Note (Max 500 characters)"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            placeholder="Introduce yourself, your proposed role in the team, and what problem statement you want to solve..."
            maxLength={500}
            rows={4}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={sendingRequest}
              className="font-bold shadow-[2px_2px_0px_#0A0A0A]"
            >
              Dispatch Request &rarr;
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
