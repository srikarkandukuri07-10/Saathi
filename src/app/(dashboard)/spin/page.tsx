"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { APP_CONFIG } from "@/config/site";
import type { Profile } from "@/types/models";
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  Send,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Trophy,
} from "lucide-react";

interface CompatibleCandidate {
  id: string;
  name: string;
  college: string;
  city: string;
  role: string;
  skills: string[];
  score: number;
  reasons: string[];
  reliability: number;
}

const pool: CompatibleCandidate[] = [
  {
    id: "sp-1",
    name: "Sneha Reddy",
    college: "CBIT Hyderabad",
    city: "Hyderabad (HITEC City)",
    role: "Backend & LLM Agent Specialist",
    skills: ["Python", "FastAPI", "PyTorch", "LLMs & Agents"],
    score: 95,
    reasons: [
      "Complementary Stack: Solves your backend & AI modeling gap",
      "Both marked Full 24h Grind intensity",
      "Same metro area in Hyderabad (~4 km away)",
    ],
    reliability: 94,
  },
  {
    id: "sp-2",
    name: "Vikram Chandra",
    college: "VNR VJIET",
    city: "Hyderabad (Gachibowli)",
    role: "Hardware & IoT Systems Architect",
    skills: ["Arduino", "ESP32", "ROS2", "Robotics"],
    score: 91,
    reasons: [
      "Complementary Hardware Depth for Smart Automation",
      "Both aiming for 1st place in Smart India Hackathon",
      "Verified GitHub repositories & prior finalist badge",
    ],
    reliability: 90,
  },
  {
    id: "sp-3",
    name: "Pooja Varma",
    college: "BITS Pilani Hyderabad",
    city: "Hyderabad (Shamirpet)",
    role: "Product Designer & Demo Storyteller",
    skills: ["Figma UI/UX", "Pitch Deck", "Prototyping", "User Research"],
    score: 89,
    reasons: [
      "Key Gap Filled: Expert presentation & UI prototype lead",
      "Fairness boost: Rising builder with strong portfolio",
      "Verified BITS Pilani college credentials",
    ],
    reliability: 88,
  },
];

export default function LuckySpinPage() {
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [selectedCandidate, setSelectedCandidate] = React.useState<CompatibleCandidate | null>(null);
  const [spinCount, setSpinCount] = React.useState(0);
  const [introModalOpen, setIntroModalOpen] = React.useState(false);
  const [introNote, setIntroNote] = React.useState("");
  const [requestSent, setRequestSent] = React.useState(false);

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedCandidate(null);
    setRequestSent(false);

    // Pick candidate
    const nextCandidate = pool[spinCount % pool.length];

    setTimeout(() => {
      setSelectedCandidate(nextCandidate);
      setIsSpinning(false);
      setSpinCount((prev) => prev + 1);

      // Trigger celebratory confetti on reveal
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#B8F2C9", "#0A0A0A", "#FFFFFF"],
      });
    }, 1800);
  };

  const handleAcceptMatch = () => {
    if (!selectedCandidate) return;
    setIntroNote(
      `Hey ${selectedCandidate.name.split(" ")[0]}! We just matched through the Hackpact Mystery Teammate spin. Your ${selectedCandidate.role} background aligns perfectly with our hackathon squad. Would you like to team up?`
    );
    setIntroModalOpen(true);
  };

  const handleSendIntro = (e: React.FormEvent) => {
    e.preventDefault();
    setIntroModalOpen(false);
    setRequestSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="green">Opt-In Feature</Badge>
            <Badge variant="outline">Filtered Compatibility Only</Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Lucky Spin: Mystery Teammate
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#0A0A0A]/70 max-w-xl mx-auto leading-relaxed">
            Break the paralysis of searching. Our spin engine randomly pairs you with a <strong>verified, compatible builder</strong> who complements your missing skill gaps.
          </p>
        </div>

        {/* The Animated Spin Wheel Surface */}
        <div className="relative mx-auto max-w-md rounded-[24px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-8 shadow-[6px_6px_0px_#0A0A0A] space-y-6">
          <div className="relative flex items-center justify-center h-48 w-48 mx-auto">
            <motion.div
              animate={{ rotate: isSpinning ? 1440 : 0 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="h-full w-full rounded-full border-4 border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center shadow-[4px_4px_0px_#0A0A0A] relative"
            >
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#0A0A0A]/30 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-[#0A0A0A]" />
              </div>
            </motion.div>

            {/* Indicator Marker */}
            <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-[#0A0A0A] z-10" />
          </div>

          <div>
            <Button
              size="lg"
              onClick={handleSpin}
              disabled={isSpinning}
              className="w-full font-bold text-base shadow-[4px_4px_0px_#0A0A0A]"
            >
              <RotateCw className={`h-4 w-4 mr-2 ${isSpinning ? "animate-spin" : ""}`} />
              {isSpinning ? "Filtering Compatible Pool..." : "Spin Mystery Teammate"}
            </Button>
            <p className="text-[11px] text-[#0A0A0A]/60 mt-2 font-medium">
              Requires minimum 80% compatibility threshold &bull; Mutual accept shielded
            </p>
          </div>
        </div>

        {/* Revealed Match Card */}
        <AnimatePresence>
          {selectedCandidate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-xl text-left"
            >
              <Card className="border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-6 space-y-5">
                <div className="flex items-start justify-between pb-4 border-b border-[#0A0A0A]/10">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full border-2 border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-black text-xl text-[#0A0A0A]">
                      {selectedCandidate.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold tracking-tight">{selectedCandidate.name}</h3>
                        <Badge variant="green" size="sm">
                          {selectedCandidate.score}% Match
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-[#0A0A0A]/60 mt-0.5">
                        {selectedCandidate.college} &bull; {selectedCandidate.city}
                      </p>
                      <p className="text-xs font-bold text-[#0A0A0A] mt-1">
                        {selectedCandidate.role}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0A0A0A]/60 block">Reliability</span>
                    <span className="text-base font-black tabular-nums">{selectedCandidate.reliability}/100</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block">
                    Core Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.skills.map((s) => (
                      <Badge key={s} variant="subtle" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Plain-Language Why You Match Card */}
                <div className="p-4 rounded-[14px] border border-[#0A0A0A] bg-[#B8F2C9]/20 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] block">
                    Why This Spin Selected {selectedCandidate.name}:
                  </span>
                  <div className="space-y-1.5 text-xs text-[#0A0A0A]/85">
                    {selectedCandidate.reasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A0A0A] shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Row */}
                {requestSent ? (
                  <div className="p-4 rounded-[12px] border-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0A0A0A]">
                      🎉 Invitation sent! Chat unlocks upon mutual accept.
                    </span>
                    <Link href="/matches">
                      <Button variant="secondary" size="sm">
                        View Requests &rarr;
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="secondary"
                      onClick={handleSpin}
                      className="font-bold"
                    >
                      Skip / Spin Again
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAcceptMatch}
                      className="font-bold shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Accept & Connect
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Intro Note Dialog */}
      <Dialog
        isOpen={introModalOpen}
        onClose={() => setIntroModalOpen(false)}
        title="Send Introductory Note"
        description="Introduce yourself. Direct chat opens ONLY after mutual accept."
      >
        <form onSubmit={handleSendIntro} className="space-y-4">
          <Textarea
            label="Introductory Note"
            value={introNote}
            onChange={(e) => setIntroNote(e.target.value)}
            rows={4}
            required
          />
          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIntroModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold">
              Dispatch Request &rarr;
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
