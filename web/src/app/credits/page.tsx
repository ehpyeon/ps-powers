import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credits — harness101",
  description: "References and inspirations for harness101",
};

const REFERENCES = [
  {
    name: "learn-claude-code",
    author: "shareAI-lab",
    url: "https://github.com/shareAI-lab/learn-claude-code",
    description: {
      ko: "Claude Code를 처음 접하는 사람들을 위한 체계적인 학습 가이드. 이 프로젝트의 교육적 접근 방식에 큰 영향을 주었습니다.",
      en: "A structured learning guide for Claude Code beginners. This project greatly influenced the educational approach of harness101.",
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
      en: "A comprehensive reference covering all Claude Code features and capabilities. Referenced for exploring various usage patterns.",
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
      en: "A curated collection of battle-tested Claude Code best practices. Referenced for designing the Permissions layer of Harness Engineering.",
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

export default function CreditsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-14">
        <Link href="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-6 inline-flex items-center gap-1">
          ← 학습 경로로 돌아가기
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] mt-4 mb-3">
          Credits
        </h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          harness101은 다음 훌륭한 프로젝트들에서 영감을 받았습니다.
          <br />
          <span className="text-[var(--color-text-muted)] text-sm">
            This project was inspired by and built upon the following great works.
          </span>
        </p>
      </div>

      {/* Reference Cards */}
      <div className="space-y-4">
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
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-1">
                    {ref.description.ko}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {ref.description.en}
                  </p>
                </div>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] flex-shrink-0 mt-1 transition-colors"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </div>
            </a>
          );
        })}
      </div>

      {/* Built with */}
      <div className="mt-16 pt-10 border-t border-[var(--color-border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-6">
          Built With
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            "Next.js 16", "React 19", "Tailwind CSS v4", "TypeScript",
            "Shiki", "remark", "Vercel",
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-lg text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* License */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
          License
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          MIT License — feel free to use, modify, and distribute.
        </p>
        <a
          href="https://github.com/ehpyeon/harness101/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-accent-hover)] hover:text-[var(--color-accent-soft)]"
        >
          View LICENSE
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      <footer className="mt-16 text-center text-xs text-[var(--color-text-muted)]/40 border-t border-[var(--color-border-subtle)] pt-10 pb-8">
        <p className="italic">&ldquo;The Model IS the Agent. The Code IS the Harness.&rdquo;</p>
      </footer>
    </main>
  );
}
