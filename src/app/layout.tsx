import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CPE310 – Agent-Based Systems Self-Assessment",
  description: "Test and assess your understanding of Agent-Based Systems concepts, architectures, cognitive modules, and agency theory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="min-h-screen text-slate-100 antialiased relative selection:bg-brand-500/30 selection:text-brand-200">
        {/* Glow Effects */}
        <div className="ambient-glow top-[-100px] left-[-100px]" />
        <div className="ambient-glow bottom-[-100px] right-[-100px]" />
        {children}
      </body>
    </html>
  );
}
