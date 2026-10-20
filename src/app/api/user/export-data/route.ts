import { NextResponse } from "next/server";
import { ProfileService } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await ProfileService.getProfile("u-demo-1");

  const exportArchive = {
    exportDate: new Date().toISOString(),
    complianceStandard: "India DPDP Act 2023 - Data Principal Portability",
    userProfile: profile,
    disclaimer:
      "This export contains all personal identifying data, technical skills, verified links, and participation logs stored by Hackpact.",
  };

  return new NextResponse(JSON.stringify(exportArchive, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="hackpact-user-data-export.json"',
    },
  });
}
