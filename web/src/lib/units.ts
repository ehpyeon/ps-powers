export interface UnitMeta {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  motto: string;
  layer: "foundation" | "knowledge" | "permissions" | "context" | "tools";
  layerLabel: string;
  act: "prologue" | "act1" | "act2" | "act3";
  difficulty: string;
  time: string;
  prerequisites: string[];
  file: string;
  recallQuestions: string[];
  en?: {
    subtitle: string;
    motto: string;
    layerLabel: string;
    recallQuestions: string[];
  };
}

// ACTS is now derived from i18n.ts translations — kept here for backward compat
export const ACTS: Record<string, { label: string; desc: string }> = {
  prologue: { label: "프롤로그", desc: "여정의 시작" },
  act1: { label: "Act 1 — 생존", desc: "혼자서 살아남기" },
  act2: { label: "Act 2 — 성장", desc: "무기를 갖추다" },
  act3: { label: "Act 3 — 규모", desc: "팀으로 론칭하다" },
};

export const LAYER_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  foundation: { bg: "bg-slate-800", text: "text-slate-300", border: "border-slate-600", accent: "text-white" },
  knowledge: { bg: "bg-purple-900/40", text: "text-purple-300", border: "border-purple-700", accent: "text-purple-400" },
  permissions: { bg: "bg-amber-900/40", text: "text-amber-300", border: "border-amber-700", accent: "text-amber-400" },
  context: { bg: "bg-emerald-900/40", text: "text-emerald-300", border: "border-emerald-700", accent: "text-emerald-400" },
  tools: { bg: "bg-blue-900/40", text: "text-blue-300", border: "border-blue-700", accent: "text-blue-400" },
};

export const LAYER_ICONS: Record<string, { color: string; label: string; path: string }> = {
  foundation: {
    color: "#818cf8", label: "Foundation",
    path: "M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z",
  },
  tools: {
    color: "#60a5fa", label: "Tools",
    path: "M13.7 3.7a1 1 0 00-1.4 0L10 6l-1-1 2.3-2.3a3.5 3.5 0 00-4.6 4.2L3.3 10.3a1.5 1.5 0 002.1 2.1l3.4-3.4a3.5 3.5 0 004.2-4.6L11 6.5l-1-1 2.3-2.3a1 1 0 000-1.4z",
  },
  knowledge: {
    color: "#a78bfa", label: "Knowledge",
    path: "M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v11a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 13.5v-11zM4.5 2a.5.5 0 00-.5.5v11a.5.5 0 00.5.5H6V2H4.5zM7 2v12h4.5a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5H7z",
  },
  context: {
    color: "#6ee7b7", label: "Context",
    path: "M8 1L15 5L8 9L1 5L8 1ZM2.2 7.4L8 10.6L13.8 7.4L15 8L8 12L1 8L2.2 7.4ZM2.2 10.4L8 13.6L13.8 10.4L15 11L8 15L1 11L2.2 10.4Z",
  },
  permissions: {
    color: "#fbbf24", label: "Permissions",
    path: "M8 1L14 3V7C14 10.3 11.4 13.2 8 14.8C4.6 13.2 2 10.3 2 7V3L8 1ZM8 2.2L3 3.8V7C3 9.8 5.2 12.3 8 13.7C10.8 12.3 13 9.8 13 7V3.8L8 2.2Z",
  },
};

export const LEARNING_ORDER = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  "14", // Security → MCPs 직후
  "10", "11", "12", "13", "15", "16",
];

export const UNITS: UnitMeta[] = [
  {
    id: "00", number: "00", title: "Harness Engineering", subtitle: "지민의 첫날",
    motto: "모델이 곧 에이전트다. 코드는 Harness다.",
    layer: "foundation", layerLabel: "프롤로그", act: "prologue",
    difficulty: "입문", time: "15분", prerequisites: [],
    file: "00-intro.md",
    recallQuestions: ["Harness란 무엇이고 왜 필요한가?", "Harness의 4개 레이어는?", "'사용자'와 'Harness Engineer'의 차이는?"],
    en: {
      subtitle: "Jimin's First Day",
      motto: "The Model IS the Agent. The Code IS the Harness.",
      layerLabel: "Prologue",
      recallQuestions: ["What is a Harness and why do we need one?", "What are the 4 layers of the Harness?", "What's the difference between a 'user' and a 'Harness Engineer'?"],
    },
  },
  {
    id: "01", number: "01", title: "The Agent Loop", subtitle: "복사-붙여넣기의 종말",
    motto: "하나의 루프와 Bash면 충분하다",
    layer: "foundation", layerLabel: "기반", act: "act1",
    difficulty: "입문", time: "60분", prerequisites: ["00"],
    file: "00-the-agent-loop.md",
    recallQuestions: ["Agent Loop가 해결하는 핵심 문제는?", "Harness의 4개 레이어는?", "Agent Loop 없이 Claude를 쓰면?"],
    en: {
      subtitle: "The End of Copy-Paste",
      motto: "One loop and Bash is enough.",
      layerLabel: "Foundation",
      recallQuestions: ["What core problem does the Agent Loop solve?", "What are the 4 layers of the Harness?", "What happens when you use Claude without the Agent Loop?"],
    },
  },
  {
    id: "02", number: "02", title: "CLAUDE.md", subtitle: "매일 출근하는 신입사원",
    motto: "매번 설명하는 건 지쳤다",
    layer: "knowledge", layerLabel: "Knowledge", act: "act1",
    difficulty: "입문", time: "45분", prerequisites: ["01"],
    file: "01-CLAUDE-md.md",
    recallQuestions: ["CLAUDE.md가 해결하는 핵심 문제는?", "Knowledge 레이어에 속한다 — 왜?", "CLAUDE.md 없이 살면?"],
    en: {
      subtitle: "The New Hire Who Shows Up Every Day",
      motto: "I'm tired of explaining this every single time.",
      layerLabel: "Knowledge",
      recallQuestions: ["What core problem does CLAUDE.md solve?", "Why does it belong to the Knowledge layer?", "What happens if you live without CLAUDE.md?"],
    },
  },
  {
    id: "03", number: "03", title: "Hooks", subtitle: "그날 밤에 일어난 일",
    motto: "Claude가 움직일 때 나도 움직이고 싶다",
    layer: "permissions", layerLabel: "Permissions", act: "act1",
    difficulty: "초중급", time: "75분", prerequisites: ["01", "02"],
    file: "02-hooks.md",
    recallQuestions: ["Hooks가 해결하는 핵심 문제는?", "Permissions 레이어에 속한다 — 왜?", "Hooks 없이 살면?"],
    en: {
      subtitle: "What Happened That Night",
      motto: "When Claude moves, I want to move with it.",
      layerLabel: "Permissions",
      recallQuestions: ["What core problem do Hooks solve?", "Why do Hooks belong to the Permissions layer?", "What happens if you live without Hooks?"],
    },
  },
  {
    id: "04", number: "04", title: "Skills", subtitle: "하루에 열 번 같은 말",
    motto: "지식은 필요할 때 로드하라, 미리 올리지 마라",
    layer: "knowledge", layerLabel: "Knowledge", act: "act1",
    difficulty: "초중급", time: "60분", prerequisites: ["01", "02"],
    file: "03-skills.md",
    recallQuestions: ["Skills가 해결하는 핵심 문제는?", "Knowledge 레이어 중 Skills의 역할은?", "Skills 없이 살면?"],
    en: {
      subtitle: "Saying the Same Thing Ten Times a Day",
      motto: "Load knowledge when needed — don't preload everything.",
      layerLabel: "Knowledge",
      recallQuestions: ["What core problem do Skills solve?", "What role do Skills play within the Knowledge layer?", "What happens if you live without Skills?"],
    },
  },
  {
    id: "05", number: "05", title: "Task System", subtitle: "어디까지 했어?",
    motto: "계획 없는 에이전트는 표류한다",
    layer: "context", layerLabel: "Context", act: "act2",
    difficulty: "중급", time: "75분", prerequisites: ["01", "02", "04"],
    file: "08-todo-task-system.md",
    recallQuestions: ["TodoWrite가 해결하는 핵심 문제는?", "Context 레이어에 속한다 — 왜?", "계획 없이 10단계 작업을 하면?"],
    en: {
      subtitle: "Where Did We Leave Off?",
      motto: "An agent without a plan drifts.",
      layerLabel: "Context",
      recallQuestions: ["What core problem does TodoWrite solve?", "Why does it belong to the Context layer?", "What happens when you run a 10-step task without a plan?"],
    },
  },
  {
    id: "06", number: "06", title: "Agents", subtitle: "산만한 리뷰",
    motto: "큰 작업을 나누면, 각 조각은 깨끗한 컨텍스트를 얻는다",
    layer: "context", layerLabel: "Context", act: "act2",
    difficulty: "중급", time: "75분", prerequisites: ["01", "02", "04", "05"],
    file: "04-agents.md",
    recallQuestions: ["Subagent가 해결하는 핵심 문제는?", "Context Isolation이란?", "격리 없이 복잡한 작업을 하면?"],
    en: {
      subtitle: "The Scattered Review",
      motto: "Split the work, and each piece gets a clean context.",
      layerLabel: "Context",
      recallQuestions: ["What core problem do Subagents solve?", "What is Context Isolation?", "What happens with complex work done without isolation?"],
    },
  },
  {
    id: "07", number: "07", title: "Background Tasks", subtitle: "30초의 침묵",
    motto: "기다리는 동안에도 에이전트는 생각한다",
    layer: "tools", layerLabel: "Tools + Context", act: "act2",
    difficulty: "중급", time: "60분", prerequisites: ["01", "06"],
    file: "09-background-tasks.md",
    recallQuestions: ["Background Tasks가 해결하는 핵심 문제는?", "Agent 추론과 I/O의 차이는?", "Background Tasks 없이 npm install을 하면?"],
    en: {
      subtitle: "30 Seconds of Silence",
      motto: "Even while waiting, the agent keeps thinking.",
      layerLabel: "Tools + Context",
      recallQuestions: ["What core problem do Background Tasks solve?", "What's the difference between agent reasoning and I/O?", "What happens when you run npm install without Background Tasks?"],
    },
  },
  {
    id: "08", number: "08", title: "Rules", subtitle: "350줄 괴물",
    motto: "불필요한 Knowledge로 Context를 오염시키지 않는다",
    layer: "knowledge", layerLabel: "Knowledge", act: "act2",
    difficulty: "중급", time: "45분", prerequisites: ["02", "04"],
    file: "05-rules.md",
    recallQuestions: ["Rules가 해결하는 핵심 문제는?", "CLAUDE.md vs Rules의 차이는?", "Rules 없이 350줄 CLAUDE.md를 쓰면?"],
    en: {
      subtitle: "The 350-Line Monster",
      motto: "Don't pollute the Context with unnecessary Knowledge.",
      layerLabel: "Knowledge",
      recallQuestions: ["What core problem do Rules solve?", "What's the difference between CLAUDE.md and Rules?", "What happens when you write a 350-line CLAUDE.md without Rules?"],
    },
  },
  {
    id: "09", number: "09", title: "MCPs", subtitle: "섬에서 대륙으로",
    motto: "표준화된 프로토콜로 모든 외부 서비스를 툴로",
    layer: "tools", layerLabel: "Tools", act: "act2",
    difficulty: "중급", time: "60분", prerequisites: ["01", "08"],
    file: "06-mcps.md",
    recallQuestions: ["MCP가 해결하는 핵심 문제는?", "stdio와 http의 차이는?", "MCP 없이 외부 서비스를 연결하려면?"],
    en: {
      subtitle: "From Island to Continent",
      motto: "Every external service becomes a tool via standardized protocol.",
      layerLabel: "Tools",
      recallQuestions: ["What core problem does MCP solve?", "What's the difference between stdio and http?", "How do you connect external services without MCP?"],
    },
  },
  {
    id: "10", number: "11", title: "Context Compact", subtitle: "Claude가 느려졌다",
    motto: "컨텍스트는 반드시 찬다. 공간을 만드는 방법이 필요하다",
    layer: "context", layerLabel: "Context", act: "act3",
    difficulty: "중급", time: "60분", prerequisites: ["01", "06", "05"],
    file: "07-context-compact.md",
    recallQuestions: ["/compact가 해결하는 핵심 문제는?", "3층 압축 전략이란?", "컨텍스트가 꽉 차면?"],
    en: {
      subtitle: "Claude Slowed Down",
      motto: "Context always fills up. You need a way to make space.",
      layerLabel: "Context",
      recallQuestions: ["What core problem does /compact solve?", "What is the 3-layer compression strategy?", "What happens when the context window is full?"],
    },
  },
  {
    id: "11", number: "12", title: "Agent Teams", subtitle: "금요일 데모까지 3일",
    motto: "혼자서 감당할 수 없으면, 팀원에게 위임하라",
    layer: "context", layerLabel: "Context", act: "act3",
    difficulty: "고급", time: "90분", prerequisites: ["06", "05", "07"],
    file: "10-agent-teams.md",
    recallQuestions: ["Agent Teams가 해결하는 핵심 문제는?", "Subagent와 Teammate의 차이는?", "단일 에이전트로 대형 프로젝트를 하면?"],
    en: {
      subtitle: "3 Days Until the Friday Demo",
      motto: "When you can't handle it alone, delegate to teammates.",
      layerLabel: "Context",
      recallQuestions: ["What core problem do Agent Teams solve?", "What's the difference between a Subagent and a Teammate?", "What happens when you use a single agent for a large project?"],
    },
  },
  {
    id: "12", number: "13", title: "Worktree Isolation", subtitle: "내 코드가 사라졌다",
    motto: "각자의 방에서 일하면 충돌은 없다",
    layer: "context", layerLabel: "Context + Permissions", act: "act3",
    difficulty: "고급", time: "75분", prerequisites: ["11", "05"],
    file: "11-worktree-isolation.md",
    recallQuestions: ["Worktree Isolation이 해결하는 핵심 문제는?", "격리의 3계층은?", "파일 격리 없이 팀 에이전트를 쓰면?"],
    en: {
      subtitle: "My Code Disappeared",
      motto: "Work in separate rooms and there are no conflicts.",
      layerLabel: "Context + Permissions",
      recallQuestions: ["What core problem does Worktree Isolation solve?", "What are the 3 layers of isolation?", "What happens when team agents work without file isolation?"],
    },
  },
  {
    id: "13", number: "14", title: "MEMORY.md", subtitle: "드디어 경력사원이네",
    motto: "에이전트는 매번 처음부터가 아니라, 점점 똑똑해져야 한다",
    layer: "knowledge", layerLabel: "Knowledge", act: "act3",
    difficulty: "중급", time: "60분", prerequisites: ["02", "08"],
    file: "12-agent-memory.md",
    recallQuestions: ["Agent Memory가 해결하는 핵심 문제는?", "CLAUDE.md vs MEMORY.md의 차이는?", "Memory 없이 세션을 넘기면?"],
    en: {
      subtitle: "Finally, a Senior Employee",
      motto: "An agent shouldn't start from scratch every time — it should keep getting smarter.",
      layerLabel: "Knowledge",
      recallQuestions: ["What core problem does Agent Memory solve?", "What's the difference between CLAUDE.md and MEMORY.md?", "What happens when you cross sessions without Memory?"],
    },
  },
  {
    id: "14", number: "10", title: "Security", subtitle: "현우가 옳았다 (일부분)",
    motto: "신뢰할 수 없는 것은 연결하지 않는다",
    layer: "permissions", layerLabel: "Permissions", act: "act2",
    difficulty: "중급", time: "60분", prerequisites: ["03", "09"],
    file: "13-security.md",
    recallQuestions: ["프롬프트 인젝션이란?", "MCP 보안에서 가장 중요한 원칙은?", "시크릿 보호를 자동화하는 방법은?"],
    en: {
      subtitle: "Hyunwoo Was Right (Partly)",
      motto: "If you can't trust it, don't connect it.",
      layerLabel: "Permissions",
      recallQuestions: ["What is prompt injection?", "What's the most important principle in MCP security?", "How do you automate secret protection?"],
    },
  },
  {
    id: "15", number: "15", title: "Token Economics", subtitle: "청구서가 왔다",
    motto: "무한한 지능, 유한한 예산",
    layer: "context", layerLabel: "Context", act: "act3",
    difficulty: "중급", time: "45분", prerequisites: ["06", "10", "11"],
    file: "14-token-economics.md",
    recallQuestions: ["Opus/Sonnet/Haiku의 적절한 사용 시점은?", "입력 토큰을 줄이는 5가지 전략은?", "효율적인 Harness = 저렴한 Harness인 이유는?"],
    en: {
      subtitle: "The Bill Arrived",
      motto: "Infinite intelligence, finite budget.",
      layerLabel: "Context",
      recallQuestions: ["When should you use Opus vs Sonnet vs Haiku?", "What are the 5 strategies for reducing input tokens?", "Why does an efficient Harness equal a cheaper Harness?"],
    },
  },
  {
    id: "16", number: "에필로그", title: "Harness Engineer", subtitle: "전체 그림",
    motto: "모델이 곧 에이전트다. 코드는 Harness다.",
    layer: "foundation", layerLabel: "에필로그", act: "act3",
    difficulty: "입문", time: "15분", prerequisites: [],
    file: "15-epilogue.md",
    recallQuestions: ["Harness의 4개 레이어 각각의 역할은?", "16개 메커니즘을 관통하는 하나의 원칙은?", "Harness Engineer란?"],
    en: {
      subtitle: "The Full Picture",
      motto: "The Model IS the Agent. The Code IS the Harness.",
      layerLabel: "Epilogue",
      recallQuestions: ["What is the role of each of the 4 Harness layers?", "What is the single principle that runs through all 16 mechanisms?", "What is a Harness Engineer?"],
    },
  },
];

export function getUnit(id: string): UnitMeta | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getUnitIndex(id: string): number {
  return LEARNING_ORDER.indexOf(id);
}

export function getNextUnit(id: string): UnitMeta | undefined {
  const idx = getUnitIndex(id);
  if (idx < 0 || idx >= LEARNING_ORDER.length - 1) return undefined;
  return getUnit(LEARNING_ORDER[idx + 1]);
}

export function getPrevUnit(id: string): UnitMeta | undefined {
  const idx = getUnitIndex(id);
  if (idx <= 0) return undefined;
  return getUnit(LEARNING_ORDER[idx - 1]);
}
