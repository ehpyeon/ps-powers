import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LangProvider } from "@/context/LangContext";
import { MobileMenuButton } from "@/components/MobileSidebar";
import CommandPalette from "@/components/CommandPalette";
import ReadingProgress from "@/components/ReadingProgress";
import SettingsToggles from "@/components/SettingsToggles";

export const metadata: Metadata = {
  title: "Harness 101 — Learning Harness Engineering through Storytelling",
  description: "Follow Jimin's 4-week journey to master Claude Code and become a Harness Engineer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* Flash prevention: set theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (!t) t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                document.documentElement.classList.remove('dark', 'light');
                document.documentElement.classList.add(t);
                var l = localStorage.getItem('lang');
                if (l === 'ko' || l === 'en') document.documentElement.lang = l;
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bg)] antialiased">
        <ThemeProvider>
          <LangProvider>
            {/* Skip to content */}
            <a href="#main-content" className="skip-to-content">
              본문으로 건너뛰기
            </a>

            {/* Header */}
            <header className="sticky top-0 z-50 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
              <div className="max-w-6xl mx-auto h-full px-6 flex items-center gap-3">
                <a href="/" className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                    C
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-sm text-[var(--color-text)]">harness101</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:block">Jimin&apos;s 4 Weeks</span>
                  </div>
                </a>

                <div className="flex-1" />

                {/* Cmd+K hint */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded">
                    ⌘K
                  </kbd>
                </div>

                {/* Settings: KO/EN + dark/light toggles */}
                <SettingsToggles />

                {/* Mobile menu button */}
                <MobileMenuButton />
              </div>
            </header>

            {/* Reading progress */}
            <ReadingProgress />

            {/* Command palette */}
            <CommandPalette />

            <div id="main-content">
              {children}
            </div>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
