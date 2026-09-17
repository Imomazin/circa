import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Circa | Commercial intelligence", template: "%s | Circa" },
  description:
    "Commercial decision intelligence for circular economy opportunities. A synthetic CivTech Round 12 demonstrator.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
