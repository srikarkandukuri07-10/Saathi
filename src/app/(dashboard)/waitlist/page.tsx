"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { WaitlistService } from "@/lib/services/waitlist";
import { APP_CONFIG } from "@/config/site";
import {
  Sparkles,
  Share2,
  Copy,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function WaitlistPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [college, setCollege] = React.useState("");
  const [cityId, setCityId] = React.useState("c0000000-0000-0000-0000-000000000001");
  const [cityName, setCityName] = React.useState("Hyderabad");

  const [stats, setStats] = React.useState({
    currentCount: 23,
    targetCount: 50,
    remaining: 27,
    percentage: 46,
    cityName: "Hyderabad",
  });

  const [joinedLink, setJoinedLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const data = await WaitlistService.getCityWaitlistStats(cityId);
      setStats(data);
    }
    load();
  }, [cityId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    const res = await WaitlistService.joinWaitlist({
      name,
      email,
      cityId,
      cityName,
      college,
    });

    setIsSubmitting(false);
    setJoinedLink(res.referralLink);
    setStats((prev) => ({
      ...prev,
      currentCount: prev.currentCount + 1,
      remaining: Math.max(0, prev.remaining - 1),
      percentage: Math.round(((prev.currentCount + 1) / prev.targetCount) * 100),
    }));
  };

  const copyLink = () => {
    if (joinedLink) {
      navigator.clipboard.writeText(joinedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] px-3.5 py-1 text-xs font-bold text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Target Launch: {stats.cityName}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Hyderabad Chapter Waitlist
          </h1>
          <p className="text-sm sm:text-base text-[#0A0A0A]/70 leading-relaxed">
            We launch city by city to ensure every offline hackathon has high team density. Full matching pool unlocks at <strong>{stats.targetCount} verified builders</strong>.
          </p>
        </div>

        {/* Milestone Tracker Card */}
        <div className="rounded-[22px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-8 shadow-[6px_6px_0px_#0A0A0A] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                Progress to Unlock:
              </span>
              <div className="text-3xl sm:text-4xl font-black tabular-nums">
                {stats.currentCount} / {stats.targetCount} Builders Joined
              </div>
            </div>
            <Badge variant="black" size="md" className="font-bold">
              {stats.remaining} spots remaining for Founding Member badge
            </Badge>
          </div>

          <div className="space-y-2">
            <Progress value={stats.currentCount} max={stats.targetCount} showPercentage={true} />
            <div className="flex justify-between text-xs text-[#0A0A0A]/60 font-semibold">
              <span>0 Joined</span>
              <span>50 Goal (Matching Unlocked)</span>
            </div>
          </div>

          {/* Founding Member Perks */}
          <div className="pt-4 border-t border-[#0A0A0A]/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Award className="h-4 w-4 text-[#0A0A0A]" />
              <span>Founding Member profile badge</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Users className="h-4 w-4 text-[#0A0A0A]" />
              <span>Priority concierge match queue</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-[#0A0A0A]" />
              <span>Guaranteed invite codes for friends</span>
            </div>
          </div>
        </div>

        {/* Join Waitlist Form or Referral Link Display */}
        {joinedLink ? (
          <div className="rounded-[20px] border-2 border-[#0A0A0A] bg-[#B8F2C9]/30 p-8 shadow-[4px_4px_0px_#0A0A0A] space-y-4 text-center">
            <div className="h-12 w-12 rounded-full border-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6 text-[#0A0A0A]" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">
              You&apos;re in the Hyderabad Founding 50!
            </h3>
            <p className="text-xs text-[#0A0A0A]/70 max-w-md mx-auto">
              Share your referral link with college peers. Every peer who joins brings Hyderabad closer to unlocking matching.
            </p>

            <div className="flex items-center justify-center gap-2 max-w-md mx-auto pt-2">
              <input
                type="text"
                readOnly
                value={joinedLink}
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] text-xs font-mono font-bold"
              />
              <Button onClick={copyLink} className="shrink-0 font-bold shadow-[2px_2px_0px_#0A0A0A]">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-2 border-[#0A0A0A] max-w-xl mx-auto shadow-[4px_4px_0px_#0A0A0A]">
            <CardHeader>
              <CardTitle>Join the Hyderabad Waitlist</CardTitle>
              <CardDescription>
                Zero spam. You will be notified the instant 50 members join.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siddharth Verma"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu.in"
                  helperText="College email unlocks student verification badge"
                  required
                />
                <Input
                  label="College / Institute"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. IIIT Hyderabad / CBIT / BITS"
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full font-bold shadow-[2px_2px_0px_#0A0A0A]"
                >
                  Claim Hyderabad Spot & Get Referral Link <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
