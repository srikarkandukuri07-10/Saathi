
import type { Hackathon, HackathonMode } from "@/types/models";
import type { HackathonInput } from "@/lib/validations/hackathon";

const mockHackathons: Hackathon[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Smart India Hackathon 2026",
    slug: "smart-india-hackathon-2026",
    organizer: "Ministry of Education & AICTE",
    mode: "offline",
    city_id: "c0000000-0000-0000-0000-000000000001",
    city_name: "Hyderabad",
    venue: "Nodal Centres across Hyderabad & India",
    start_date: new Date(Date.now() + 25 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 27 * 86400000).toISOString(),
    registration_deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    prize_pool: "â‚¹1,00,000 / Problem Statement",
    theme: "GovTech, Smart Automation, Healthcare & Agriculture",
    description:
      "The premier nationwide innovation challenge to solve real-world problems facing government ministries and public sectors.",
    website_url: "https://sih.gov.in",
    min_team_size: 6,
    max_team_size: 6,
    is_published: true,
    participant_count: 142,
    is_user_going: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    name: "HackHyderabad 2026",
    slug: "hackhyderabad-2026",
    organizer: "T-Hub Hyderabad",
    mode: "offline",
    city_id: "c0000000-0000-0000-0000-000000000001",
    city_name: "Hyderabad",
    venue: "T-Hub Phase 2, Knowledge City, Hyderabad",
    start_date: new Date(Date.now() + 18 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 20 * 86400000).toISOString(),
    registration_deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    prize_pool: "â‚¹5,00,000",
    theme: "AI Agents, FinTech & Smart Cities",
    description:
      "Hyderabad's flagship 36-hour external builder hackathon bringing together the top 500 collegiate hackers across Telangana and Andhra Pradesh.",
    website_url: "https://hackhyderabad.org",
    min_team_size: 2,
    max_team_size: 4,
    is_published: true,
    participant_count: 88,
    is_user_going: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    name: "EthIndia 2026",
    slug: "ethindia-2026",
    organizer: "Devfolio & Ethereum Foundation",
    mode: "hybrid",
    city_id: "c0000000-0000-0000-0000-000000000002",
    city_name: "Bengaluru",
    venue: "KTPO Bengaluru & Hyderabad Satellite Hub",
    start_date: new Date(Date.now() + 40 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 42 * 86400000).toISOString(),
    registration_deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    prize_pool: "â‚¹65,00,000+",
    theme: "Web3 Infrastructure, Zero-Knowledge & DeFi",
    description:
      "Asia's largest Ethereum hackathon. Gather with global protocol builders, core devs, and venture funds to build the decentralized web.",
    website_url: "https://ethindia.co",
    min_team_size: 2,
    max_team_size: 4,
    is_published: true,
    participant_count: 210,
    is_user_going: false,
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    name: "Google Solution Challenge 2026",
    slug: "google-solution-challenge-2026",
    organizer: "Google Developer Student Clubs",
    mode: "online",
    city_id: undefined,
    city_name: "Online (Global)",
    venue: "Virtual",
    start_date: new Date(Date.now() + 30 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 35 * 86400000).toISOString(),
    registration_deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    prize_pool: "$100,000 in Mentorship & Prizes",
    theme: "17 UN Sustainable Development Goals",
    description:
      "Build a solution for a local community problem using one or more Google technologies: Gemini, Firebase, Android, Google Cloud, or Flutter.",
    website_url: "https://developers.google.com/community/gdsc-solution-challenge",
    min_team_size: 2,
    max_team_size: 4,
    is_published: true,
    participant_count: 350,
    is_user_going: false,
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    name: "Devpost Global Agentic AI Hackathon",
    slug: "devpost-agentic-ai-2026",
    organizer: "Devpost",
    mode: "online",
    city_id: undefined,
    city_name: "Online",
    venue: "Devpost Virtual Arena",
    start_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    end_date: new Date(Date.now() + 17 * 86400000).toISOString(),
    registration_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    prize_pool: "$50,000",
    theme: "Autonomous AI Agents & Tool Calling",
    description:
      "Build multi-agent workflows that run autonomously, execute complex tool calls, and solve end-to-end knowledge worker problems.",
    website_url: "https://devpost.com",
    min_team_size: 1,
    max_team_size: 4,
    is_published: true,
    participant_count: 175,
    is_user_going: false,
  },
];

export class HackathonService {
  /**
   * Fetches published hackathons with optional mode / city / text search filters
   */
  static async getHackathons(options?: {
    mode?: string;
    cityId?: string;
    search?: string;
  }): Promise<Hackathon[]> {
    let list = [...mockHackathons];

    if (options?.mode && options.mode !== "all") {
      list = list.filter((h) => h.mode === options.mode);
    }

    if (options?.cityId) {
      list = list.filter((h) => h.city_id === options.cityId);
    }

    if (options?.search?.trim()) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.organizer.toLowerCase().includes(q) ||
          h.theme?.toLowerCase().includes(q)
      );
    }

    return list;
  }

  /**
   * Fetches single hackathon by slug
   */
  static async getHackathonBySlug(slug: string): Promise<Hackathon | null> {
    const found = mockHackathons.find((h) => h.slug === slug);
    return found || null;
  }

  /**
   * Toggles participant "I'm going" status
   */
  static async toggleGoing(
    hackathonId: string,
    userId: string
  ): Promise<{ isGoing: boolean; count: number }> {
    const item = mockHackathons.find((h) => h.id === hackathonId);
    if (!item) return { isGoing: false, count: 0 };

    item.is_user_going = !item.is_user_going;
    if (item.is_user_going) {
      item.participant_count = (item.participant_count || 0) + 1;
    } else {
      item.participant_count = Math.max(0, (item.participant_count || 1) - 1);
    }

    return {
      isGoing: !!item.is_user_going,
      count: item.participant_count || 0,
    };
  }

  /**
   * Creates a new hackathon from admin panel or API
   */
  static async createHackathon(input: HackathonInput): Promise<Hackathon> {
    const newHackathon: Hackathon = {
      id: `h-${Date.now()}`,
      name: input.name,
      slug: input.slug,
      organizer: input.organizer,
      mode: input.mode,
      city_id: input.cityId || undefined,
      city_name: input.cityName || "Hyderabad",
      venue: input.venue,
      start_date: input.startDate,
      end_date: input.endDate,
      registration_deadline: input.registrationDeadline,
      prize_pool: input.prizePool,
      theme: input.theme,
      description: input.description,
      website_url: input.websiteUrl,
      min_team_size: input.minTeamSize,
      max_team_size: input.maxTeamSize,
      is_published: input.isPublished,
      participant_count: 0,
      is_user_going: false,
    };

    mockHackathons.unshift(newHackathon);
    return newHackathon;
  }

  /**
   * CSV import parser for bulk hackathon seeding
   */
  static parseCSV(csvContent: string): HackathonInput[] {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const results: HackathonInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length >= 6) {
        const name = parts[0];
        const organizer = parts[1];
        const mode = (["online", "offline", "hybrid"].includes(parts[2].toLowerCase())
          ? parts[2].toLowerCase()
          : "offline") as HackathonMode;
        const cityName = parts[3] || "Hyderabad";
        const deadline = parts[4] || new Date(Date.now() + 14 * 86400000).toISOString();
        const theme = parts[5] || "Innovation";
        const prizePool = parts[6] || "TBA";
        const websiteUrl = parts[7]?.startsWith("http") ? parts[7] : "https://devpost.com";

        results.push({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          organizer,
          mode,
          cityName,
          registrationDeadline: deadline,
          startDate: deadline,
          endDate: deadline,
          theme,
          prizePool,
          websiteUrl,
          minTeamSize: 2,
          maxTeamSize: 4,
          isPublished: true,
        });
      }
    }

    return results;
  }
}
