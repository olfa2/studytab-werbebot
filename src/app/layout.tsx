import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "studytab Werbebot",
  description: "Trends, Entwürfe und Performance für die studytab-TikTok-Accounts",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
