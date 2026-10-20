import { z } from "zod";

export const skillItemSchema = z.object({
  skillId: z.string().min(1, "Skill is required"),
  skillName: z.string().optional(),
  category: z.string().optional(),
  proficiency: z.number().int().min(1).max(5),
  isPrimary: z.boolean().default(false),
});

export const projectItemSchema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  techStack: z.array(z.string()).min(1, "Select at least 1 technology"),
  repoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const pastHackathonSchema = z.object({
  eventName: z.string().min(3, "Hackathon name is required"),
  year: z.number().int().min(2018).max(2027),
  result: z.enum(["Winner", "Runner Up", "Finalist", "Participant"]),
  teamSize: z.number().int().min(1).max(10).optional(),
  proofUrl: z
    .string()
    .url("Must be a valid URL (Devpost, Devfolio, Unstop, etc.)")
    .optional()
    .or(z.literal("")),
  certificateUrl: z.string().url("Certificate URL").optional().or(z.literal("")),
});

export const onboardingProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  college: z.string().min(2, "College name is required").max(150),
  year: z.number().int().min(1).max(5),
  branch: z.string().min(2, "Academic branch/major is required").max(100),
  cityId: z.string().min(1, "City is required"),
  cityName: z.string().optional(),
  area: z.string().min(2, "Area/Locality is required (e.g. Gachibowli, Madhapur)").max(100),
  bio: z.string().min(20, "Bio should be at least 20 characters describing your hackathon focus").max(1000),
  linkedinUrl: z
    .string()
    .url("A valid LinkedIn URL is required")
    .refine((url) => url.includes("linkedin.com/"), "Must be a valid LinkedIn profile URL"),
  githubUrl: z
    .string()
    .url("A valid GitHub URL is required")
    .refine((url) => url.includes("github.com/"), "Must be a valid GitHub profile URL"),
  portfolioUrl: z.string().url("Must be a valid portfolio URL").optional().or(z.literal("")),
  goals: z.enum(["win", "learn", "balanced"]),
  intensity: z.enum(["casual", "serious", "grind"]),
  availability: z.enum(["online_only", "offline_city", "willing_to_travel"]),
  travelCities: z.array(z.string()).default([]),
  skills: z.array(skillItemSchema).min(1, "Add at least 1 technical skill with proficiency"),
  ageConsentConfirmed: z.boolean().refine((val) => val === true, "You must confirm you are 18+ or have guardian consent"),
  privacyConsentConfirmed: z.boolean().refine((val) => val === true, "You must consent to profile indexing for hackathon matching under DPDP Act"),
});

export type OnboardingProfileInput = z.infer<typeof onboardingProfileSchema>;
