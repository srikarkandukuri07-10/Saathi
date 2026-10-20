import { z } from "zod";

export const hackathonSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  slug: z.string().min(3).max(200),
  organizer: z.string().min(2, "Organizer is required").max(150),
  mode: z.enum(["online", "offline", "hybrid"]),
  cityId: z.string().optional().nullable(),
  cityName: z.string().optional(),
  venue: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  registrationDeadline: z.string(),
  prizePool: z.string().optional(),
  theme: z.string().min(3, "Theme is required").max(200),
  description: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid website URL"),
  minTeamSize: z.number().int().min(1).max(10).default(2),
  maxTeamSize: z.number().int().min(1).max(10).default(4),
  isPublished: z.boolean().default(true),
});

export const hackathonFilterSchema = z.object({
  mode: z.enum(["all", "online", "offline", "hybrid"]).optional().default("all"),
  cityId: z.string().optional(),
  search: z.string().optional(),
});

export type HackathonInput = z.infer<typeof hackathonSchema>;
