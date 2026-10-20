/**
 * GLOBAL PRODUCT CONFIGURATION
 * Working name: Hackpact
 * Core code name / rename constant: Saathi
 */
export const Saathi = {
  name: "Hackpact",
  codeName: "Saathi",
  tagline: "Find serious, complementary teammates for external hackathons.",
  description:
    "A selective platform for driven students to discover high-commitment teammates for major external hackathons. No random chats, no flaking, pure signal.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  initialCity: "Hyderabad",
  waitlistThreshold: 50,
  minProfileCompleteness: 80,
  defaultReliabilityScore: 85,
  supportEmail: "team@hackpact.dev",
  grievanceOfficer: {
    name: "Grievance Officer - Hackpact",
    email: "grievance@hackpact.dev",
    address: "HITEC City, Hyderabad, Telangana 500081, India",
  },
  // STRICT 3-COLOR SYSTEM TOKENS
  theme: {
    colors: {
      green: "#B8F2C9",
      black: "#0A0A0A",
      white: "#FFFFFF",
    },
  },
} as const;

export const APP_CONFIG = Saathi;
