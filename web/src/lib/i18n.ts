export type Lang = "ko" | "en";

export const translations = {
  ko: {
    // Site meta
    siteTitle: "Harness 101 — 스토리텔링으로 배우는 Harness Engineering",
    siteDescription: "지민의 4주간의 여정을 따라가며 Claude Code의 모든 것을 배운다",

    // Layout
    skipToContent: "본문으로 건너뛰기",
    headerTitle: "Harness 101",
    headerSubtitle: "스토리텔링으로 배우는 Claude Code",
    searchHint: "검색",
    menuOpen: "메뉴 열기",
    menuClose: "메뉴 닫기",
    creditsLink: "Credits",

    // Home page
    heroSubtitle: "스토리텔링으로 배우는 Claude Code",
    heroTitle: "Harness 101",
    heroDesc1: "2년차 개발자 지민이 Claude Code를 만나고,",
    heroDesc2: "도구 사용자에서",
    heroDesc3: "Harness Engineer",
    heroDesc4: "가 되기까지.",
    progressLabel: "학습 진행률",
    footerQuote: "The Model IS the Agent. The Code IS the Harness.",

    // Unit page
    breadcrumbHome: "학습 경로",
    prerequisiteLabel: "선행:",
    firstChapter: "첫 번째 챕터",
    prevChapter: "← 이전 챕터",
    nextChapter: "다음 챕터 →",
    congratulations: "축하합니다!",
    allComplete: "모든 챕터 완료",

    // UnitTabs
    tabCampfire: "왜 필요한가",
    tabCampfireDesc: "배경 이야기",
    tabWorkshop: "어떻게 쓰는가",
    tabWorkshopDesc: "실습",
    tabReflection: "정리",
    tabReflectionDesc: "요약",
    tocSection: (n: number) => `목차 (${n}개 섹션)`,
    nextTabPrefix: "다음:",
    recallTitle: "회상 체크포인트",
    recallDesc: "카드를 클릭해서 질문을 확인하세요. 한 문장으로 답해보세요 — 자기 말로 정리해야 기억에 남습니다.",
    recallClickHint: "클릭하여 질문 보기",
    copyCode: "코드 복사",
    tabsAriaLabel: "콘텐츠 탭",

    // ProgressBar / CompleteButton
    completeButton: "완료로 표시",
    completedButton: "✓ 완료됨",
    uncompleteAria: "완료 취소",
    completeAria: "완료로 표시",

    // CommandPalette
    searchPlaceholder: "유닛 검색... (제목, 모토, 레이어)",
    searchAriaLabel: "유닛 검색",
    noResults: "검색 결과가 없습니다",
    kbNavigate: "↑↓ 탐색",
    kbSelect: "↵ 이동",
    kbClose: "ESC 닫기",

    // MobileSidebar
    sidebarTitle: "학습 경로",

    // ReadingProgress
    readingProgressAria: "읽기 진행률",

    // Acts
    acts: {
      prologue: { label: "프롤로그", desc: "여정의 시작" },
      act1: { label: "Act 1 — 생존", desc: "혼자서 살아남기" },
      act2: { label: "Act 2 — 성장", desc: "무기를 갖추다" },
      act3: { label: "Act 3 — 규모", desc: "팀으로 론칭하다" },
    } as Record<string, { label: string; desc: string }>,

    // Difficulty labels
    difficulty: {
      "입문": "입문",
      "초중급": "초중급",
      "중급": "중급",
      "고급": "고급",
    } as Record<string, string>,

    // Language/theme toggle
    langToggleLabel: "언어 전환",
    themeToggleLabel: "테마 전환",

    // Translation notice
    translationNotice: "이 챕터의 콘텐츠는 현재 한국어로만 제공됩니다.",

    // Credits page
    creditsPageTitle: "Credits & Author",
    creditsAuthorSection: "만든 사람",
    creditsAuthorBio: "Claude Code와 AI 에이전트 시스템에 관심이 많은 개발자입니다. Harness Engineering의 개념을 스토리텔링으로 전달하기 위해 이 프로젝트를 만들었습니다.",
    creditsAuthorConnect: "연결하기",
    creditsReferencesSection: "참고한 프로젝트",
    creditsReferencesDesc: "Harness 101은 다음 훌륭한 프로젝트들에서 영감을 받았습니다.",
    creditsTechSection: "Built With",
    creditsLicenseSection: "License",
    creditsLicenseDesc: "MIT License — 자유롭게 사용, 수정, 배포하세요.",
    creditsBackLink: "← 학습 경로로 돌아가기",
  },

  en: {
    // Site meta
    siteTitle: "Harness 101 — Learning Harness Engineering through Storytelling",
    siteDescription: "Follow Jimin's 4-week journey to master Claude Code and become a Harness Engineer",

    // Layout
    skipToContent: "Skip to content",
    headerTitle: "Harness 101",
    headerSubtitle: "Learning Claude Code through Storytelling",
    searchHint: "Search",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    creditsLink: "Credits",

    // Home page
    heroSubtitle: "Learning Claude Code through Storytelling",
    heroTitle: "Harness 101",
    heroDesc1: "A second-year developer meets Claude Code,",
    heroDesc2: "transforming from a casual user into a",
    heroDesc3: "Harness Engineer",
    heroDesc4: ".",
    progressLabel: "Learning Progress",
    footerQuote: "The Model IS the Agent. The Code IS the Harness.",

    // Unit page
    breadcrumbHome: "Learning Path",
    prerequisiteLabel: "Prerequisites:",
    firstChapter: "First chapter",
    prevChapter: "← Previous",
    nextChapter: "Next →",
    congratulations: "Congratulations!",
    allComplete: "All chapters complete",

    // UnitTabs
    tabCampfire: "Why It Matters",
    tabCampfireDesc: "Background story",
    tabWorkshop: "How to Use It",
    tabWorkshopDesc: "Hands-on",
    tabReflection: "Summary",
    tabReflectionDesc: "Wrap-up",
    tocSection: (n: number) => `Table of contents (${n} sections)`,
    nextTabPrefix: "Next:",
    recallTitle: "Recall Checkpoint",
    recallDesc: "Click a card to reveal the question. Answer in one sentence — recall in your own words for it to stick.",
    recallClickHint: "Click to reveal",
    copyCode: "Copy code",
    tabsAriaLabel: "Content tabs",

    // ProgressBar / CompleteButton
    completeButton: "Mark complete",
    completedButton: "✓ Completed",
    uncompleteAria: "Mark incomplete",
    completeAria: "Mark complete",

    // CommandPalette
    searchPlaceholder: "Search units... (title, motto, layer)",
    searchAriaLabel: "Search units",
    noResults: "No results found",
    kbNavigate: "↑↓ navigate",
    kbSelect: "↵ go",
    kbClose: "ESC close",

    // MobileSidebar
    sidebarTitle: "Learning Path",

    // ReadingProgress
    readingProgressAria: "Reading progress",

    // Acts
    acts: {
      prologue: { label: "Prologue", desc: "Beginning of the journey" },
      act1: { label: "Act 1 — Survival", desc: "Making it alone" },
      act2: { label: "Act 2 — Growth", desc: "Getting equipped" },
      act3: { label: "Act 3 — Scale", desc: "Launching as a team" },
    } as Record<string, { label: string; desc: string }>,

    // Difficulty labels
    difficulty: {
      "입문": "Beginner",
      "초중급": "Lower-Intermediate",
      "중급": "Intermediate",
      "고급": "Advanced",
    } as Record<string, string>,

    // Language/theme toggle
    langToggleLabel: "Switch language",
    themeToggleLabel: "Switch theme",

    // Translation notice
    translationNotice: "This chapter's content is currently available in Korean only. English translation in progress.",

    // Credits page
    creditsPageTitle: "Credits & Author",
    creditsAuthorSection: "Author",
    creditsAuthorBio: "A developer interested in Claude Code and AI agent systems. Built this project to share the concept of Harness Engineering through storytelling.",
    creditsAuthorConnect: "Connect",
    creditsReferencesSection: "References",
    creditsReferencesDesc: "Harness 101 was inspired by and built upon the following great works.",
    creditsTechSection: "Built With",
    creditsLicenseSection: "License",
    creditsLicenseDesc: "MIT License — feel free to use, modify, and distribute.",
    creditsBackLink: "← Back to Learning Path",
  },
} as const;

export type Translations = typeof translations.ko;
