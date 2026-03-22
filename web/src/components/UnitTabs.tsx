"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { CompleteButton } from "./ProgressBar";
import { useLang } from "@/context/LangContext";

interface UnitTabsProps {
  campfire: string;
  workshop: string;
  reflection: string;
  recallQuestions: string[];
  unitId?: string;
  // English content
  enCampfire?: string;
  enWorkshop?: string;
  enReflection?: string;
  enRecallQuestions?: string[];
}

const TAB_AMBIENT: Record<string, string> = {
  campfire: "tab-campfire",
  workshop: "tab-workshop",
  reflection: "tab-reflection",
};

const RECALL_LABELS = ["Why", "Where", "Consequence"];
const RECALL_COLORS = [
  { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-700 dark:text-indigo-300", accent: "text-indigo-500 dark:text-indigo-400" },
  { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-700 dark:text-indigo-200", accent: "text-indigo-500 dark:text-indigo-300" },
  { bg: "bg-indigo-500/10", border: "border-indigo-500/15", text: "text-indigo-700 dark:text-indigo-200", accent: "text-indigo-500 dark:text-indigo-300" },
];

export default function UnitTabs({
  campfire, workshop, reflection, recallQuestions, unitId,
  enCampfire, enWorkshop, enReflection, enRecallQuestions,
}: UnitTabsProps) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState<"campfire" | "workshop" | "reflection">("campfire");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [tocOpen, setTocOpen] = useState(false);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Pick content based on current language
  const activeCampfire = lang === "en" ? (enCampfire ?? campfire) : campfire;
  const activeWorkshop = lang === "en" ? (enWorkshop ?? workshop) : workshop;
  const activeReflection = lang === "en" ? (enReflection ?? reflection) : reflection;
  const activeRecall = lang === "en" ? (enRecallQuestions ?? recallQuestions) : recallQuestions;

  const TABS = [
    { id: "campfire" as const, label: t.tabCampfire, icon: "📖", desc: t.tabCampfireDesc },
    { id: "workshop" as const, label: t.tabWorkshop, icon: "🔧", desc: t.tabWorkshopDesc },
    { id: "reflection" as const, label: t.tabReflection, icon: "✓", desc: t.tabReflectionDesc },
  ];

  const toggleCard = (idx: number) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const content = {
    campfire: activeCampfire,
    workshop: activeWorkshop,
    reflection: activeReflection,
  };
  const hasWorkshop = activeWorkshop.trim().length > 50;
  const hasReflection = activeReflection.trim().length > 50;

  // Reset flipped cards when language changes
  useEffect(() => {
    setFlippedCards(new Set());
  }, [lang]);

  const handleTabChange = (tabId: "campfire" | "workshop" | "reflection") => {
    setActiveTab(tabId);
    setTocOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Next tab logic
  const nextTab = useMemo(() => {
    if (activeTab === "campfire" && hasWorkshop) return "workshop" as const;
    if (activeTab === "campfire" && !hasWorkshop && hasReflection) return "reflection" as const;
    if (activeTab === "workshop" && hasReflection) return "reflection" as const;
    return null;
  }, [activeTab, hasWorkshop, hasReflection]);

  const nextTabLabel = nextTab ? TABS.find((tab) => tab.id === nextTab)?.label : null;

  // Add copy buttons to code blocks
  const enhanceCodeBlocks = useCallback(() => {
    if (!contentRef.current) return;
    const pres = contentRef.current.querySelectorAll("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      if (pre.scrollWidth > pre.clientWidth) {
        pre.classList.add("has-overflow");
      }
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", t.copyCode);
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = pre.querySelector("code");
        if (code) {
          await navigator.clipboard.writeText(code.textContent || "");
          btn.classList.add("copied");
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          }, 2000);
        }
      });
      pre.appendChild(btn);
    });
  }, [t.copyCode]);

  // Extract TOC headings
  const tocHeadings = useMemo(() => {
    const html = content[activeTab];
    const headings: { level: number; text: string; id: string }[] = [];
    const regex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, "").trim();
      if (text) {
        const id = `heading-${text.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase()}`;
        headings.push({ level: parseInt(match[1]), text, id });
      }
    }
    return headings;
  }, [activeTab, content]);

  // Add ids to headings + enhance code blocks
  useEffect(() => {
    enhanceCodeBlocks();
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll("h2, h3");
    headings.forEach((el) => {
      const text = el.textContent?.trim() || "";
      const id = `heading-${text.replace(/\s+/g, "-").replace(/[^\w가-힣-]/g, "").toLowerCase()}`;
      el.id = id;
    });
  }, [activeTab, enhanceCodeBlocks, lang]);

  return (
    <div>
      {/* Tab Navigation */}
      <div
        ref={tabBarRef}
        className="pb-4 pt-2"
      >
        <div
          className="flex items-center gap-1 p-1 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)]"
          role="tablist"
          aria-label={t.tabsAriaLabel}
        >
          {TABS.map((tab) => {
            const isEmpty =
              (tab.id === "workshop" && !hasWorkshop) ||
              (tab.id === "reflection" && !hasReflection);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => !isEmpty && handleTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls="unit-tabpanel"
                id={`tab-${tab.id}`}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-bg-elevated)] text-[var(--color-text)] shadow-sm border border-[var(--color-border)]"
                    : isEmpty
                    ? "text-[var(--color-text-muted)]/30 cursor-not-allowed"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]/50"
                }`}
                disabled={isEmpty}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini TOC */}
      {tocHeadings.length >= 3 && (
        <div className="mb-6">
          <button
            onClick={() => setTocOpen((v) => !v)}
            className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <span className={`transition-transform ${tocOpen ? "rotate-90" : ""}`}>▶</span>
            <span>{t.tocSection(tocHeadings.length)}</span>
          </button>
          {tocOpen && (
            <nav className="mt-2 pl-4 border-l border-[var(--color-border-subtle)] space-y-1">
              {tocHeadings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`block text-xs hover:text-[var(--color-text-secondary)] transition-colors ${
                    h.level === 2
                      ? "text-[var(--color-text-muted)] font-medium"
                      : "text-[var(--color-text-muted)]/70 pl-3"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(h.id);
                    if (el) {
                      const top = el.getBoundingClientRect().top + window.scrollY - 72;
                      window.scrollTo({ top, behavior: "smooth" });
                    }
                  }}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div
        ref={contentRef}
        className={`${TAB_AMBIENT[activeTab]} rounded-lg`}
        role="tabpanel"
        id="unit-tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        <div key={`${activeTab}-${lang}`} className="tab-content-enter">
          <article
            className="prose max-w-prose mx-auto"
            dangerouslySetInnerHTML={{ __html: content[activeTab] }}
          />
        </div>
      </div>

      {/* Bottom: Next tab button */}
      {nextTab && nextTabLabel && (
        <div className="mt-10 max-w-prose mx-auto">
          <button
            onClick={() => handleTabChange(nextTab)}
            className="w-full py-3 px-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-all text-sm group flex items-center justify-center gap-2"
          >
            <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]">
              {t.nextTabPrefix} <span className="font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]">{nextTabLabel}</span>
            </span>
            <span className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]">→</span>
          </button>
        </div>
      )}

      {/* Recall Checkpoint (reflection tab) */}
      {activeTab === "reflection" && activeRecall.length > 0 && (
        <section className="mt-14 pt-8 border-t border-[var(--color-border-subtle)] max-w-prose mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧠</span>
            <h3 className="text-base font-semibold text-[var(--color-text)]">{t.recallTitle}</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">
            {t.recallDesc}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeRecall.map((q, idx) => {
              const c = RECALL_COLORS[idx] || RECALL_COLORS[0];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCard(idx)}
                  role="button"
                  aria-label={`${RECALL_LABELS[idx]} question`}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleCard(idx); } }}
                  className={`recall-card ${flippedCards.has(idx) ? "flipped" : ""}`}
                >
                  <div className="recall-card-inner relative min-h-[10rem]">
                    <div className={`recall-card-front absolute inset-0 ${c.bg} border ${c.border} rounded-xl p-5 flex flex-col items-center justify-center text-center`}>
                      <span className={`text-2xl font-bold ${c.accent} mb-2`}>
                        {RECALL_LABELS[idx]}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">{t.recallClickHint}</span>
                    </div>
                    <div className={`recall-card-back absolute inset-0 ${c.bg} border ${c.border} rounded-xl p-5 flex items-center justify-center text-center`}>
                      <p className={`text-sm ${c.text} leading-relaxed`}>{q}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Complete button — only in reflection tab */}
      {activeTab === "reflection" && unitId && (
        <div className="mt-10 flex justify-center max-w-prose mx-auto">
          <CompleteButton unitId={unitId} />
        </div>
      )}
    </div>
  );
}
