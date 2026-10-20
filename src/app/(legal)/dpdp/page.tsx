import Link from "next/link";
import { APP_CONFIG } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Download, Trash2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: `India DPDP Act Compliance & Data Rights | ${APP_CONFIG.name}`,
  description: `How ${APP_CONFIG.name} complies with the Digital Personal Data Protection Act, 2023.`,
};

export default function DPDPCompliancePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-12 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <Badge variant="green">Statutory Notice</Badge>
            <Badge variant="outline">India DPDP Act 2023</Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Data Principal Rights & DPDP Compliance
          </h1>
          <p className="mt-2 text-sm text-[#0A0A0A]/70 max-w-2xl leading-relaxed">
            {APP_CONFIG.name} is dedicated to ethical privacy and compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India.
          </p>
        </div>

        {/* 1. Explicit Consent Architecture */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle>1. Lawful Basis & Notice-First Processing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-[#0A0A0A]/80 leading-relaxed">
            <p>
              We process personal data solely on the basis of <strong>freely given, specific, informed, and unconditional consent</strong> provided during onboarding.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Location Privacy:</strong> Exact GPS coordinates are strictly retained server-side for geodesic distance calculations and are <em>never</em> shared in API payloads with other users. Only coarse distance bands (e.g. &ldquo;Within 15 km&rdquo;) are surfaced.
              </li>
              <li>
                <strong>Purpose Limitation:</strong> Profile data and skill tags are strictly processed for hackathon team formation. We never sell, monetize, or license your data to third-party ad networks.
              </li>
              <li>
                <strong>Verifiable Credentials:</strong> GitHub repository statistics and public commit histories are accessed via read-only APIs with user authorization.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* 2. Self-Service Data Principal Rights */}
        <Card className="border-2 border-[#0A0A0A]">
          <CardHeader>
            <CardTitle>2. Your Rights as a Data Principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Portability */}
              <div className="p-4 rounded-[14px] border border-[#0A0A0A] bg-[#FFFFFF] shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-[#0A0A0A]" />
                  <h4 className="font-bold text-sm">Right to Data Portability</h4>
                </div>
                <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                  Download a machine-readable JSON archive containing all your profile data, past hackathons, peer reviews, and conversation transcripts.
                </p>
                <a href="/api/user/export-data" download>
                  <Button variant="secondary" size="sm" className="font-bold">
                    Export My Data Archive (JSON)
                  </Button>
                </a>
              </div>

              {/* Account Erasure */}
              <div className="p-4 rounded-[14px] border border-[#0A0A0A] bg-[#FFFFFF] shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-[#0A0A0A]" />
                  <h4 className="font-bold text-sm">Right to Erasure / Deletion</h4>
                </div>
                <p className="text-xs text-[#0A0A0A]/70 leading-relaxed">
                  Request immediate soft deletion of your account and permanent purging of all associated database records within 30 days.
                </p>
                <form action="/api/user/delete-account" method="POST">
                  <Button variant="outline" size="sm" className="font-bold">
                    Delete Account & Data
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Redressal & Grievance Officer */}
        <Card className="border-2 border-[#0A0A0A] bg-[#0A0A0A]/[0.02]">
          <CardHeader>
            <CardTitle>3. Grievance Redressal Mechanism</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm text-[#0A0A0A]/80">
            <p>
              In accordance with Section 11 of the DPDP Act, you may contact our designated Grievance Officer regarding any data processing queries, consent revocations, or complaints:
            </p>
            <div className="p-4 rounded-[12px] border border-[#0A0A0A] bg-[#FFFFFF] space-y-1 font-mono text-xs">
              <p><strong>Designation:</strong> {APP_CONFIG.grievanceOfficer.name}</p>
              <p><strong>Email:</strong> {APP_CONFIG.grievanceOfficer.email}</p>
              <p><strong>Office:</strong> {APP_CONFIG.grievanceOfficer.address}</p>
              <p><strong>Response Time:</strong> Within 7 business days</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
