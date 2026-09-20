import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: {
    default: "Circa — Commercial decision intelligence for the circular economy",
    template: "%s · Circa",
  },
  description:
    "Circa demonstrates the commercial value of circular economy business practices — viability, resilience, investor readiness and financial scenarios. CivTech 12.3 demonstrator.",
  applicationName: "Circa",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0f3d33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
