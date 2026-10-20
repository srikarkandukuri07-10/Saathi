import { describe, it, expect } from "vitest";
import {
  buildMatchFeed,
  selectEligibleCandidates,
  toMatchCandidate,
  toPublicProfile,
  type ProfileRow,
} from "@/lib/matching/candidateGenerator";
import { parseLocation } from "@/lib/matching/location";

function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "user-1",
    name: "Arjun Rao",
    city_id: "city-hyd",
    city_name: "Hyderabad",
    area: "Gachibowli",
    location: { lat: 17.4401, lng: 78.3489 },
    goals: "win",
    intensity: "grind",
    availability: "offline_city",
    reliability_score: 90,
    completeness_score: 95,
    is_onboarded: true,
    is_banned: false,
    matching_enabled: true,
    skills: [
      {
        proficiency: 5,
        is_primary: true,
        skill: { name: "Next.js / React", category: "frontend" },
      },
    ],
    past_hackathons_count: 2,
    ...overrides,
  };
}

describe("Phase 3 Candidate Generator", () => {
  describe("toMatchCandidate", () => {
    it("maps a database row into the neutral scorer shape", () => {
      const candidate = toMatchCandidate(profileRow());

      expect(candidate.id).toBe("user-1");
      expect(candidate.city).toBe("Hyderabad");
      expect(candidate.skills).toEqual([
        {
          category: "frontend",
          skill: "Next.js / React",
          proficiency: 5,
          isPrimary: true,
        },
      ]);
      expect(candidate.reliabilityScore).toBe(90);
      expect(candidate.pastHackathonsCount).toBe(2);
      expect(candidate.isVerified).toBe(true);
    });

    it("treats an unverified profile as unverified even with a high completeness score", () => {
      const candidate = toMatchCandidate(
        profileRow({ is_onboarded: false, completeness_score: 100 })
      );
      expect(candidate.isVerified).toBe(false);
    });
  });

  describe("selectEligibleCandidates", () => {
    const rows: ProfileRow[] = [
      profileRow({ id: "self" }),
      profileRow({ id: "eligible" }),
      profileRow({ id: "banned", is_banned: true }),
      profileRow({ id: "opted-out", matching_enabled: false }),
      profileRow({ id: "incomplete", completeness_score: 55 }),
      profileRow({ id: "not-onboarded", is_onboarded: false }),
      profileRow({ id: "blocked" }),
      profileRow({ id: "connected" }),
    ];

    it("applies every hard gate", () => {
      const eligible = selectEligibleCandidates(rows, "self", {
        minCompleteness: 80,
        blockedIds: ["blocked"],
        connectedIds: ["connected"],
      });

      expect(eligible.map((row) => row.id)).toEqual(["eligible"]);
    });

    it("keeps opted-out builders when explicitly requested", () => {
      const eligible = selectEligibleCandidates(rows, "self", {
        minCompleteness: 80,
        blockedIds: ["blocked"],
        connectedIds: ["connected"],
        includeOptedOut: true,
      });

      expect(eligible.map((row) => row.id)).toContain("opted-out");
    });
  });

  describe("toPublicProfile", () => {
    it("never exposes the exact coordinates of a candidate", () => {
      const profile = toPublicProfile(profileRow());

      expect(profile.location).toBeUndefined();
      expect(profile.area).toBe("Gachibowli");
      expect(profile.city_name).toBe("Hyderabad");
    });

    it("keeps skill proficiency and primary flags for the compatibility card", () => {
      const profile = toPublicProfile(profileRow());

      expect(profile.skills).toHaveLength(1);
      expect(profile.skills?.[0].skill_name).toBe("Next.js / React");
      expect(profile.skills?.[0].proficiency).toBe(5);
      expect(profile.skills?.[0].is_primary).toBe(true);
    });
  });

  describe("buildMatchFeed", () => {
    it("ranks the most complementary candidate first and explains why", () => {
      const viewer = profileRow({ id: "viewer" });

      const designer = profileRow({
        id: "designer",
        name: "Pooja Varma",
        skills: [
          {
            proficiency: 5,
            is_primary: true,
            skill: { name: "Figma UI/UX", category: "design" },
          },
        ],
      });

      const peer = profileRow({
        id: "peer",
        name: "Duplicate Frontend Dev",
        skills: [
          {
            proficiency: 5,
            is_primary: true,
            skill: { name: "Next.js / React", category: "frontend" },
          },
        ],
      });

      const feed = buildMatchFeed(viewer, [peer, designer], {
        viewerId: "viewer",
        hackathonId: "h-sih-2026",
        hackathonMode: "offline",
        hackathonCity: "Hyderabad",
        targetSkillsNeeded: ["design"],
      });

      expect(feed).toHaveLength(2);
      expect(feed[0].candidate_id).toBe("designer");
      expect(feed[0].score).toBeGreaterThan(feed[1].score);
      expect(feed[0].reasons.join(" ")).toContain("Complementary");
      expect(feed[0].candidate.location).toBeUndefined();
    });

    it("respects the requested result limit", () => {
      const viewer = profileRow({ id: "viewer" });
      const candidates = [
        profileRow({ id: "a" }),
        profileRow({ id: "b" }),
        profileRow({ id: "c" }),
      ];

      const feed = buildMatchFeed(viewer, candidates, {
        viewerId: "viewer",
        hackathonId: "h-sih-2026",
        hackathonMode: "online",
        limit: 2,
      });

      expect(feed).toHaveLength(2);
    });
  });
});

describe("PostGIS location parsing", () => {
  it("reads an explicit lat/lng pair", () => {
    expect(parseLocation({ lat: 17.44, lng: 78.34 })).toEqual({
      lat: 17.44,
      lng: 78.34,
    });
  });

  it("reads a GeoJSON point (longitude first)", () => {
    expect(
      parseLocation({ type: "Point", coordinates: [78.3489, 17.4401] })
    ).toEqual({ lat: 17.4401, lng: 78.3489 });
  });

  it("reads a little-endian WKB point", () => {
    // 01 (little endian) + 01000000 (point) + x=78.3489 + y=17.4401
    const wkb = "0101000000c364aa605496534038f8c264aa703140";
    const parsed = parseLocation(wkb);

    expect(parsed).toBeDefined();
    expect(parsed?.lat).toBeCloseTo(17.4401, 4);
    expect(parsed?.lng).toBeCloseTo(78.3489, 4);
  });

  it("returns undefined for missing or unparseable values", () => {
    expect(parseLocation(null)).toBeUndefined();
    expect(parseLocation(undefined)).toBeUndefined();
    expect(parseLocation("not-a-point")).toBeUndefined();
  });
});
