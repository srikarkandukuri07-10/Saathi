"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { APP_CONFIG } from "@/config/site";
import { parseHackathonCsv } from "@/lib/utils/csv";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Upload,
  UserX,
  FileSpreadsheet,
  Activity,
} from "lucide-react";

interface AdminProfile {
  id: string;
  name: string;
  college?: string;
  email: string;
  isBanned: boolean;
  completeness: number;
  skills: Array<{ name: string; category: string; proficiency: number }>;
}

interface VerificationItem {
  id: string;
  profileId: string;
  userName: string;
  college?: string;
  type: string;
  status: string;
  proofUrl?: string;
  createdAt: string;
}

interface ReportItem {
  id: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface HackathonOption {
  id: string;
  name: string;
  city_name?: string;
}

interface CityStat {
  cityId: string;
  cityName: string;
  currentCount: number;
  targetCount: number;
  remaining: number;
  percentage: number;
  isActive: boolean;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = React.useState<
    "concierge" | "verifications" | "hackathons" | "cities" | "reports" | "health"
  >("concierge");

  const [profiles, setProfiles] = React.useState<AdminProfile[]>([]);
  const [verifications, setVerifications] = React.useState<VerificationItem[]>([]);
  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [hackathons, setHackathons] = React.useState<HackathonOption[]>([]);
  const [cities, setCities] = React.useState<CityStat[]>([]);
  const [health, setHealth] = React.useState<Record<string, unknown> | null>(null);

  const [candidateA, setCandidateA] = React.useState("");
  const [candidateB, setCandidateB] = React.useState("");
  const [conciergeHackathon, setConciergeHackathon] = React.useState("");
  const [conciergeSuccess, setConciergeSuccess] = React.useState<string | null>(null);

  const [csvContent, setCsvContent] = React.useState("");
  const [csvNotice, setCsvNotice] = React.useState<string | null>(null);

  const [modNotice, setModNotice] = React.useState<string | null>(null);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Load the real admin payload.
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [adminRes, hackathonsRes, waitlistRes, healthRes] = await Promise.all([
          fetch("/api/admin", { cache: "no-store" }),
          fetch("/api/hackathons", { cache: "no-store" }),
          fetch("/api/waitlist", { cache: "no-store" }),
          fetch("/api/health", { cache: "no-store" }),
        ]);

        if (!adminRes.ok) {
          const body = await adminRes.json().catch(() => ({}));
          throw new Error(body.error ?? "The admin console is not available.");
        }

        const admin = await adminRes.json();
        if (cancelled) return;

        setProfiles(admin.profiles ?? []);
        setVerifications(admin.verifications ?? []);
        setReports(admin.reports ?? []);

        if (hackathonsRes.ok) {
          const body = await hackathonsRes.json();
          setHackathons(body.hackathons ?? []);
          setConciergeHackathon((current) => current || body.hackathons?.[0]?.id || "");
        }

        if (waitlistRes.ok) {
          const body = await waitlistRes.json();
          setCities(body.cities ?? []);
        }

        if (healthRes.ok) {
          setHealth(await healthRes.json());
        }
      } catch (error) {
        if (!cancelled) {
          setErrorNotice(
            error instanceof Error
              ? error.message
              : "The admin console could not be loaded."
          );
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

  const handleConciergeMatch = async () => {
    setErrorNotice(null);

    if (!candidateA || !candidateB || candidateA === candidateB) {
      setErrorNotice("Pick two different builders.");
      return;
    }

    if (!conciergeHackathon) {
      setErrorNotice("Pick the target hackathon.");
      return;
    }

    const profileA = profiles.find((p) => p.id === candidateA);
    const profileB = profiles.find((p) => p.id === candidateB);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: candidateA,
          receiverId: candidateB,
          hackathonId: conciergeHackathon,
          note: `Concierge introduction: ${profileA?.name} and ${profileB?.name} are a strong complementary pairing for this event.`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The introduction could not be created.");
      }

      setConciergeSuccess(
        `Introduction created between ${profileA?.name} and ${profileB?.name}. Both builders have been notified and the request is waiting for their acceptance.`
      );
    } catch (error) {
      setErrorNotice(
        error instanceof Error
          ? error.message
          : "The introduction could not be created."
      );
    }
  };

  const handleVerification = async (
    id: string,
    decision: "verified" | "rejected"
  ) => {
    setErrorNotice(null);

    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId: id, decision }),
      });

      if (!res.ok) throw new Error("The review could not be saved.");

      setVerifications((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "The review could not be saved."
      );
    }
  };

  const handleCsvImport = async () => {
    setErrorNotice(null);

    const rows = parseHackathonCsv(csvContent);
    if (rows.length === 0) {
      setErrorNotice("No valid rows found in the CSV.");
      return;
    }

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "The import failed.");
      }

      const body = await res.json();
      setCsvNotice(`Imported ${body.imported} external hackathon(s).`);
      setCsvContent("");
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "The import failed."
      );
    }
  };

  const handleResolveReport = async (id: string, status: "resolved" | "dismissed") => {
    setErrorNotice(null);

    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, status }),
      });

      if (!res.ok) throw new Error("The report could not be updated.");

      setReports((prev) =>
        prev.map((report) => (report.id === id ? { ...report, status } : report))
      );
      setModNotice(`Report marked as ${status}.`);
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "The report could not be updated."
      );
    }
  };

  const handleBanUser = async (profileId: string, name: string) => {
    setErrorNotice(null);

    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, banned: true }),
      });

      if (!res.ok) throw new Error("The moderation action failed.");

      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === profileId ? { ...profile, isBanned: true } : profile
        )
      );
      setModNotice(`"${name}" has been suspended and removed from matching.`);
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "The moderation action failed."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0A0A0A]/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
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

        {errorNotice && (
          <Alert status="error" title="Action failed">
            {errorNotice}
          </Alert>
        )}

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 border-b border-[#0A0A0A]/15 pb-3">
          {[
            { id: "concierge", label: "Concierge Matcher" },
            { id: "verifications", label: `Verification Queue (${verifications.length})` },
            { id: "hackathons", label: "Hackathons & CSV Import" },
            { id: "cities", label: "Cities & Waitlists" },
            { id: "reports", label: `Reports (${reports.length})` },
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

        {loading ? (
          <div className="text-center py-20 text-xs font-semibold text-[#0A0A0A]/60">
            Loading the admin console...
          </div>
        ) : (
          <>
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
                      Introduce two builders to each other. The request still needs a
                      mutual accept before the chat opens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-bold text-[#0A0A0A] block mb-1.5">
                          Builder A
                        </label>
                        <select
                          value={candidateA}
                          onChange={(e) => setCandidateA(e.target.value)}
                          className="w-full h-11 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] px-3.5 text-xs font-bold"
                        >
                          <option value="">Select a builder</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                              {profile.college ? ` (${profile.college})` : ""} &bull;{" "}
                              {profile.completeness}%
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-[#0A0A0A] block mb-1.5">
                          Builder B
                        </label>
                        <select
                          value={candidateB}
                          onChange={(e) => setCandidateB(e.target.value)}
                          className="w-full h-11 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] px-3.5 text-xs font-bold"
                        >
                          <option value="">Select a builder</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                              {profile.college ? ` (${profile.college})` : ""} &bull;{" "}
                              {profile.completeness}%
                            </option>
                          ))}
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
                        <option value="">Select an event</option>
                        {hackathons.map((hackathon) => (
                          <option key={hackathon.id} value={hackathon.id}>
                            {hackathon.name}
                            {hackathon.city_name ? ` (${hackathon.city_name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleConciergeMatch}
                      disabled={!candidateA || !candidateB || !conciergeHackathon}
                      className="w-full font-bold shadow-[4px_4px_0px_#0A0A0A]"
                    >
                      <Sparkles className="h-4 w-4 mr-2" /> Introduce the Two Builders
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 2. VERIFICATION QUEUE */}
            {activeTab === "verifications" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">
                  Proof &amp; Credential Verification Queue
                </h2>

                {verifications.length === 0 ? (
                  <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
                    <CardContent>
                      <p className="text-sm font-bold text-[#0A0A0A]">
                        Nothing is waiting for review
                      </p>
                      <p className="text-xs text-[#0A0A0A]/60 mt-1">
                        Verification requests submitted by builders land here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {verifications.map((item) => (
                      <Card
                        key={item.id}
                        className="border-2 border-[#0A0A0A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-[#0A0A0A]">
                              {item.userName}
                            </span>
                            {item.college && (
                              <span className="text-xs text-[#0A0A0A]/60">
                                ({item.college})
                              </span>
                            )}
                            <Badge variant="subtle" size="sm">
                              {item.type}
                            </Badge>
                          </div>
                          {item.proofUrl ? (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold underline text-[#0A0A0A]"
                            >
                              Inspect Proof Link &rarr;
                            </a>
                          ) : (
                            <p className="text-xs text-[#0A0A0A]/60">
                              No proof link was attached to this request.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVerification(item.id, "rejected")}
                            className="font-bold text-xs"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleVerification(item.id, "verified")}
                            className="font-bold text-xs shadow-[2px_2px_0px_#0A0A0A]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve &amp; Issue Badge
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
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
                      Paste CSV with columns: Name, Organizer, Mode, City, Deadline,
                      Theme, PrizePool, WebsiteUrl
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder={
                        "Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl\n" +
                        "Smart Telangana Hackathon, Govt of Telangana, offline, Hyderabad, 2026-11-20, GovTech, 200000, https://telangana.gov.in"
                      }
                      rows={6}
                    />
                    <Button
                      onClick={handleCsvImport}
                      disabled={!csvContent.trim()}
                      className="font-bold shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Ingest &amp; Publish Hackathons
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#0A0A0A] p-4">
                  <h3 className="font-bold text-lg mb-3">
                    Published events ({hackathons.length})
                  </h3>
                  {hackathons.length === 0 ? (
                    <p className="text-xs text-[#0A0A0A]/60">
                      No events are published yet. Import them above.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {hackathons.map((hackathon) => (
                        <div
                          key={hackathon.id}
                          className="flex items-center justify-between text-xs border-b border-[#0A0A0A]/10 pb-2"
                        >
                          <span className="font-bold text-[#0A0A0A]">
                            {hackathon.name}
                          </span>
                          <span className="text-[#0A0A0A]/60">
                            {hackathon.city_name ?? "Online"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* 4. CITIES & WAITLISTS */}
            {activeTab === "cities" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">
                  Per-City Cold-Start Status
                </h2>

                {cities.length === 0 ? (
                  <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
                    <CardContent>
                      <p className="text-sm font-bold text-[#0A0A0A]">
                        No city chapters yet
                      </p>
                      <p className="text-xs text-[#0A0A0A]/60 mt-1">
                        Add rows to the `cities` table to open a chapter.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cities.map((city) => (
                      <Card key={city.cityId} className="border-2 border-[#0A0A0A]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-lg">{city.cityName}</h3>
                          <Badge variant={city.isActive ? "green" : "subtle"}>
                            {city.isActive ? "Active Chapter" : "Waitlist Phase"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#0A0A0A]/70 mb-4">
                          Cold-start status: {city.currentCount} / {city.targetCount} joined (
                          {city.percentage}%). {city.remaining} spots left.
                        </p>
                        <Progress
                          value={city.currentCount}
                          max={city.targetCount}
                          showPercentage={false}
                        />
                      </Card>
                    ))}
                  </div>
                )}
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

                <h2 className="text-xl font-bold tracking-tight">
                  Active Moderation &amp; Ghosting Reports
                </h2>

                {reports.length === 0 ? (
                  <Card className="border-2 border-[#0A0A0A] border-dashed p-10 text-center">
                    <CardContent>
                      <p className="text-sm font-bold text-[#0A0A0A]">
                        No open reports
                      </p>
                      <p className="text-xs text-[#0A0A0A]/60 mt-1">
                        Safety reports filed by builders appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <Card key={report.id} className="border-2 border-[#0A0A0A] p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-[#0A0A0A]">
                                Reported: {report.reportedName}
                              </span>
                              <Badge variant="black" size="sm">
                                {report.reason}
                              </Badge>
                              <Badge variant="subtle" size="sm">
                                {report.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#0A0A0A]/80">
                              Reported by {report.reporterName}.
                              {report.description ? ` ${report.description}` : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "dismissed")}
                              className="font-bold"
                            >
                              Dismiss
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "resolved")}
                              className="font-bold"
                            >
                              Mark resolved
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <Card className="border-2 border-[#0A0A0A] p-4">
                  <h3 className="font-bold text-lg mb-3">Builder pool</h3>
                  {profiles.length === 0 ? (
                    <p className="text-xs text-[#0A0A0A]/60">
                      No builders have onboarded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profiles.slice(0, 25).map((profile) => (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between gap-3 text-xs border-b border-[#0A0A0A]/10 pb-2"
                        >
                          <div>
                            <span className="font-bold text-[#0A0A0A]">
                              {profile.name}
                            </span>
                            <span className="text-[#0A0A0A]/60">
                              {" "}
                              &bull; {profile.college ?? "No college"} &bull;{" "}
                              {profile.completeness}% complete
                            </span>
                            {profile.isBanned && (
                              <Badge variant="black" size="sm" className="ml-2">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          {!profile.isBanned && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBanUser(profile.id, profile.name)}
                              className="font-bold"
                            >
                              <UserX className="h-3.5 w-3.5 mr-1" /> Suspend
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* 6. HEALTH & AUDIT */}
            {activeTab === "health" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight">
                  System Health &amp; Latency
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-2 border-[#0A0A0A]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                      Database &amp; PostGIS
                    </span>
                    <span className="text-xl font-black text-[#0A0A0A]">
                      {String(
                        (health?.services as Record<string, string>)?.database ?? "unknown"
                      )}
                    </span>
                  </Card>
                  <Card className="border-2 border-[#0A0A0A]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                      Realtime &amp; Redis
                    </span>
                    <span className="text-xl font-black text-[#0A0A0A]">
                      {String(
                        (health?.services as Record<string, string>)?.realtime ?? "unknown"
                      )}
                    </span>
                  </Card>
                  <Card className="border-2 border-[#0A0A0A]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60 block mb-1">
                      Builders &amp; Squads
                    </span>
                    <span className="text-xl font-black text-[#0A0A0A]">
                      {profiles.length} builders
                    </span>
                  </Card>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/60">
                  <Activity className="h-4 w-4" />
                  <span>
                    Read directly from the platform health endpoint - no cached values.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
