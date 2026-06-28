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
      <body className="min-h-screen text-slate-100 antialiased relative selection:bg-brand-500/30 selection:text-brand-200 flex flex-col justify-between">
        {/* Glow Effects */}
        <div className="ambient-glow top-[-100px] left-[-100px]" />
        <div className="ambient-glow bottom-[-100px] right-[-100px]" />
        
        <div className="flex-grow flex flex-col justify-center">
          {children}
        </div>

        <footer className="w-full text-center py-6 text-xs md:text-sm text-slate-550 font-medium relative z-10 border-t border-slate-900/40 bg-slate-950/20 backdrop-blur-sm">
          Built with ❤️ by Adeyemo Taiwo M
        </footer>
      </body>
    </html>
  );
}
