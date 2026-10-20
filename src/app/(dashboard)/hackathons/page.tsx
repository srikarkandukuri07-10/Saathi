"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HackathonService } from "@/lib/services/hackathon";
import type { Hackathon } from "@/types/models";
import {
  Calendar,
  MapPin,
  ExternalLink,
  Users,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function HackathonsDirectoryPage() {
  const [hackathons, setHackathons] = React.useState<Hackathon[]>([]);
  const [modeFilter, setModeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const data = await HackathonService.getHackathons({
        mode: modeFilter,
        search: searchQuery,
      });
      setHackathons(data);
      setLoading(false);
    }
    load();
  }, [modeFilter, searchQuery]);

  const handleToggleGoing = async (hackathonId: string) => {
    const res = await HackathonService.toggleGoing(hackathonId, "user_me");
    setHackathons(
      hackathons.map((h) =>
        h.id === hackathonId
          ? { ...h, is_user_going: res.isGoing, participant_count: res.count }
          : h
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="green">Live External Events</Badge>
              <Badge variant="outline">Verified Organizer Directory</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              External Hackathons Directory
            </h1>
            <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
              Curated high-stakes hackathons. Mark <strong>&ldquo;I&apos;m Going&rdquo;</strong> to enter the matching pool and see complementary candidates and open team slots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/matches">
              <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
                <Users className="h-4 w-4 mr-1.5" /> View Your Matches
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {[
              { id: "all", label: "All Events" },
              { id: "offline", label: "Offline (Hyderabad First)" },
              { id: "online", label: "Virtual / Global" },
              { id: "hybrid", label: "Hybrid" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setModeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  modeFilter === tab.id
                    ? "bg-[#B8F2C9] border-[#0A0A0A] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                    : "bg-[#FFFFFF] border-[#0A0A0A]/20 text-[#0A0A0A]/70 hover:border-[#0A0A0A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#0A0A0A]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, theme, stack..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-[12px] border border-[#0A0A0A]/20 focus:border-[#0A0A0A] focus:outline-none"
            />
          </div>
        </div>

        {/* Hackathon Cards Grid */}
        {loading ? (
          <div className="text-center py-20 text-xs font-semibold text-[#0A0A0A]/60">
            Filtering directory...
          </div>
        ) : hackathons.length === 0 ? (
          <div className="rounded-[18px] border-2 border-[#0A0A0A] p-12 text-center bg-[#FFFFFF]">
            <p className="text-sm font-bold text-[#0A0A0A]">No hackathons found matching your filter.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setModeFilter("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((h) => (
              <Card
                key={h.id}
                className="border-2 border-[#0A0A0A] flex flex-col justify-between hover:shadow-[4px_4px_0px_#0A0A0A] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={h.mode === "offline" ? "green" : "subtle"} size="sm">
                      <span className="capitalize">{h.mode}</span> &bull; {h.city_name || "Online"}
                    </Badge>
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      {h.min_team_size === h.max_team_size ? `${h.min_team_size}` : `${h.min_team_size}-${h.max_team_size}`} members
                    </span>
                  </div>

                  <Link href={`/hackathons/${h.slug}`}>
                    <CardTitle className="text-lg hover:underline cursor-pointer mb-1 leading-snug">
                      {h.name}
                    </CardTitle>
                  </Link>
                  <p className="text-xs font-semibold text-[#0A0A0A]/60 mb-2">
                    {h.organizer}
                  </p>
                  <p className="text-xs text-[#0A0A0A]/80 line-clamp-3 mb-4 leading-relaxed">
                    {h.description || h.theme}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#0A0A0A]/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#0A0A0A]/60 font-medium">Prize Pool:</span>
                    <span className="font-extrabold text-[#0A0A0A]">{h.prize_pool || "Recognition"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#0A0A0A]/60 font-medium">Builders Going:</span>
                    <span className="font-bold text-[#0A0A0A]">{h.participant_count} builders</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant={h.is_user_going ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleGoing(h.id)}
                      className="font-bold"
                    >
                      {h.is_user_going ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Going
                        </>
                      ) : (
                        "+ I'm Going"
                      )}
                    </Button>

                    <Link href={`/hackathons/${h.slug}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Find Team &rarr;
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
