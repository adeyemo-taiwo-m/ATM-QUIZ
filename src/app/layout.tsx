import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic Self-Assessment & Exam Portal",
  description: "Test and assess your comprehension across university courses: Agent-Based Systems (CPE310) and Statistics & Experimental Design (AEE302).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-100 antialiased relative selection:bg-brand-500/30 selection:text-brand-200 flex flex-col justify-between">
        {/* Glow Effects */}
        <div className="ambient-glow top-[-100px] left-[-100px]" />
        <div className="ambient-glow bottom-[-100px] right-[-100px]" />
        
        <div className="flex-grow flex flex-col justify-center">
          {children}
        </div>

        <footer className="w-full text-center py-6 text-xs md:text-sm text-slate-400 font-medium relative z-10 border-t border-slate-900/40 bg-slate-950/20 backdrop-blur-sm">
          Built with ❤️ by Adeyemo Taiwo M
        </footer>
      </body>
    </html>
  );
}

