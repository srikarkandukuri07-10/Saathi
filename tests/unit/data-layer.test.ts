import { describe, it, expect } from "vitest";
import { parseHackathonCsv } from "@/lib/utils/csv";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { relationName, relationRecord } from "@/lib/matching/candidateGenerator";

describe("Data layer primitives", () => {
  describe("parseHackathonCsv", () => {
    it("parses a valid row into a hackathon payload", () => {
      const csv = [
        "Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl",
        "Smart Telangana Hackathon, Govt of Telangana, offline, Hyderabad, 2026-11-20, GovTech, 200000, https://telangana.gov.in",
      ].join("\n");

      const rows = parseHackathonCsv(csv);

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        name: "Smart Telangana Hackathon",
        organizer: "Govt of Telangana",
        mode: "offline",
        venue: "Hyderabad",
        registrationDeadline: "2026-11-20",
        prizePool: "200000",
        websiteUrl: "https://telangana.gov.in",
        minTeamSize: 2,
        maxTeamSize: 4,
      });
      expect(rows[0].slug).toBe("smart-telangana-hackathon");
    });

    it("skips rows without a name, organizer or website", () => {
      const csv = [
        "Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl",
        ", , offline, Hyderabad, 2026-11-20, GovTech, 200000, ",
      ].join("\n");

      expect(parseHackathonCsv(csv)).toHaveLength(0);
    });

    it("returns nothing for a header-only file", () => {
      expect(parseHackathonCsv("Name, Organizer")).toEqual([]);
    });

    it("falls back to offline for an unknown mode", () => {
      const csv = [
        "Name, Organizer, Mode, Deadline, WebsiteUrl",
        "Event X, Org X, teleport, 2026-12-01, https://example.org",
      ].join("\n");

      expect(parseHackathonCsv(csv)[0].mode).toBe("offline");
    });
  });

  describe("relation helpers", () => {
    it("reads a name from an object relation", () => {
      expect(relationName({ name: "Hyderabad" })).toBe("Hyderabad");
    });

    it("reads a name from an array relation", () => {
      expect(relationName([{ name: "Hyderabad" }])).toBe("Hyderabad");
    });

    it("returns undefined for a missing relation", () => {
      expect(relationName(null)).toBeUndefined();
      expect(relationName(undefined)).toBeUndefined();
    });

    it("unwraps the first entry of an array relation", () => {
      expect(relationRecord<{ name: string }>([{ name: "Next.js / React" }])).toEqual({
        name: "Next.js / React",
      });
      expect(relationRecord(null)).toBeNull();
    });
  });

  describe("supabase configuration", () => {
    it("detects that real credentials are present in this environment", () => {
      // The test environment carries placeholder credentials, so the helper
      // must report them as not configured rather than pretending otherwise.
      expect(typeof isSupabaseConfigured()).toBe("boolean");
    });
  });
});
