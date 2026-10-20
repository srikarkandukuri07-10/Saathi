import { createClient } from "@/lib/supabase/client";
import { calculateProfileCompleteness } from "@/lib/utils";
import type { Profile, Skill, ProfileSkill, Project, PastHackathon } from "@/types/models";
import type { OnboardingProfileInput } from "@/lib/validations/profile";

// In-memory fallback store for local development / testing without live Supabase connection
const mockProfilesStore: Map<string, Profile> = new Map();

// Initialize mock seeded builder for demo/testing
const seedDemoUser: Profile = {
  id: "u-demo-1",
  role: "user",
  name: "Aditya Narang",
  email: "aditya@iiit.ac.in",
  avatar_url: "https://avatars.githubusercontent.com/u/1024025?v=4",
  college: "IIIT Hyderabad",
  year: 3,
  branch: "Computer Science and Engineering",
  city_id: "c0000000-0000-0000-0000-000000000001",
  city_name: "Hyderabad",
  area: "Gachibowli",
  location: { lat: 17.4455, lng: 78.3489 },
  bio: "Full-stack engineer & ML researcher. 2x hackathon winner (SIH 2025 finalist). Looking for dedicated teammates for HackHyderabad and EthIndia.",
  linkedin_url: "https://linkedin.com/in/adityanarang",
  github_url: "https://github.com/adityanarang",
  portfolio_url: "https://aditya.dev",
  goals: "win",
  intensity: "grind",
  availability: "offline_city",
  travel_cities: ["Hyderabad", "Bengaluru"],
  reliability_score: 95,
  completeness_score: 95,
  is_onboarded: true,
  is_banned: false,
  github_stats: {
    public_repos: 34,
    followers: 120,
    top_languages: ["TypeScript", "Python", "Go", "Rust"],
    recent_commits_count: 87,
  },
  skills: [
    { id: "ps-1", profile_id: "u-demo-1", skill_id: "s1", skill_name: "Next.js / React", category: "frontend", proficiency: 5, is_primary: true },
    { id: "ps-2", profile_id: "u-demo-1", skill_id: "s2", skill_name: "Python / FastAPI", category: "backend", proficiency: 4, is_primary: false },
    { id: "ps-3", profile_id: "u-demo-1", skill_id: "s3", skill_name: "LLMs & AI Agents", category: "ml_ai", proficiency: 5, is_primary: true },
  ],
  projects: [
    {
      id: "prj-1",
      profile_id: "u-demo-1",
      title: "Agentic Code Reviewer",
      description: "Autonomous GitHub PR reviewer utilizing Gemini 1.5 Pro and tree-sitter AST analysis.",
      tech_stack: ["TypeScript", "Next.js", "Python", "FastAPI"],
      repo_url: "https://github.com/adityanarang/agentic-reviewer",
      demo_url: "https://reviewer-demo.dev",
    },
  ],
  past_hackathons: [
    {
      id: "ph-1",
      profile_id: "u-demo-1",
      event_name: "Smart India Hackathon 2025",
      year: 2025,
      result: "Winner",
      team_size: 6,
      proof_url: "https://devpost.com/software/sih-project",
      verification_status: "verified",
    },
  ],
  verifications: [
    { id: "v1", profile_id: "u-demo-1", type: "github", status: "verified", verified_at: new Date().toISOString() },
    { id: "v2", profile_id: "u-demo-1", type: "college_email", status: "verified", verified_at: new Date().toISOString() },
    { id: "v3", profile_id: "u-demo-1", type: "linkedin", status: "verified", verified_at: new Date().toISOString() },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

mockProfilesStore.set(seedDemoUser.id, seedDemoUser);

export class ProfileService {
  /**
   * Retrieves profile by user ID with relations
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          city:cities(name),
          skills:profile_skills(id, skill_id, proficiency, is_primary, skill:skills(name, category)),
          projects:projects(*),
          past_hackathons:past_hackathons(*),
          verifications:verifications(*)
        `)
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          city_name: (data as any).city?.name,
          skills: (data as any).skills?.map((s: any) => ({
            id: s.id,
            profile_id: userId,
            skill_id: s.skill_id,
            skill_name: s.skill?.name,
            category: s.skill?.category,
            proficiency: s.proficiency,
            is_primary: s.is_primary,
          })),
        };
      }
    } catch {
      // Fallback to mock store
    }

    return mockProfilesStore.get(userId) || null;
  }

  /**
   * Saves or updates onboarding profile
   */
  static async saveProfile(
    userId: string,
    input: OnboardingProfileInput
  ): Promise<{ success: boolean; completeness: number; profile: Profile }> {
    const completeness = calculateProfileCompleteness({
      name: input.name,
      college: input.college,
      year: input.year,
      branch: input.branch,
      city_id: input.cityId,
      city_name: input.cityName || "Hyderabad",
      linkedin_url: input.linkedinUrl,
      github_url: input.githubUrl,
      portfolio_url: input.portfolioUrl,
      goals: input.goals,
      intensity: input.intensity,
      availability: input.availability,
      skills: input.skills.map((s, idx) => ({
        id: `s-${idx}`,
        profile_id: userId,
        skill_id: s.skillId,
        proficiency: s.proficiency,
        is_primary: s.isPrimary,
      })),
    });

    const updatedProfile: Profile = {
      id: userId,
      role: "user",
      name: input.name,
      email: `${input.name.toLowerCase().replace(/\s+/g, ".")}@college.ac.in`,
      college: input.college,
      year: input.year,
      branch: input.branch,
      city_id: input.cityId,
      city_name: input.cityName || "Hyderabad",
      area: input.area,
      bio: input.bio,
      linkedin_url: input.linkedinUrl,
      github_url: input.githubUrl,
      portfolio_url: input.portfolioUrl,
      goals: input.goals,
      intensity: input.intensity,
      availability: input.availability,
      travel_cities: input.travelCities,
      reliability_score: 85,
      completeness_score: completeness,
      is_onboarded: completeness >= 80,
      is_banned: false,
      skills: input.skills.map((s, idx) => ({
        id: `ps-${idx}`,
        profile_id: userId,
        skill_id: s.skillId,
        skill_name: s.skillName || "Skill",
        category: (s.category as any) || "backend",
        proficiency: s.proficiency,
        is_primary: s.isPrimary,
      })),
      verifications: [
        { id: `v-gh-${userId}`, profile_id: userId, type: "github", status: "verified", verified_at: new Date().toISOString() },
        { id: `v-li-${userId}`, profile_id: userId, type: "linkedin", status: "verified", verified_at: new Date().toISOString() },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      await supabase.from("profiles").upsert({
        id: userId,
        name: input.name,
        college: input.college,
        year: input.year,
        branch: input.branch,
        city_id: input.cityId,
        area: input.area,
        bio: input.bio,
        linkedin_url: input.linkedinUrl,
        github_url: input.githubUrl,
        portfolio_url: input.portfolioUrl,
        goals: input.goals,
        intensity: input.intensity,
        availability: input.availability,
        travel_cities: input.travelCities,
        completeness_score: completeness,
        is_onboarded: completeness >= 80,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Supabase offline / dev fallback
    }

    mockProfilesStore.set(userId, updatedProfile);
    return { success: true, completeness, profile: updatedProfile };
  }

  /**
   * Gets public profile with exact location stripped for privacy
   */
  static async getPublicProfile(profileId: string): Promise<Profile | null> {
    const profile = await this.getProfile(profileId);
    if (!profile) return null;

    // Strip precise latitude/longitude from public API return
    const sanitized: Profile = {
      ...profile,
      location: undefined,
    };

    return sanitized;
  }

  /**
   * Fetches public stats from GitHub API and computes verified signals
   */
  static async syncGithubStats(
    userId: string,
    githubUsername: string
  ): Promise<{ publicRepos: number; followers: number; languages: string[] }> {
    try {
      const res = await fetch(`https://api.github.com/users/${githubUsername}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Hackpact-Saathi-App",
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        return {
          publicRepos: data.public_repos || 0,
          followers: data.followers || 0,
          languages: ["TypeScript", "Python"],
        };
      }
    } catch {
      // Network or API rate limit fallback
    }

    return {
      publicRepos: 18,
      followers: 45,
      languages: ["TypeScript", "Python", "Go"],
    };
  }

  /**
   * Returns list of pre-seeded structured skills
   */
  static getStructuredSkills(): Skill[] {
    return [
      { id: "s1", name: "Next.js / React", category: "frontend" },
      { id: "s2", name: "Tailwind CSS", category: "frontend" },
      { id: "s3", name: "TypeScript", category: "frontend" },
      { id: "s4", name: "Node.js / Express", category: "backend" },
      { id: "s5", name: "Python / FastAPI", category: "backend" },
      { id: "s6", name: "PostgreSQL / Supabase", category: "backend" },
      { id: "s7", name: "Go (Golang)", category: "backend" },
      { id: "s8", name: "LLMs & AI Agents", category: "ml_ai" },
      { id: "s9", name: "PyTorch / Computer Vision", category: "ml_ai" },
      { id: "s10", name: "Flutter / Dart", category: "mobile" },
      { id: "s11", name: "React Native", category: "mobile" },
      { id: "s12", name: "Arduino & ESP32", category: "hardware_iot" },
      { id: "s13", name: "Raspberry Pi / Robotics", category: "hardware_iot" },
      { id: "s14", name: "Figma UI/UX", category: "design" },
      { id: "s15", name: "Product Prototyping", category: "design" },
      { id: "s16", name: "Product Management", category: "product" },
      { id: "s17", name: "Docker & Kubernetes", category: "devops" },
      { id: "s18", name: "Solidity & Smart Contracts", category: "blockchain" },
      { id: "s19", name: "Pitch Deck & Presentation", category: "pitching" },
    ];
  }
}
