import Link from "next/link";
import SiteNav from "components/site-nav";
import "./globals.css";

export const metadata = {
  title: "F1Lab",
  description: "Formula 1 analysis, tracks, drivers, and setup intelligence."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="min-h-screen bg-canvas text-ink">
          <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(215,25,32,0.08),_transparent_38%),linear-gradient(180deg,rgba(255,225,220,0.35),rgba(255,244,240,0))]" />
          <div className="pointer-events-none fixed inset-0 bg-grid bg-[size:48px_48px] opacity-30" />
          <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
              <Link href="/" className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-semibold text-white">
                  F1
                </span>
                <div>
                  <p className="text-lg font-semibold tracking-tight">F1Lab</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted">
                    Analysis Platform
                  </p>
                </div>
              </Link>
              <SiteNav />
            </div>
          </header>
          {children}
          <footer className="border-t border-line bg-white/80">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <p className="text-lg font-semibold">F1Lab</p>
                <p className="text-sm text-muted">
                  Formula 1 project focused on professional UI, circuit data, and driver analysis.
                </p>
              </div>
              <p className="text-sm text-muted">
                Built with Next.js and Tailwind CSS.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
