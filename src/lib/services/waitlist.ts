import type { WaitlistEntry, City } from "@/types/models";

const mockWaitlistStore: WaitlistEntry[] = [
  {
    id: "w-1",
    name: "Sai Kiran",
    email: "sai.kiran@cbit.ac.in",
    city_id: "c0000000-0000-0000-0000-000000000001",
    city_name: "Hyderabad",
    college: "CBIT",
    referral_code: "HYD-SAI-1A",
    created_at: new Date().toISOString(),
  },
  {
    id: "w-2",
    name: "Kavya Murthy",
    email: "kavya@iiit.ac.in",
    city_id: "c0000000-0000-0000-0000-000000000001",
    city_name: "Hyderabad",
    college: "IIIT Hyderabad",
    referral_code: "HYD-KAVYA-2B",
    created_at: new Date().toISOString(),
  },
];

export class WaitlistService {
  static async getCityWaitlistStats(cityId: string = "c0000000-0000-0000-0000-000000000001"): Promise<{
    currentCount: number;
    targetCount: number;
    remaining: number;
    percentage: number;
    cityName: string;
  }> {
    const targetCount = 50;
    const currentCount = 23; // Cold start seeded count
    const remaining = Math.max(0, targetCount - currentCount);
    const percentage = Math.round((currentCount / targetCount) * 100);

    return {
      currentCount,
      targetCount,
      remaining,
      percentage,
      cityName: "Hyderabad",
    };
  }

  static async joinWaitlist(input: {
    name: string;
    email: string;
    cityId: string;
    cityName?: string;
    college?: string;
    referredByCode?: string;
  }): Promise<{ entry: WaitlistEntry; referralLink: string }> {
    const code = `HYD-${input.name.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

    const entry: WaitlistEntry = {
      id: `w-${Date.now()}`,
      name: input.name,
      email: input.email,
      city_id: input.cityId,
      city_name: input.cityName || "Hyderabad",
      college: input.college,
      referral_code: code,
      referred_by_code: input.referredByCode,
      created_at: new Date().toISOString(),
    };

    mockWaitlistStore.push(entry);
    const referralLink = `https://hackpact.dev/waitlist?ref=${code}`;

    return { entry, referralLink };
  }
}
