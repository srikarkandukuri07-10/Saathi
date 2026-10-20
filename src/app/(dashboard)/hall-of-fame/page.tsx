"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/config/site";
import {
  Trophy,
  Award,
  Users,
  ExternalLink,
  Sparkles,
  Share2,
  RotateCw,
  CheckCircle2,
} from "lucide-react";

interface WinningTeam {
  id: string;
  hackathonName: string;
  hackathonYear: number;
  teamName: string;
  result: string;
  prizeWon: string;
  members: Array<{ name: string; college: string; role: string }>;
  projectTitle: string;
  projectDescription: string;
  proofUrl: string;
}

const winningTeams: WinningTeam[] = [
  {
    id: "win-1",
    hackathonName: "Smart India Hackathon 2025",
    hackathonYear: 2025,
    teamName: "Team NeuralGrid",
    result: "1st Place Winner",
    prizeWon: "₹1,00,000",
    members: [
      { name: "Aditya Narang", college: "IIIT Hyderabad", role: "Full-Stack Lead" },
      { name: "Sneha Reddy", college: "CBIT", role: "ML Engineer" },
      { name: "Vikram Chandra", college: "VNR VJIET", role: "IoT Hardware" },
      { name: "Pooja Varma", college: "BITS Pilani", role: "UI/UX & Pitch" },
    ],
    projectTitle: "AI Grid Load Optimization for Smart Cities",
    projectDescription: "Realtime transformer-based power surge prediction and autonomous feeder dispatch deployed on edge microcontrollers.",
    proofUrl: "https://devpost.com/software/neuralgrid-sih",
  },
  {
    id: "win-2",
    hackathonName: "HackHyderabad 2025",
    hackathonYear: 2025,
    teamName: "CipherVault",
    result: "Grand Prize Winners",
    prizeWon: "₹3,00,000",
    members: [
      { name: "Kunal Shah", college: "IIT Hyderabad", role: "ZK Cryptography" },
      { name: "Tanmay B", college: "Chaitanya Bharathi", role: "Rust Backend" },
      { name: "Rhea Sen", college: "Vasavi College", role: "Frontend" },
    ],
    projectTitle: "Zero-Knowledge Biometric Identity Bridge",
    projectDescription: "Privacy-preserving student credential verification using zk-SNARKs and browser WASM execution.",
    proofUrl: "https://devfolio.co/submissions/ciphervault",
  },
];

export default function HallOfFamePage() {
  const [shareNotice, setShareNotice] = React.useState<string | null>(null);

  const handleShareCard = (teamName: string) => {
    navigator.clipboard.writeText(`https://hackpact.dev/hall-of-fame#${teamName.toLowerCase().replace(/\s+/g, "-")}`);
    setShareNotice(`Victory card link for "${teamName}" copied to clipboard!`);
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
              Teams formed on {APP_CONFIG.name} that went on to dominate external hackathons. Proof that complementary skills and high commitment win competitions.
            </p>
          </div>

          <Link href="/matches">
            <Button variant="primary" size="sm" className="font-bold shadow-[2px_2px_0px_#0A0A0A]">
              <Sparkles className="h-4 w-4 mr-1.5" /> Find Your Winning Team
            </Button>
          </Link>
        </div>

        {shareNotice && (
          <div className="p-4 rounded-[12px] border-2 border-[#0A0A0A] bg-[#B8F2C9] text-xs font-bold text-[#0A0A0A]">
            {shareNotice}
          </div>
        )}

        {/* Victory Cards Feed */}
        <div className="space-y-8">
          {winningTeams.map((team) => (
            <Card
              key={team.id}
              className="border-2 border-[#0A0A0A] p-6 sm:p-8 shadow-[6px_6px_0px_#0A0A0A] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#0A0A0A]/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="green" size="sm">
                      <Trophy className="h-3 w-3 inline mr-1" /> {team.result}
                    </Badge>
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      {team.hackathonName} ({team.hackathonYear})
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {team.teamName}
                  </h2>
                  <p className="text-sm font-bold text-[#0A0A0A] mt-1">
                    Prize Won: <span className="bg-[#B8F2C9] px-2 py-0.5 rounded border border-[#0A0A0A]">{team.prizeWon}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a href={team.proofUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      Verifiable Proof <ExternalLink className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleShareCard(team.teamName)}
                  >
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share Card
                  </Button>
                </div>
              </div>

              {/* Project Abstract */}
              <div className="p-4 rounded-[14px] border border-[#0A0A0A]/15 bg-[#0A0A0A]/[0.02]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block mb-1">
                  Winning Project: {team.projectTitle}
                </span>
                <p className="text-xs sm:text-sm text-[#0A0A0A]/80 leading-relaxed">
                  {team.projectDescription}
                </p>
              </div>

              {/* Roster & "Team Up Again" Mechanic */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-3">
                  Teammates Matched on {APP_CONFIG.name}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {team.members.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs text-[#0A0A0A] block">{member.name}</span>
                        <span className="text-[10px] text-[#0A0A0A]/60">{member.college}</span>
                      </div>
                      <Badge variant="subtle" size="sm" className="mt-2 w-fit">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#0A0A0A]/70">
                  Formed and locked on {APP_CONFIG.name} with 100% peer rating.
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
      </div>
    </div>
  );
}
