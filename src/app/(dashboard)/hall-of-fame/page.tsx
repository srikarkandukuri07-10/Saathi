"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/site";
import {
  Trophy,
  ExternalLink,
  Sparkles,
  Share2,
  RotateCw,
} from "lucide-react";

interface HallOfFameEntry {
  id: string;
  builderName: string;
  college?: string;
  eventName: string;
  year: number;
  result: string;
  proofUrl?: string;
}

export default function HallOfFamePage() {
  const [entries, setEntries] = React.useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [shareNotice, setShareNotice] = React.useState<string | null>(null);

  // The hall of fame is built from verified wins recorded on the platform.
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/hall-of-fame", { cache: "no-store" });
        if (!res.ok) throw new Error("hall of fame unavailable");

        const body = await res.json();
        if (!cancelled) setEntries(body.entries ?? []);
      } catch {
        if (!cancelled) {
          setEntries([]);
          setLoadError("The hall of fame could not be loaded.");
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

  const handleShareCard = (builderName: string) => {
    navigator.clipboard.writeText(
      `https://hackpact.dev/hall-of-fame#${builderName.toLowerCase().replace(/\s+/g, "-")}`
    );
    setShareNotice(`Victory card link for "${builderName}" copied to clipboard!`);
    setTimeout(() => setShareNotice(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="green">Proof of Impact</Badge>
              <Badge variant="outline">Verified External Winners</Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Hall of Fame
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
              Builders on {APP_CONFIG.name} whose wins were verified by an admin.
              Proof that complementary skills and high commitment win competitions.
            </p>
          </div>

          <Link href="/matches">
            <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Find Your Winning Team
            </Button>
          </Link>
        </div>

        {shareNotice && (
          <div className="p-4 rounded-[12px] border-2 border-[#0A0A0A] bg-[#B8F2C9] text-xs font-bold text-[#0A0A0A]">
            {shareNotice}
          </div>
        )}

        {loadError && (
          <Alert status="error" title="Could not load">
            {loadError}
          </Alert>
        )}

        {/* Victory Cards Feed */}
        {loading ? (
          <div className="text-center py-20 text-xs font-semibold text-[#0A0A0A]/60">
            Loading verified wins...
          </div>
        ) : entries.length === 0 ? (
          <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
            <CardContent>
              <h3 className="text-lg font-bold">No verified wins yet</h3>
              <p className="text-xs text-[#0A0A0A]/70 mt-2 max-w-md mx-auto leading-relaxed">
                Winners appear here once an admin verifies the event, the result and
                the proof link recorded on the profile.
              </p>
              <div className="mt-5">
                <Link href="/matches">
                  <Button variant="primary" size="sm" className="font-bold">
                    <RotateCw className="h-3.5 w-3.5 mr-1" /> Find a winning squad
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="border-2 border-[#0A0A0A] p-6 sm:p-8 shadow-[6px_6px_0px_#0A0A0A] space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#0A0A0A]/10">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="green" size="sm">
                        <Trophy className="h-3 w-3 inline mr-1" /> {entry.result}
                      </Badge>
                      <span className="text-xs font-bold text-[#0A0A0A]">
                        {entry.eventName} ({entry.year})
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {entry.builderName}
                    </h2>
                    {entry.college && (
                      <p className="text-sm font-semibold text-[#0A0A0A]/70 mt-1">
                        {entry.college}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.proofUrl && (
                      <a href={entry.proofUrl} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm">
                          Verifiable Proof <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShareCard(entry.builderName)}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Share Card
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-[#0A0A0A]/70">
                    Verified result recorded on {APP_CONFIG.name}.
                  </span>
                  <Link href="/matches">
                    <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
                      <RotateCw className="h-3.5 w-3.5 mr-1" /> Team Up for Next Hackathon
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
