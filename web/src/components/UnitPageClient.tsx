"use client";

import Link from "next/link";
import { LAYER_COLORS, LEARNING_ORDER, UNITS, LAYER_ICONS, type UnitMeta, getUnit } from "@/lib/units";
import UnitTabs from "./UnitTabs";
import { CompleteButton } from "./ProgressBar";
import { useLang } from "@/context/LangContext";

const ACT_COLOR: Record<string, string> = {
  prologue: "text-indigo-400/70",
  act1: "text-blue-400/70",
  act2: "text-emerald-400/70",
  act3: "text-amber-400/70",
};

interface UnitPageClientProps {
  unit: UnitMeta;
  koContent: { campfire: string; workshop: string; reflection: string };
  enContent: { campfire: string; workshop: string; reflection: string };
  stepNumber: number;
  prevUnit?: UnitMeta;
  nextUnit?: UnitMeta;
}

export default function UnitPageClient({
  unit, koContent, enContent, stepNumber, prevUnit, nextUnit,
}: UnitPageClientProps) {
  const { t, lang } = useLang();
  const colors = LAYER_COLORS[unit.layer];
  const act = t.acts[unit.act];

  const subtitle = lang === "en" ? (unit.en?.subtitle ?? unit.subtitle) : unit.subtitle;
  const motto = lang === "en" ? (unit.en?.motto ?? unit.motto) : unit.motto;
  const layerLabel = lang === "en" ? (unit.en?.layerLabel ?? unit.layerLabel) : unit.layerLabel;
  const difficulty = t.difficulty[unit.difficulty] ?? unit.difficulty;
  const recallQuestions = unit.recallQuestions;
  const enRecallQuestions = unit.en?.recallQuestions;

  const prevSubtitle = prevUnit ? (lang === "en" ? (prevUnit.en?.subtitle ?? prevUnit.subtitle) : prevUnit.subtitle) : undefined;
  const nextSubtitle = nextUnit ? (lang === "en" ? (nextUnit.en?.subtitle ?? nextUnit.subtitle) : nextUnit.subtitle) : undefined;

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-[var(--color-border-subtle)] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-5 px-3">
        {(["prologue", "act1", "act2", "act3"] as const).map((actKey) => {
          const actInfo = t.acts[actKey];
          const actUnits = LEARNING_ORDER
            .map((uid) => UNITS.find((u) => u.id === uid))
            .filter((u): u is UnitMeta => u !== undefined)
            .filter((u) => u.act === actKey);
          if (actUnits.length === 0) return null;
          return (
            <div key={actKey} className="mb-4">
              {/* Act header */}
              <div className="px-2.5 mb-1.5 flex items-center gap-2">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${ACT_COLOR[actKey]}`}>
                  {actInfo.label}
                </div>
                <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              </div>

              <nav className="space-y-px">
                {actUnits.map((u) => {
                  const isActive = u.id === unit.id;
                  const uIcon = LAYER_ICONS[u.layer];
                  const uSubtitle = lang === "en" ? (u.en?.subtitle ?? u.subtitle) : u.subtitle;
                  return (
                    <Link
                      key={u.id}
                      href={`/units/${u.id}`}
                      className={`block px-2.5 py-2 rounded-lg transition-colors group ${
                        isActive
                          ? "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
                          : "hover:bg-[var(--color-bg-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <svg viewBox="0 0 16 16" fill={uIcon.color} className={`w-3 h-3 flex-shrink-0 ${isActive ? "" : "opacity-40"}`}>
                          <path d={uIcon.path} fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                        <span className={`font-mono text-[10px] ${isActive ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]/40"}`}>
                          {u.number}
                        </span>
                        <span className={`text-[11px] ${isActive ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]/60"}`}>
                          {u.title}
                        </span>
                      </div>
                      <div className={`pl-3.5 text-[12px] leading-snug ${
                        isActive ? "text-[var(--color-text)] font-medium" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                      }`}>
                        {uSubtitle}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
            {t.breadcrumbHome}
          </Link>
          <span className="text-[var(--color-border)]">/</span>
          <span className={`${ACT_COLOR[unit.act]}`}>{act.label}</span>
          <span className="text-[var(--color-border)]">/</span>
          <span className="text-[var(--color-text-secondary)]">{unit.number}. {unit.title}</span>
        </div>

        {/* Unit Header */}
        <header className="mb-10">
          {/* Meta row */}
          <div className="flex items-center gap-2.5 mb-3">
            <svg viewBox="0 0 16 16" fill={LAYER_ICONS[unit.layer].color} className="w-4 h-4 flex-shrink-0">
              <path d={LAYER_ICONS[unit.layer].path} fillRule="evenodd" clipRule="evenodd" />
            </svg>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
              {layerLabel}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">Ch.{unit.number} / {LEARNING_ORDER.length}</span>
            <span className="text-[var(--color-border)]">&middot;</span>
            <span className="text-xs text-[var(--color-text-muted)]">{difficulty}</span>
            <span className="text-[var(--color-border)]">&middot;</span>
            <span className="text-xs text-[var(--color-text-muted)]">{unit.time}</span>
          </div>

          {/* Title + Subtitle */}
          <p className="text-sm text-[var(--color-text-muted)] mb-1 font-mono">{unit.title}</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            {subtitle}
          </h1>

          {/* Motto */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
            <p className="text-sm italic text-indigo-400/70 px-2">
              &ldquo;{motto}&rdquo;
            </p>
            <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
          </div>

          {/* Harness position bar */}
          <div className="mt-5 flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--color-text-muted)]">Harness =</span>
            {(["Tools", "Knowledge", "Context", "Permissions"] as const).map((layer) => {
              const isActive =
                (layer === "Tools" && (unit.layer === "tools" || unit.layer === "foundation")) ||
                (layer === "Knowledge" && unit.layer === "knowledge") ||
                (layer === "Context" && unit.layer === "context") ||
                (layer === "Permissions" && unit.layer === "permissions");
              const colorMap = { Tools: "text-blue-400", Knowledge: "text-purple-400", Context: "text-emerald-400", Permissions: "text-amber-400" };
              return (
                <span key={layer}>
                  <span className={isActive ? `${colorMap[layer]} font-bold` : "text-[var(--color-text-muted)]/30"}>
                    {isActive ? `【${layer}】` : layer}
                  </span>
                  {layer !== "Permissions" && <span className="text-[var(--color-border)] mx-1">+</span>}
                </span>
              );
            })}
          </div>

          {/* Prerequisites + Complete */}
          <div className="mt-5 flex items-center justify-between">
            {unit.prerequisites.length > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <span>{t.prerequisiteLabel}</span>
                {unit.prerequisites.map((pre) => {
                  const preUnit = getUnit(pre);
                  return (
                    <Link key={pre} href={`/units/${pre}`} className="px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                      {pre} {preUnit?.title}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-[var(--color-text-muted)]">{t.firstChapter}</div>
            )}
            <CompleteButton unitId={unit.id} />
          </div>
        </header>

        {/* Content with Tabs */}
        <UnitTabs
          campfire={koContent.campfire}
          workshop={koContent.workshop}
          reflection={koContent.reflection}
          recallQuestions={recallQuestions}
          unitId={unit.id}
          enCampfire={enContent.campfire}
          enWorkshop={enContent.workshop}
          enReflection={enContent.reflection}
          enRecallQuestions={enRecallQuestions}
        />

        {/* Prev/Next Navigation */}
        <nav className="mt-8 pt-8 border-t border-[var(--color-border-subtle)] grid grid-cols-2 gap-4">
          {prevUnit ? (
            <Link href={`/units/${prevUnit.id}`} className="group p-4 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{t.prevChapter}</p>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]">
                {prevSubtitle}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                Ch.{prevUnit.number} {prevUnit.title}
              </p>
            </Link>
          ) : <div />}

          {nextUnit ? (
            <Link href={`/units/${nextUnit.id}`} className="group p-4 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] transition-colors text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{t.nextChapter}</p>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text)]">
                {nextSubtitle}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                Ch.{nextUnit.number} {nextUnit.title}
              </p>
            </Link>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-right">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1">{t.congratulations}</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">{t.allComplete}</p>
            </div>
          )}
        </nav>
      </main>
    </div>
  );
}
