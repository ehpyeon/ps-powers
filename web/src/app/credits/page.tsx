"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";

const REFERENCES = [
  {
    name: "learn-claude-code",
    author: "shareAI-lab",
    url: "https://github.com/shareAI-lab/learn-claude-code",
    description: {
      ko: "Claude Code를 처음 접하는 사람들을 위한 체계적인 학습 가이드. 이 프로젝트의 교육적 접근 방식에 큰 영향을 주었습니다.",
      en: "A structured learning guide for Claude Code beginners. Greatly influenced the educational approach of Harness 101.",
    },
    tag: "Learning",
    color: "indigo",
  },
  {
    name: "superpowers",
    author: "obra",
    url: "https://github.com/obra/superpowers",
    description: {
      ko: "Claude Code 커스터마이징과 Harness 개념의 실제 구현 사례를 보여준 선구적인 프로젝트.",
      en: "A pioneering project demonstrating real-world Claude Code customizations and the Harness concept in practice.",
    },
    tag: "Inspiration",
    color: "purple",
  },
  {
    name: "everything-claude-code",
    author: "affaan-m",
    url: "https://github.com/affaan-m/everything-claude-code",
    description: {
      ko: "Claude Code의 모든 기능을 망라한 종합 참조 자료. 다양한 활용 패턴을 탐구하는 데 참고했습니다.",
      en: "A comprehensive reference covering all Claude Code features. Referenced for exploring various usage patterns.",
    },
    tag: "Reference",
    color: "emerald",
  },
  {
    name: "claude-code-best-practice",
    author: "shanraisshan",
    url: "https://github.com/shanraisshan/claude-code-best-practice",
    description: {
      ko: "실무에서 검증된 Claude Code 베스트 프랙티스 모음. Harness Engineering의 Permissions 레이어 설계에 참고했습니다.",
      en: "Battle-tested Claude Code best practices. Referenced for designing the Permissions layer of Harness Engineering.",
    },
    tag: "Best Practices",
    color: "amber",
  },
];

const COLOR_MAP: Record<string, { tag: string; border: string; dot: string }> = {
  indigo: { tag: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20", border: "hover:border-indigo-500/40", dot: "bg-indigo-400" },
  purple: { tag: "bg-purple-500/10 text-purple-300 border-purple-500/20", border: "hover:border-purple-500/40", dot: "bg-purple-400" },
  emerald: { tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", border: "hover:border-emerald-500/40", dot: "bg-emerald-400" },
  amber: { tag: "bg-amber-500/10 text-amber-300 border-amber-500/20", border: "hover:border-amber-500/40", dot: "bg-amber-400" },
};

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    url: "https://github.com/ehpyeon",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
    color: "hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]",
  },
  {
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/euihyeon-pyeon/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "hover:text-blue-400 hover:bg-blue-500/10",
  },
];

export default function CreditsPage() {
  const { t, lang } = useLang();

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Back link */}
      <Link href="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-8 inline-flex items-center gap-1">
        {t.creditsBackLink}
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] mt-4 mb-14">
        {t.creditsPageTitle}
      </h1>

      {/* ── Author ── */}
      <section className="mb-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">
          {t.creditsAuthorSection}
        </h2>

        <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <img
              src="https://avatars.githubusercontent.com/u/19993280?s=400&u=0a4178db402327f38f5a2729dd9e173da63271ec&v=4"
              alt="Euihyeon Pyeon"
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[var(--color-text)] text-lg">Euihyeon Pyeon</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Author
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {t.creditsAuthorBio}
              </p>

              {/* Social links */}
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] transition-all ${link.color}`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── References ── */}
      <section className="mb-14">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
          {t.creditsReferencesSection}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          {t.creditsReferencesDesc}
        </p>

        <div className="space-y-3">
          {REFERENCES.map((ref) => {
            const c = COLOR_MAP[ref.color];
            return (
              <a
                key={ref.name}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block p-5 rounded-2xl border border-[var(--color-border)] ${c.border} hover:bg-[var(--color-bg-secondary)] transition-all group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
                      <span className="font-mono text-sm font-semibold text-[var(--color-text)] group-hover:text-white transition-colors">
                        {ref.author}/{ref.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${c.tag}`}>
                        {ref.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {lang === "en" ? ref.description.en : ref.description.ko}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] flex-shrink-0 mt-1 transition-colors">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ── Built With ── */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
          {t.creditsTechSection}
        </h2>
        <div className="flex flex-wrap gap-2">
          {["Next.js 16", "React 19", "Tailwind CSS v4", "TypeScript", "Shiki", "remark", "Vercel"].map((tech) => (
            <span key={tech} className="px-3 py-1 rounded-lg text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── License ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          {t.creditsLicenseSection}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
          {t.creditsLicenseDesc}
        </p>
        <a
          href="https://github.com/ehpyeon/harness101/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
        >
          View LICENSE
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </section>

      <footer className="mt-16 text-center text-xs text-[var(--color-text-muted)]/40 border-t border-[var(--color-border-subtle)] pt-10 pb-8">
        <p className="italic">&ldquo;The Model IS the Agent. The Code IS the Harness.&rdquo;</p>
      </footer>
    </main>
  );
}
