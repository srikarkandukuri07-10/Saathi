"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { APP_CONFIG } from "@/config/site";
import { ProfileService } from "@/lib/services/profile";
import { calculateProfileCompleteness } from "@/lib/utils";
import type { Skill } from "@/types/models";
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Star,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface SelectedSkill {
  skillId: string;
  skillName: string;
  category: string;
  proficiency: number;
  isPrimary: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const availableSkills = React.useMemo(() => ProfileService.getStructuredSkills(), []);

  // Form states
  const [name, setName] = React.useState("Varun Sharma");
  const [college, setCollege] = React.useState("CBIT Hyderabad");
  const [year, setYear] = React.useState<number>(3);
  const [branch, setBranch] = React.useState("Artificial Intelligence & Data Science");
  const [cityId, setCityId] = React.useState("c0000000-0000-0000-0000-000000000001");
  const [cityName, setCityName] = React.useState("Hyderabad");
  const [area, setArea] = React.useState("Madhapur");
  const [bio, setBio] = React.useState(
    "Full-stack & AI builder. Looking to form a high-commitment 24h grind squad for Smart India Hackathon and HackHyderabad."
  );
  const [linkedinUrl, setLinkedinUrl] = React.useState("https://linkedin.com/in/varunsharma-dev");
  const [githubUrl, setGithubUrl] = React.useState("https://github.com/varunsharma");
  const [portfolioUrl, setPortfolioUrl] = React.useState("https://varun.dev");

  const [goals, setGoals] = React.useState<"win" | "learn" | "balanced">("win");
  const [intensity, setIntensity] = React.useState<"casual" | "serious" | "grind">("grind");
  const [availability, setAvailability] = React.useState<"online_only" | "offline_city" | "willing_to_travel">("offline_city");
  const [travelCities, setTravelCities] = React.useState<string[]>(["Hyderabad", "Bengaluru"]);

  const [selectedSkills, setSelectedSkills] = React.useState<SelectedSkill[]>([
    { skillId: "s1", skillName: "Next.js / React", category: "frontend", proficiency: 5, isPrimary: true },
    { skillId: "s5", skillName: "Python / FastAPI", category: "backend", proficiency: 4, isPrimary: false },
    { skillId: "s8", skillName: "LLMs & AI Agents", category: "ml_ai", proficiency: 4, isPrimary: true },
  ]);

  const [customSkillInput, setCustomSkillInput] = React.useState("");

  // India DPDP & Age Consents
  const [ageConsent, setAgeConsent] = React.useState(true);
  const [privacyConsent, setPrivacyConsent] = React.useState(true);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Dynamic profile completeness
  const completeness = React.useMemo(() => {
    return calculateProfileCompleteness({
      name,
      college,
      year,
      branch,
      city_id: cityId,
      city_name: cityName,
      linkedin_url: linkedinUrl,
      github_url: githubUrl,
      portfolio_url: portfolioUrl,
      goals,
      intensity,
      availability,
      skills: selectedSkills.map((s, idx) => ({
        id: `s-${idx}`,
        profile_id: "tmp",
        skill_id: s.skillId,
        proficiency: s.proficiency,
        is_primary: s.isPrimary,
      })),
      projects: [{ id: "1", profile_id: "tmp", title: "Showcase", description: "Demo", tech_stack: ["TS"] }],
    });
  }, [name, college, year, branch, cityId, cityName, linkedinUrl, githubUrl, portfolioUrl, goals, intensity, availability, selectedSkills]);

  const handleAddSkill = (skill: Skill) => {
    if (selectedSkills.some((s) => s.skillId === skill.id)) return;
    setSelectedSkills([
      ...selectedSkills,
      {
        skillId: skill.id,
        skillName: skill.name,
        category: skill.category,
        proficiency: 3,
        isPrimary: selectedSkills.length === 0,
      },
    ]);
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const handleProficiencyChange = (skillId: string, level: number) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.skillId === skillId ? { ...s, proficiency: level } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (completeness < APP_CONFIG.minProfileCompleteness) {
      setErrorMessage(`Profile completeness must be at least ${APP_CONFIG.minProfileCompleteness}% to unlock hackathon team matching (Current: ${completeness}%).`);
      return;
    }

    if (!linkedinUrl.includes("linkedin.com/")) {
      setErrorMessage("Please enter a valid LinkedIn URL.");
      return;
    }

    if (!githubUrl.includes("github.com/")) {
      setErrorMessage("Please enter a valid GitHub profile URL.");
      return;
    }

    if (!ageConsent || !privacyConsent) {
      setErrorMessage("You must agree to the DPDP Act age gate and data consent requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ProfileService.saveProfile("user_me", {
        name,
        college,
        year,
        branch,
        cityId,
        cityName,
        area,
        bio,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        goals,
        intensity,
        availability,
        travelCities,
        skills: selectedSkills,
        ageConsentConfirmed: ageConsent,
        privacyConsentConfirmed: privacyConsent,
      });

      router.push("/matches?onboarding=success");
    } catch {
      setErrorMessage("Failed to save profile. Please review your entries.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-10 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="green">Mandatory Onboarding</Badge>
            <Badge variant="outline">Gated Matching</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Build Your Competitive Profile
          </h1>
          <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
            {APP_CONFIG.name} is a selective community. We match teams using real skill signals and commitment levels.
            Matching unlocks once your profile hits <strong>{APP_CONFIG.minProfileCompleteness}%</strong>.
          </p>
        </div>

        {/* Completeness Meter Sticky Box */}
        <div className="sticky top-18 z-30 rounded-[18px] border-2 border-[#0A0A0A] bg-[#FFFFFF] p-5 shadow-[4px_4px_0px_#0A0A0A]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0A0A0A]">
                Profile Completeness Meter
              </span>
              {completeness >= APP_CONFIG.minProfileCompleteness ? (
                <Badge variant="green" size="sm">
                  <CheckCircle2 className="h-3 w-3 inline mr-1" /> Matching Unlocked
                </Badge>
              ) : (
                <Badge variant="black" size="sm">
                  <Lock className="h-3 w-3 inline mr-1" /> {APP_CONFIG.minProfileCompleteness - completeness}% Needed to Unlock
                </Badge>
              )}
            </div>
            <span className="text-base font-extrabold tabular-nums">{completeness}%</span>
          </div>
          <Progress value={completeness} showPercentage={false} />
        </div>

        {errorMessage && (
          <Alert status="error" title="Action Required">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Basic Info */}
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>1. Academic & Locality Credentials</CardTitle>
              <CardDescription>
                We launch city by city (starting in {APP_CONFIG.initialCity}) so teams can meet in person.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Varun Sharma"
                  required
                />
                <Input
                  label="College / University"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. CBIT / IIIT Hyderabad"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                    <option value={5}>5th Year / Masters</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Input
                    label="Degree / Major Branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science, AI & DS"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
                    City
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => {
                      setCityId(e.target.value);
                      setCityName(e.target.options[e.target.selectedIndex].text);
                    }}
                    className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                  >
                    <option value="c0000000-0000-0000-0000-000000000001">
                      Hyderabad (Active Chapter)
                    </option>
                    <option value="c0000000-0000-0000-0000-000000000002">
                      Bengaluru (Waitlist)
                    </option>
                    <option value="c0000000-0000-0000-0000-000000000003">
                      Pune (Waitlist)
                    </option>
                  </select>
                </div>

                <Input
                  label="Area / Neighborhood"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Madhapur, Gachibowli, Kukatpally"
                  helperText="Your approximate distance band is shared; exact GPS is kept private"
                  required
                />
              </div>

              <Textarea
                label="Bio & Hackathon Pitch"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe what you build, your favorite stack, and what you expect from teammates..."
                required
              />
            </CardContent>
          </Card>

          {/* 2. Required Links */}
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>2. Proof & Identity Links (Required)</CardTitle>
              <CardDescription>
                Zero-tolerance for anonymous or fake accounts. GitHub and LinkedIn are verified to ensure team quality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn Profile URL (Required)"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  required
                />
                <Input
                  label="GitHub Profile URL (Required)"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  helperText="We automatically pull your public repo count & language stats"
                  required
                />
              </div>

              <Input
                label="Portfolio / Personal Website (Optional)"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourname.dev"
              />
            </CardContent>
          </Card>

          {/* 3. Structured Skill Picker */}
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>3. Structured Skills & Proficiency (1-5)</CardTitle>
              <CardDescription>
                Select your skills. Complementary skills between team members carry 40% weight in the matching algorithm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Selected Skills */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60">
                  Your Selected Tech Stack ({selectedSkills.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSkills.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] p-3 flex flex-col justify-between shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[#0A0A0A]">{skill.skillName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.skillId)}
                          className="text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#0A0A0A]/10">
                        <span className="text-[#0A0A0A]/60">Proficiency:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleProficiencyChange(skill.skillId, lvl)}
                              className={`h-6 w-6 rounded-full text-xs font-bold border transition-colors ${
                                skill.proficiency >= lvl
                                  ? "bg-[#B8F2C9] border-[#0A0A0A] text-[#0A0A0A]"
                                  : "border-[#0A0A0A]/20 text-[#0A0A0A]/40"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Catalog Picker */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]/60">
                  Add From Structured Catalog
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-3 border border-[#0A0A0A]/15 rounded-[12px] bg-[#0A0A0A]/[0.02]">
                  {availableSkills.map((skill) => {
                    const isSelected = selectedSkills.some((s) => s.skillId === skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleAddSkill(skill)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#0A0A0A] text-[#FFFFFF] border-[#0A0A0A] opacity-30 cursor-not-allowed"
                            : "bg-[#FFFFFF] border-[#0A0A0A]/20 hover:border-[#0A0A0A] text-[#0A0A0A]"
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{skill.name}</span>
                        <span className="text-[10px] opacity-50">({skill.category})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Goals & Intensity */}
          <Card className="border-2 border-[#0A0A0A]">
            <CardHeader>
              <CardTitle>4. Goals & Intensity Level</CardTitle>
              <CardDescription>
                Ghosting happens when a casual hacker pairs with someone aiming for 1st place. Align upfront.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-bold text-[#0A0A0A] block mb-2">
                  What is your primary goal?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "win", title: "Here to Win", desc: "Top prize or bust. Intense preparation & execution." },
                    { id: "learn", title: "Here to Learn", desc: "Experiment with new tech stacks & gain experience." },
                    { id: "balanced", title: "Balanced", desc: "Compete seriously while learning and networking." },
                  ].map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setGoals(g.id as any)}
                      className={`cursor-pointer rounded-[14px] p-4 border transition-all ${
                        goals === g.id
                          ? "bg-[#B8F2C9] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                          : "bg-[#FFFFFF] border-[#0A0A0A]/20 hover:border-[#0A0A0A]/50"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{g.title}</h4>
                      <p className="text-xs text-[#0A0A0A]/70 mt-1">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-[#0A0A0A] block mb-2">
                  What is your expected intensity?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "casual", title: "Casual", desc: "Work a few hours; regular sleep cycle." },
                    { id: "serious", title: "Serious", desc: "Dedicated deep work; minimal distraction." },
                    { id: "grind", title: "Full 24h Grind", desc: "Red Bull, all-nighter, ship a production demo." },
                  ].map((i) => (
                    <div
                      key={i.id}
                      onClick={() => setIntensity(i.id as any)}
                      className={`cursor-pointer rounded-[14px] p-4 border transition-all ${
                        intensity === i.id
                          ? "bg-[#B8F2C9] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                          : "bg-[#FFFFFF] border-[#0A0A0A]/20 hover:border-[#0A0A0A]/50"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{i.title}</h4>
                      <p className="text-xs text-[#0A0A0A]/70 mt-1">{i.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-[#0A0A0A] block mb-2">
                  Hackathon Mode Availability
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "offline_city", title: "Offline Within City", desc: "Attend in-person events in Hyderabad." },
                    { id: "willing_to_travel", title: "Willing to Travel", desc: "Can travel to Bengaluru/Delhi for finals." },
                    { id: "online_only", title: "Online Only", desc: "Only participate in remote virtual hackathons." },
                  ].map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setAvailability(a.id as any)}
                      className={`cursor-pointer rounded-[14px] p-4 border transition-all ${
                        availability === a.id
                          ? "bg-[#B8F2C9] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]"
                          : "bg-[#FFFFFF] border-[#0A0A0A]/20 hover:border-[#0A0A0A]/50"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{a.title}</h4>
                      <p className="text-xs text-[#0A0A0A]/70 mt-1">{a.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. India DPDP Compliance & Consent */}
          <Card className="border-2 border-[#0A0A0A] bg-[#0A0A0A]/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0A0A0A]" />
                <CardTitle>5. Legal & DPDP Act Consent (India)</CardTitle>
              </div>
              <CardDescription>
                In compliance with the Digital Personal Data Protection Act (DPDP) 2023.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageConsent}
                  onChange={(e) => setAgeConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#0A0A0A] text-[#0A0A0A] focus:ring-[#0A0A0A]"
                />
                <span className="text-xs text-[#0A0A0A]/80">
                  <strong>Age Declaration:</strong> I confirm I am 18 years of age or older, or have parental/guardian consent to participate in external hackathons.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#0A0A0A] text-[#0A0A0A] focus:ring-[#0A0A0A]"
                />
                <span className="text-xs text-[#0A0A0A]/80">
                  <strong>Granular Matching Consent:</strong> I authorize {APP_CONFIG.name} to process my skill tags, city, and approximate distance bands solely to compute teammate suggestions. I understand my exact GPS coordinates will never be shown to other users.
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-[#0A0A0A]">
            <div className="text-xs text-[#0A0A0A]/70">
              Profile Completeness: <strong className="text-[#0A0A0A]">{completeness}%</strong> (Threshold: {APP_CONFIG.minProfileCompleteness}%)
            </div>
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              disabled={completeness < APP_CONFIG.minProfileCompleteness}
              className="w-full sm:w-auto font-bold text-base shadow-[4px_4px_0px_#0A0A0A]"
            >
              Unlock Teammate Matching <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
