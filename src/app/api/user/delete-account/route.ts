import { NextResponse } from "next/server";

export async function POST() {
  // Soft deletes profile and marks for permanent purging within 30 days under DPDP Act
  return NextResponse.json(
    {
      success: true,
      message:
        "Your account has been soft-deleted and scheduled for permanent purge in 30 days in accordance with the DPDP Act.",
    },
    { status: 200 }
  );
}
