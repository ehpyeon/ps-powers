"use client";

import Link from "next/link";
import { UNITS, LEARNING_ORDER, LAYER_COLORS, LAYER_ICONS } from "@/lib/units";
import ProgressBar from "@/components/ProgressBar";
import UnitCheckbox from "@/components/UnitCheckbox";
import { useLang } from "@/context/LangContext";

const ACT_COLOR: Record<string, string> = {
  prologue: "text-indigo-400",
  act1: "text-blue-400",
  act2: "text-emerald-400",
  act3: "text-amber-400",
};

const ACT_LINE: Record<string, string> = {
  prologue: "from-indigo-500/60 to-indigo-500/20",
  act1: "from-blue-500/60 to-blue-500/20",
  act2: "from-emerald-500/60 to-emerald-500/20",
  act3: "from-amber-500/60 to-amber-500/20",
};

export default function Home() {
  const { t, lang } = useLang();
  const orderedUnits = LEARNING_ORDER.map((id) => UNITS.find((u) => u.id === id)).filter((u): u is typeof UNITS[number] => u !== undefined);
  const acts = ["prologue", "act1", "act2", "act3"] as const;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      {/* Hero */}
      <section className="mb-20">
        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400/70 mb-5">
          {t.heroEyebrow}
        </p>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8 leading-tight">
          <span className="bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent">
            {t.heroTitle}
          </span>
        </h1>

        {/* Problem */}
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {t.heroProblemBody}
        </p>

        {/* Insight */}
        <p className="text-base text-[var(--color-text)] leading-relaxed mb-8">
          {t.heroInsight}
        </p>

        {/* Harness breakdown */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl px-5 py-5 mb-6">
          {/* Formula header */}
          <div className="flex items-center gap-2 font-mono text-sm mb-4 flex-wrap">
            <span className="text-[var(--color-text-muted)]">Harness</span>
            <span className="text-[var(--color-text-muted)]">=</span>
            {(["tools", "knowledge", "context", "permissions"] as const).map((layer, i) => {
              const ic = LAYER_ICONS[layer];
              return (
                <span key={layer} className="inline-flex items-center gap-1">
                  {i > 0 && <span className="text-[var(--color-border)] mr-1">+</span>}
                  <svg viewBox="0 0 16 16" fill={ic.color} className="w-3 h-3 flex-shrink-0">
                    <path d={ic.path} fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                  <span style={{ color: ic.color }} className="font-medium">{ic.label}</span>
                </span>
              );
            })}
          </div>

          {/* Layer descriptions */}
          <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
            {([
              {
                layer: "tools" as const,
                desc: t.heroLayerTools,
                chapters: [{ title: "MCPs", num: "09" }, { title: "Background Task", num: "07" }],
              },
              {
                layer: "knowledge" as const,
                desc: t.heroLayerKnowledge,
                chapters: [{ title: "CLAUDE.md", num: "02" }, { title: "Skills", num: "04" }, { title: "Rules", num: "08" }],
              },
              {
                layer: "context" as const,
                desc: t.heroLayerContext,
                chapters: [{ title: "Context Compact", num: "11" }, { title: "Agent Teams", num: "12" }, { title: "Worktree Isolation", num: "13" }, { title: "Agent", num: "06" }, { title: "MEMORY.md", num: "14" }, { title: "Token Economics", num: "15" }],
              },
              {
                layer: "permissions" as const,
                desc: t.heroLayerPermissions,
                chapters: [{ title: "Hooks", num: "03" }, { title: "Security", num: "10" }],
              },
            ] as const).map(({ layer, desc, chapters }) => {
              const ic = LAYER_ICONS[layer];
              return (
                <div key={layer} className="flex gap-3">
                  <svg viewBox="0 0 16 16" fill={ic.color} className="w-3 h-3 flex-shrink-0 mt-[3px]">
                    <path d={ic.path} fillRule="evenodd" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <span style={{ color: ic.color }} className="text-xs font-semibold mr-1.5">{ic.label}:</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{desc}</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {chapters.map((ch) => (
                        <span key={ch.num} className="text-[10px] text-[var(--color-text-muted)]/50 font-mono">
                          {ch.title}({ch.num})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Closing */}
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          {t.heroClosing}
        </p>
      </section>

      {/* Progress */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-[var(--color-text-muted)]">{t.progressLabel}</span>
        </div>
        <ProgressBar />
      </section>

      {/* Chapters - grouped by Act */}
      {acts.map((actKey) => {
        const actInfo = t.acts[actKey];
        const actUnits = orderedUnits.filter((u) => u.act === actKey);
        if (actUnits.length === 0) return null;

        return (
          <section key={actKey} className="mb-14">
            {/* Act Header */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${ACT_COLOR[actKey]}`}>
                {actInfo.label}
              </h2>
              <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              <span className="text-xs text-[var(--color-text-muted)]/50">{actInfo.desc}</span>
            </div>

            {/* Chapter List */}
            <div className="relative">
              {/* Timeline line */}
              <div className={`absolute left-[10px] top-3 bottom-3 w-px bg-gradient-to-b ${ACT_LINE[actKey]}`} />

              <div className="space-y-1">
                {actUnits.map((unit) => {
                  const icon = LAYER_ICONS[unit.layer];
                  const subtitle = lang === "en" ? (unit.en?.subtitle ?? unit.subtitle) : unit.subtitle;

                  return (
                    <div key={unit.id} className="group relative pl-10 flex items-center">
                      {/* Timeline icon */}
                      <div className="absolute left-[1px] top-[14px] w-[20px] h-[20px] group-hover:scale-125 transition-transform z-10">
                        <svg viewBox="0 0 16 16" fill={icon.color} className="w-full h-full drop-shadow-sm">
                          <path d={icon.path} fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                      </div>

                      <Link href={`/units/${unit.id}`} className="flex-1 block">
                        <div className="py-3 px-4 rounded-xl border border-transparent group-hover:border-[var(--color-border)] group-hover:bg-[var(--color-bg-secondary)] transition-all">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono text-[var(--color-text-muted)]/50">{unit.number}</span>
                            <span className="text-[11px] text-[var(--color-text-muted)]/60">{unit.title}</span>
                          </div>
                          <h3 className="text-[15px] font-semibold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)] transition-colors">
                            {subtitle}
                          </h3>
                        </div>
                      </Link>
                      <div className="pr-2">
                        <UnitCheckbox unitId={unit.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      {/* Footer */}
      <footer className="text-center text-xs text-[var(--color-text-muted)]/40 border-t border-[var(--color-border-subtle)] pt-10 pb-8">
        <p className="italic">&ldquo;{t.footerQuote}&rdquo;</p>
        <Link href="/credits" className="mt-3 inline-block text-[var(--color-text-muted)]/30 hover:text-[var(--color-text-muted)] transition-colors">
          {t.creditsLink}
        </Link>
      </footer>
    </main>
  );
}
