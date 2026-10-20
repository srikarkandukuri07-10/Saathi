"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { HackathonService } from "@/lib/services/hackathon";
import { APP_CONFIG } from "@/config/site";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Calendar,
  Upload,
  AlertOctagon,
  UserCheck,
  UserX,
  Sparkles,
  Search,
  Activity,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = React.useState<
    "concierge" | "verifications" | "hackathons" | "cities" | "reports" | "health"
  >("concierge");

  // Concierge State
  const [candidateA, setCandidateA] = React.useState("u-1");
  const [candidateB, setCandidateB] = React.useState("u-2");
  const [conciergeHackathon, setConciergeHackathon] = React.useState("20000000-0000-0000-0000-000000000001");
  const [conciergeSuccess, setConciergeSuccess] = React.useState<string | null>(null);

  // CSV Import State
  const [csvContent, setCsvContent] = React.useState("");
  const [csvNotice, setCsvNotice] = React.useState<string | null>(null);

  // Moderation state
  const [bannedUsers, setBannedUsers] = React.useState<string[]>([]);
  const [modNotice, setModNotice] = React.useState<string | null>(null);

  // Mock verification items
  const [verificationQueue, setVerificationQueue] = React.useState([
    {
      id: "v-q1",
      userName: "Karthik Raja",
      college: "CBIT Hyderabad",
      type: "Certificate Upload",
      eventName: "Smart India Hackathon 2025 Finalist",
      proofUrl: "https://devpost.com/software/example",
      status: "pending",
    },
    {
      id: "v-q2",
      userName: "Meghana P",
      college: "VNR VJIET",
      type: "Devfolio Proof Link",
      eventName: "EthIndia 2024 Top 10",
      proofUrl: "https://devfolio.co/submissions/example",
      status: "pending",
    },
  ]);

  const handleConciergeMatch = () => {
    setConciergeSuccess(
      "ðŸŽ‰ Concierge Introduction Sent! Mutual chat channel opened and notification dispatched to both builders."
    );
    setTimeout(() => setConciergeSuccess(null), 5000);
  };

  const handleApproveVerification = (id: string) => {
    setVerificationQueue((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "verified" } : v))
    );
  };

  const handleCsvImport = () => {
    const parsed = HackathonService.parseCSV(csvContent);
    parsed.forEach((h) => HackathonService.createHackathon(h));
    setCsvNotice(`Successfully imported ${parsed.length} external hackathons!`);
    setCsvContent("");
    setTimeout(() => setCsvNotice(null), 4000);
  };

  const handleBanUser = (name: string) => {
    setBannedUsers([...bannedUsers, name]);
    setModNotice(`User "${name}" suspended and removed from matching algorithms.`);
    setTimeout(() => setModNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="black">
                <ShieldCheck className="h-3 w-3 inline mr-1" /> Superadmin Console
              </Badge>
              <Badge variant="green">Strict Zero-Trust RLS</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {APP_CONFIG.name} Admin Portal
            </h1>
            <p className="mt-1 text-sm text-[#0A0A0A]/70">
              Concierge manual matching, verification review, city cold-start thresholds, and hackathon ingestion.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 border-b border-[#0A0A0A]/15 pb-3">
          {[
            { id: "concierge", label: "Concierge Matcher (First 50)" },
            { id: "verifications", label: "Verification Queue (2)" },
            { id: "hackathons", label: "Hackathons & CSV Import" },
            { id: "cities", label: "Cities & Waitlists" },
            { id: "reports", label: "Reports & Moderation" },
            { id: "health", label: "System Health & Audit" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-[10px] text-xs font-bold border transition-all ${
                activeTab === tab.id
                  ? "bg-[#B8F2C9] border-[#0A0A0A] text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                  : "bg-[#FFFFFF] border-[#0A0A0A]/20 text-[#0A0A0A]/60 hover:border-[#0A0A0A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. CONCIERGE MATCHING TOOL */}
        {activeTab === "concierge" && (
          <div className="space-y-6">
            {conciergeSuccess && (
              <Alert status="success" title="Concierge Dispatched">
                {conciergeSuccess}
              </Alert>
            )}

            <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
              <CardHeader>
                <Badge variant="green" size="sm" className="w-fit mb-2">
                  Launch Cold-Start Accelerator
                </Badge>
                <CardTitle>Manual Concierge Introduction</CardTitle>
                <CardDescription>
                  Manually introduce and match the first 50 builders in Hyderabad. Bypasses waiting and creates an instant introductory team chat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-[#0A0A0A] block mb-1.5">
                      Builder A (Hyderabad Queue)
                    </label>
                    <select
                      value={candidateA}
                      onChange={(e) => setCandidateA(e.target.value)}
                      className="w-full h-11 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] px-3.5 text-xs font-bold"
                    >
                      <option value="u-1">Aditya Narang (IIIT Hyd &bull; Frontend & Next.js)</option>
                      <option value="u-2">Sneha Reddy (CBIT &bull; Backend & PyTorch)</option>
                      <option value="u-3">Vikram Chandra (VNR &bull; Hardware IoT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-[#0A0A0A] block mb-1.5">
                      Builder B (Hyderabad Queue)
                    </label>
                    <select
                      value={candidateB}
                      onChange={(e) => setCandidateB(e.target.value)}
                      className="w-full h-11 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] px-3.5 text-xs font-bold"
                    >
                      <option value="u-2">Sneha Reddy (CBIT &bull; Backend & PyTorch)</option>
                      <option value="u-3">Vikram Chandra (VNR &bull; Hardware IoT)</option>
                      <option value="u-1">Aditya Narang (IIIT Hyd &bull; Frontend & Next.js)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#0A0A0A] block mb-1.5">
                    Target External Hackathon
                  </label>
                  <select
                    value={conciergeHackathon}
                    onChange={(e) => setConciergeHackathon(e.target.value)}
                    className="w-full h-11 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] px-3.5 text-xs font-bold"
                  >
                    <option value="20000000-0000-0000-0000-000000000001">Smart India Hackathon 2026 (Hyderabad)</option>
                    <option value="20000000-0000-0000-0000-000000000002">HackHyderabad 2026 (T-Hub)</option>
                    <option value="20000000-0000-0000-0000-000000000003">EthIndia 2026</option>
                  </select>
                </div>

                <div className="p-4 rounded-[14px] border border-[#0A0A0A] bg-[#B8F2C9]/25 text-xs space-y-1">
                  <span className="font-bold text-[#0A0A0A] block">Concierge Algorithmic Check:</span>
                  <p className="text-[#0A0A0A]/80">
                    Pairing Aditya Narang & Sneha Reddy creates a <strong>95% compatibility score</strong> (Frontend + ML/Backend, both 24h grind, both based in Hyderabad).
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleConciergeMatch}
                  className="w-full font-bold shadow-[4px_4px_0px_#0A0A0A]"
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Introduce & Open Mutual Workspace Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. VERIFICATION QUEUE */}
        {activeTab === "verifications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Proof & Credential Verification Queue</h2>
            <div className="space-y-3">
              {verificationQueue.map((item) => (
                <Card key={item.id} className="border-2 border-[#0A0A0A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-[#0A0A0A]">{item.userName}</span>
                      <span className="text-xs text-[#0A0A0A]/60">({item.college})</span>
                      <Badge variant={item.status === "verified" ? "green" : "subtle"} size="sm">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#0A0A0A]/80">
                      <strong>Claim:</strong> {item.eventName} &bull; Type: {item.type}
                    </p>
                    <a
                      href={item.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold underline text-[#0A0A0A]"
                    >
                      Inspect Proof Link &rarr;
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "verified" ? (
                      <Badge variant="green">Verified & Badge Issued</Badge>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApproveVerification(item.id)}
                          className="font-bold text-xs"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveVerification(item.id)}
                          className="font-bold text-xs shadow-[2px_2px_0px_#0A0A0A]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Issue Badge
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3. HACKATHONS & CSV IMPORT */}
        {activeTab === "hackathons" && (
          <div className="space-y-6">
            {csvNotice && (
              <Alert status="success" title="Ingestion Complete">
                {csvNotice}
              </Alert>
            )}

            <Card className="border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0A0A0A]" />
                  <CardTitle>Bulk CSV Hackathon Importer</CardTitle>
                </div>
                <CardDescription>
                  Upload or paste CSV with columns: Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl&#10;Smart Telangana Hackathon, Govt of Telangana, offline, Hyderabad, 2026-11-20, GovTech, â‚¹200000, https://telangana.gov.in&#10;Global Solana Breakpoint, Solana, hybrid, Bengaluru, 2026-12-05, Web3, $50000, https://solana.com`}
                  rows={6}
                />
                <Button
                  onClick={handleCsvImport}
                  disabled={!csvContent.trim()}
                  className="font-bold shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <Upload className="h-4 w-4 mr-2" /> Ingest & Publish Hackathons
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 4. CITIES & WAITLISTS */}
        {activeTab === "cities" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Per-City Cold-Start Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-[#0A0A0A]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">Hyderabad Chapter</h3>
                  <Badge variant="green">Active Chapter</Badge>
                </div>
                <p className="text-xs text-[#0A0A0A]/70 mb-4">
                  Cold-start status: 23 / 50 Joined (46%). Automatic matching triggers at 50 members.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Generate Ambassador Codes
                  </Button>
                </div>
              </Card>

              <Card className="border-2 border-[#0A0A0A]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">Bengaluru Chapter</h3>
                  <Badge variant="subtle">Waitlist Phase</Badge>
                </div>
                <p className="text-xs text-[#0A0A0A]/70 mb-4">
                  Cold-start status: 12 / 50 Joined (24%).
                </p>
                <Button variant="outline" size="sm">
                  Activate Matching Early
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* 5. REPORTS & MODERATION */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {modNotice && (
              <Alert status="info" title="Moderation Action">
                {modNotice}
              </Alert>
            )}

            <h2 className="text-xl font-bold tracking-tight">Active Moderation & Ghosting Reports</h2>
            <Card className="border-2 border-[#0A0A0A] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[#0A0A0A]">Reported: Rohit K.</span>
                    <Badge variant="black" size="sm">No-Show / Ghosting</Badge>
                  </div>
                  <p className="text-xs text-[#0A0A0A]/80">
                    Reporter stated user locked team for SIH but stopped responding 24 hours prior to submission.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBanUser("Rohit K.")}
                    className="font-bold"
                  >
                    <UserX className="h-4 w-4 mr-1" /> Suspend & Penalize Reliability (-25 pts)
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 6. HEALTH & AUDIT */}
        {activeTab === "health" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">System Health & Latency</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2 border-[#0A0A0A]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                  Database & PostGIS
                </span>
                <span className="text-xl font-black text-[#0A0A0A]">Healthy (14ms)</span>
              </Card>
              <Card className="border-2 border-[#0A0A0A]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                  Redis Queue & Rate Limit
                </span>
                <span className="text-xl font-black text-[#0A0A0A]">Active</span>
              </Card>
              <Card className="border-2 border-[#0A0A0A]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                  RLS Security Policies
                </span>
                <span className="text-xl font-black text-[#0A0A0A]">Enforced on 27/27 Tables</span>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
