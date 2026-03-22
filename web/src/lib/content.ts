import fs from "fs";
import path from "path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { createHighlighter, type Highlighter } from "shiki";
import { UNITS } from "./units";

const STORYTELLING_DIR = path.join(process.cwd(), "..", "Storytelling");
const STORYTELLING_EN_DIR = path.join(process.cwd(), "..", "Storytelling", "en");

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: ["bash", "json", "typescript", "javascript", "python", "yaml", "markdown", "toml", "shell"],
    });
  }
  return highlighterPromise;
}

async function highlightCodeBlocks(html: string): Promise<string> {
  const highlighter = await getHighlighter();

  // Match <pre><code class="language-xxx">...</code></pre> blocks
  return html.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang, code) => {
      const decoded = code
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');

      const supportedLangs = highlighter.getLoadedLanguages();
      const langMap: Record<string, string> = { sh: "bash", zsh: "bash", shell: "bash", ts: "typescript", js: "javascript", py: "python", yml: "yaml", md: "markdown" };
      const resolvedLang = langMap[lang] || lang;

      if (!supportedLangs.includes(resolvedLang)) {
        return `<pre><code class="language-${lang}">${code}</code></pre>`;
      }

      const highlighted = highlighter.codeToHtml(decoded, {
        lang: resolvedLang,
        theme: "github-dark-default",
      });
      return highlighted;
    }
  );
}

function enhanceCallouts(html: string): string {
  // 1. Typed callout blockquotes: > **💡 Tip:** → class="callout-tip"
  const calloutMap: Record<string, string> = {
    "💡 Tip:": "callout-tip",
    "⚠️ Warning:": "callout-warning",
    "❌ Anti-pattern:": "callout-anti",
    "💬": "callout-quote",
  };

  for (const [marker, cls] of Object.entries(calloutMap)) {
    // Match blockquote containing the marker in a <strong> tag
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `<blockquote>\\s*<p><strong>${escapedMarker}<\\/strong>`,
      "g"
    );
    html = html.replace(regex, `<blockquote class="${cls}">\n<p><strong>${marker}</strong>`);
  }

  // 2. Exercise blocks: <h4>🔨 지금 해보세요</h4> followed by <ol>
  html = html.replace(
    /(<h4>🔨[^<]*<\/h4>\s*<ol>[\s\S]*?<\/ol>)/g,
    '<div class="exercise-block">$1</div>'
  );

  // 3. Competency lists: <h4>✅ 이 유닛 후 할 수 있는 것</h4> followed by <ul>
  html = html.replace(
    /(<h4>✅[^<]*<\/h4>\s*<ul>[\s\S]*?<\/ul>)/g,
    '<div class="competency-list">$1</div>'
  );

  // 4. Cross-unit references: → ChXX or → Ch에필로그
  html = html.replace(
    /→\s*(Ch\d{2}|Ch에필로그)\s*(참고|참조)?/g,
    '<span class="cross-ref">→ $1 $2</span>'
  );

  // 5. Convert markdown file links to web routes: ./06-mcps.md → /units/{id}
  const fileToId = new Map(UNITS.map((u) => [u.file, u.id]));
  html = html.replace(
    /href="\.\/([^"]+\.md)"/g,
    (_match, file) => {
      const unitId = fileToId.get(file);
      if (unitId) return `href="/units/${unitId}"`;
      return _match;
    }
  );

  return html;
}

export async function getUnitContent(filename: string, locale: "ko" | "en" = "ko"): Promise<string> {
  const dir = locale === "en" ? STORYTELLING_EN_DIR : STORYTELLING_DIR;
  const filePath = path.join(dir, filename);

  // Fall back to Korean if English file doesn't exist
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    if (locale === "en") {
      const koPath = path.join(STORYTELLING_DIR, filename);
      raw = fs.readFileSync(koPath, "utf-8");
    } else {
      throw new Error(`Content file not found: ${filePath}`);
    }
  }

  // sanitize: false — intentional. Storytelling .md files are first-party content
  // checked into the repo. Raw HTML is needed for styled callout blocks.
  const result = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(raw);
  let html = result.toString();
  html = await highlightCodeBlocks(html);
  html = enhanceCallouts(html);
  return html;
}

// English Workshop keywords
const WORKSHOP_KEYWORDS_EN = [
  "How to Use", "How It Works", "Hands-On", "In Practice", "Workshop",
  "Implementation", "Building", "Setting Up", "Configuration", "The Mechanism",
  "Practical", "Connecting", "The Three", "The Two", "Strategies",
  "TodoWrite:", "Task System:", "BackgroundManager", "Autonomous Loop",
  "Message Bus", "Teammate Lifecycle", "Team Protocols", "Autonomous Agents",
  "Git Worktree", "Control Plane", "Task-Worktree", "Event Stream",
  "Three Memory Types", "Auto Injection", "Memory Curation", "Auto-Memory",
  "Permission Modes", "The Hooks", "Prompt Injection", "MCP Security",
  "Secret Management", "Attack Vectors", "Model Routing", "Cost Optimization",
  "Token Economics", "Haiku", "Sonnet", "Opus", "9 Skill Categories",
  "Agent vs Command", "Verification Loop", "tmux",
];

// English Reflection keywords
const REFLECTION_KEYWORDS_EN = [
  "Looking Back", "Summary", "The Big Picture", "What Changed", "Harness View",
  "The Story So Far", "The Full Story", "Quick Reference", "Reflection",
  "Wrapping Up", "CLAUDE.md vs Rules", "MEMORY.md vs CLAUDE",
  "Context View", "Harness Engineer",
];

// Workshop keywords found in actual H2 headers
const WORKSHOP_KEYWORDS = [
  "실제로", "실습", "작업장", "직접 해보",
  "두 가지 연결", "두 가지 실행", "작동 방식",
  "Claude Code에서", "구현", "실전",
  "세 가지 힘", "23개 이벤트",
  "실제 프로젝트", "실전 예시",
  "SKILL.md의 구조", "$ARGUMENTS",
  "MCP가 연 세계", "MCP의 확장", "MCP의 함정",
  "내가 만드는", "MCP 설정",
  "토큰 비용", "Layer 1", "Layer 2", "Layer 3",
  "TodoWrite:", "Task System:",
  "BackgroundManager", "Autonomous Loop",
  "Message Bus", "Teammate Lifecycle", "Team Protocols", "Autonomous Agents",
  "Git Worktree", "Control Plane", "Task-Worktree", "Event Stream",
  "세 가지 메모리", "자동 주입", "Memory Curation", "Auto-Memory",
  "과거 대화 검색", "실제 Agent Memory",
  "Permission Modes", "Hooks의 세 가지",
  "Rules 로딩", "Rules가 해결",
  "계층 구조", "콜드 스타트", "프롬프팅 5패턴", "좋은 지시의",
  "Headless", "같은 루프, 다른",
  "Preloaded Knowledge", "model. 필드",
  "HANDOFF", "대화 포킹", "세션을 넘어서",
  "Verification Loop",
  "Worktree를 넘어서",
  "tmux",
  // New units
  "프롬프트 인젝션", "MCP 보안", "시크릿 관리", "공격 벡터",
  "모델 라우팅", "비용 최적화", "토큰 경제", "Haiku", "Sonnet", "Opus",
  "9가지 스킬 카테고리", "노력 압축",
  "Agent vs Command vs Skill",
];

// Reflection keywords found in actual H2 headers
const REFLECTION_KEYWORDS = [
  "Harness 관점", "harness 관점",
  "다음 이야기", "성숙하면서 생긴 문제",
  "이야기의 완성", "전체 이야기",
  "이제 이야기가 시작", "What Changed",
  "Rules vs CLAUDE", "CLAUDE.md vs Rules",
  "MEMORY.md vs CLAUDE",
  "반복 제거",
  "Context 관점",
  "성찰", "퀵 레퍼런스",
  "돌아보며", "전체 그림", "Harness Engineer",
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function splitContentSections(html: string, locale: "ko" | "en" = "ko"): {
  campfire: string;
  workshop: string;
  reflection: string;
} {
  // Primary: use explicit markers inserted into the markdown files
  const WORKSHOP_MARKER = "<!-- section:workshop -->";
  const REFLECTION_MARKER = "<!-- section:reflection -->";

  if (html.includes(WORKSHOP_MARKER) || html.includes(REFLECTION_MARKER)) {
    const wIdx = html.indexOf(WORKSHOP_MARKER);
    const rIdx = html.indexOf(REFLECTION_MARKER);

    if (wIdx !== -1 && rIdx !== -1) {
      const campfire = html.slice(0, wIdx);
      const workshop = html.slice(wIdx + WORKSHOP_MARKER.length, rIdx);
      const reflection = html.slice(rIdx + REFLECTION_MARKER.length);
      return { campfire, workshop, reflection };
    }
    if (wIdx !== -1) {
      const campfire = html.slice(0, wIdx);
      const workshop = html.slice(wIdx + WORKSHOP_MARKER.length);
      return { campfire, workshop, reflection: "" };
    }
    if (rIdx !== -1) {
      const campfire = html.slice(0, rIdx);
      const reflection = html.slice(rIdx + REFLECTION_MARKER.length);
      return { campfire, workshop: "", reflection };
    }
  }

  // Fallback: keyword-based classification (for files without markers)
  const parts = html.split(/(?=<h2[^>]*>)/);

  const workshopKw = locale === "en"
    ? [...WORKSHOP_KEYWORDS, ...WORKSHOP_KEYWORDS_EN]
    : WORKSHOP_KEYWORDS;
  const reflectionKw = locale === "en"
    ? [...REFLECTION_KEYWORDS, ...REFLECTION_KEYWORDS_EN]
    : REFLECTION_KEYWORDS;

  let campfire = "";
  let workshop = "";
  let reflection = "";

  for (const part of parts) {
    const h2Match = part.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    const headerText = h2Match ? h2Match[1].replace(/<[^>]*>/g, "") : "";

    if (matchesKeywords(headerText, reflectionKw)) {
      reflection += part;
    } else if (matchesKeywords(headerText, workshopKw)) {
      workshop += part;
    } else if (h2Match) {
      campfire += part;
    } else {
      campfire += part;
    }
  }

  return { campfire, workshop, reflection };
}
