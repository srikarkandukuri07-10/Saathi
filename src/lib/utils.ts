import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Profile } from "@/types/models";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates profile completeness score (0 to 100).
 * Matches product requirements: matching gated until >= 80%
 */
export function calculateProfileCompleteness(profile: Partial<Profile>): number {
  let score = 0;

  // Basic Info (35%)
  if (profile.name?.trim()) score += 5;
  if (profile.avatar_url?.trim()) score += 5;
  if (profile.college?.trim()) score += 10;
  if (profile.year && profile.year >= 1) score += 5;
  if (profile.branch?.trim()) score += 5;
  if (profile.city_id || profile.city_name) score += 5;

  // Verification & Required Links (25%)
  if (profile.linkedin_url?.trim()) score += 15;
  if (profile.github_url?.trim()) score += 10;

  // Skills (20%)
  if (profile.skills && profile.skills.length >= 3) {
    score += 20;
  } else if (profile.skills && profile.skills.length > 0) {
    score += profile.skills.length * 6;
  }

  // Goals & Availability (10%)
  if (profile.goals) score += 5;
  if (profile.intensity && profile.availability) score += 5;

  // Showcase / Past Experience (Bonus 10%)
  if (profile.projects && profile.projects.length > 0) score += 5;
  if (profile.past_hackathons && profile.past_hackathons.length > 0) score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Returns a human-readable relative time string (e.g. "5m ago", "2h ago").
 * Used in chat message timestamps.
 */
export function formatDistanceToNow(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatDistanceKm(meters: number): string {
  const km = Math.round(meters / 1000);
  if (km < 1) return "Nearby (< 1 km)";
  if (km < 10) return `~${km} km away`;
  if (km < 50) return `Within ${Math.ceil(km / 5) * 5} km`;
  return `~${Math.ceil(km / 25) * 25} km away`;
}

export function getApproximateDistanceLabel(userLat: number, userLng: number, candLat: number, candLng: number): string {
  // Haversine approximate distance in km
  const R = 6371; // Earth radius in km
  const dLat = ((candLat - userLat) * Math.PI) / 180;
  const dLon = ((candLng - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((candLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  if (distanceKm <= 5) return "Within 5 km";
  if (distanceKm <= 15) return "Within 15 km";
  if (distanceKm <= 35) return "Same metro area (< 35 km)";
  if (distanceKm <= 100) return "Within 100 km";
  return "Different city / Remote";
}
