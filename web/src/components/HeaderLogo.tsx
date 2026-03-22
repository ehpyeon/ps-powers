"use client";

import { useLang } from "@/context/LangContext";

export default function HeaderLogo() {
  const { t } = useLang();

  return (
    <a href="/" className="flex items-center gap-2.5 group">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
        <span className="text-[11px] font-black text-white tracking-tight">H</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-sm text-[var(--color-text)]">{t.headerTitle}</span>
        <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:block">{t.headerSubtitle}</span>
      </div>
    </a>
  );
}
