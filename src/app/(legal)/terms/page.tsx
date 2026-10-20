import { APP_CONFIG } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata = {
  title: `Terms of Service | ${APP_CONFIG.name}`,
  description: `Terms of service and code of conduct for ${APP_CONFIG.name}.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Badge variant="outline" className="mb-2">Last Updated: October 2026</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
            Community guidelines and binding terms for participating in {APP_CONFIG.name}.
          </p>
        </div>

        <Card className="border-2 border-[#0A0A0A]">
          <CardContent className="pt-6 space-y-6 text-xs sm:text-sm text-[#0A0A0A]/85 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">1. Eligibility & Age Gate</h2>
              <p>
                {APP_CONFIG.name} is designed for collegiate and aspiring technologists participating in external hackathons. You must be at least 18 years of age or possess guardian authorization to register.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">2. Anti-Ghosting & Reliability Policy</h2>
              <p>
                Teaming up for an external hackathon is a commitment. Users who repeatedly confirm team locks and subsequently abandon teams without notice will receive reliability penalties or account suspension following review.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">3. Zero Tolerance for Harassment</h2>
              <p>
                Discrimination, harassment, offensive messaging, and unauthorized solicitation will result in immediate permanent banning. All users have access to direct report and block actions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-[#0A0A0A]">4. Non-Affiliation with Organizers</h2>
              <p>
                {APP_CONFIG.name} is an independent teammate discovery network and is not directly operated by or officially affiliated with external hackathon organizers (such as Smart India Hackathon, EthIndia, or Devpost) unless explicitly specified.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
