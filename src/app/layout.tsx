import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_CONFIG } from "@/config/site";
import { Navbar } from "@/components/navigation/navbar";
import { BottomNav } from "@/components/navigation/bottom-nav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#B8F2C9",
};

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} | Serious Teammate Matching for External Hackathons`,
  description: APP_CONFIG.description,
  keywords: [
    "hackathons",
    "hackathon teammates",
    "smart india hackathon",
    "ethindia",
    "student builders",
    "hyderabad tech",
    "college hackathons",
    "team matching",
  ],
  authors: [{ name: "Hackpact Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFFFFF] text-[#0A0A0A] flex flex-col font-sans antialiased selection:bg-[#B8F2C9] selection:text-[#0A0A0A]">
        {/* Top Navbar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 pb-16 md:pb-0">{children}</main>

        {/* Mobile-Only Bottom Navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
