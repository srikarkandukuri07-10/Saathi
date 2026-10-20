import type { AdminHackathonInput } from "@/lib/data/admin";

/**
 * Minimal CSV parser for the admin bulk importer.
 * Columns: Name, Organizer, Mode, City, Deadline, Theme, PrizePool, WebsiteUrl
 */
export function parseHackathonCsv(csv: string): AdminHackathonInput[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: AdminHackathonInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    if (parts.length < headers.length) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = parts[index] ?? "";
    });

    const name = record.name;
    const organizer = record.organizer;
    const websiteUrl = record.websiteurl ?? record.website_url;
    if (!name || !organizer || !websiteUrl) continue;

    const slug =
      record.slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const mode = (record.mode ?? "offline").toLowerCase();
    const deadline = record.deadline ?? record.registrationdeadline;
    const start = record.startdate ?? record.start ?? deadline;
    const end = record.enddate ?? record.end ?? deadline;

    rows.push({
      name,
      slug,
      organizer,
      mode: mode === "online" || mode === "hybrid" ? mode : "offline",
      venue: record.venue || record.city || undefined,
      startDate: start,
      endDate: end,
      registrationDeadline: deadline,
      prizePool: record.prizepool || record.prize || undefined,
      theme: record.theme || undefined,
      description: record.description || undefined,
      websiteUrl,
      minTeamSize: Number(record.mintteamsize) || 2,
      maxTeamSize: Number(record.maxteamsize) || 4,
      isPublished: (record.published ?? "true").toLowerCase() !== "false",
    });
  }

  return rows;
}
