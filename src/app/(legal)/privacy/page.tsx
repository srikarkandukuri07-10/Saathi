import { APP_CONFIG } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata = {
  title: `Privacy Policy | ${APP_CONFIG.name}`,
  description: `Privacy policy and information processing standards for ${APP_CONFIG.name}.`,
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Badge variant="outline" className="mb-2">Last Updated: October 2026</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
            How {APP_CONFIG.name} (&ldquo;{APP_CONFIG.codeName}&rdquo;) collects, handles, and protects your builder information.
          </p>
        </div>

        <Card className="border-2 border-[#0A0A0A]">
          <CardContent className="pt-6 space-y-6 text-xs sm:text-sm text-[#0A0A0A]/85 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">1. Information We Collect</h2>
              <p>
                We collect your name, college, year of study, major, city/neighborhood, technical skills, GitHub profile stats (public repositories and languages), and verifiable hackathon links.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">2. How We Use Location Data</h2>
              <p>
                Precise GPS coordinates are stored in server-side PostGIS tables protected by Row Level Security and are never sent to browsers. Other users only see coarse locality bands (e.g., &ldquo;Within 15 km&rdquo; or &ldquo;Same city&rdquo;).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">3. Mutual Consent Messaging</h2>
              <p>
                Direct communication channels are blocked until both parties explicitly accept a match request. You can report or block any user at any time.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">4. Third-Party Integrations</h2>
              <p>
                We integrate with GitHub for OAuth and verifiable repo stats, Supabase for authenticated database storage, Upstash for abuse throttles, and Resend for transactional match updates.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
