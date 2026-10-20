import { describe, it, expect } from "vitest";
import { calculateProfileCompleteness, getApproximateDistanceLabel } from "@/lib/utils";
import type { Profile } from "@/types/models";

describe("Profile Completeness & Geo Privacy Utilities", () => {
  it("calculates 0% for empty profile", () => {
    const profile: Partial<Profile> = {};
    expect(calculateProfileCompleteness(profile)).toBe(0);
  });

  it("calculates partial score for basic info and required links", () => {
    const profile: Partial<Profile> = {
      name: "Siddharth Verma",
      college: "IIIT Hyderabad",
      year: 3,
      branch: "Computer Science",
      city_name: "Hyderabad",
      linkedin_url: "https://linkedin.com/in/siddharth",
      github_url: "https://github.com/siddharth",
    };
    const score = calculateProfileCompleteness(profile);
    // 30 basic + 25 links = 55
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it("reaches >= 80% with full profile, skills, and goals", () => {
    const profile: Partial<Profile> = {
      name: "Ananya Rao",
      avatar_url: "https://avatars.githubusercontent.com/u/12345",
      college: "BITS Pilani Hyderabad",
      year: 4,
      branch: "ECE",
      city_name: "Hyderabad",
      linkedin_url: "https://linkedin.com/in/ananyarao",
      github_url: "https://github.com/ananyarao",
      goals: "win",
      intensity: "grind",
      availability: "offline_city",
      skills: [
        { id: "1", profile_id: "p1", skill_id: "s1", proficiency: 5, is_primary: true },
        { id: "2", profile_id: "p1", skill_id: "s2", proficiency: 4, is_primary: false },
        { id: "3", profile_id: "p1", skill_id: "s3", proficiency: 4, is_primary: false },
      ],
      projects: [
        {
          id: "pr1",
          profile_id: "p1",
          title: "Autonomous Delivery Drone",
          description: "ROS2 & OpenCV drone navigation",
          tech_stack: ["Python", "ROS2", "OpenCV"],
        },
      ],
    };

    const completeness = calculateProfileCompleteness(profile);
    expect(completeness).toBeGreaterThanOrEqual(80);
  });

  it("obfuscates precise GPS distance into coarse privacy distance bands", () => {
    // Distance between Gachibowli and HITEC City (~3.5 km straight line)
    const labelNearby = getApproximateDistanceLabel(17.4401, 78.3489, 17.4483, 78.3807);
    expect(labelNearby).toBe("Within 5 km");

    // Distance between Hyderabad and Bengaluru (~500 km)
    const labelRemote = getApproximateDistanceLabel(17.3850, 78.4867, 12.9716, 77.5946);
    expect(labelRemote).toBe("Different city / Remote");
  });
});
