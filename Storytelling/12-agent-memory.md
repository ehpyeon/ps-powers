# Agent Memory — 드디어 경력사원이네

> **이전 이야기에서**: Worktree Isolation으로 팀 에이전트의 파일 충돌이 해결됐다.
> 각 에이전트가 자기 방에서 일하고, 완료 후 머지한다.
> 제품이 론칭됐다. 소연이 투자자 데모에서 성공. 현우가 "인정한다."
> 그런데 유지보수 첫 주, 기묘한 데자뷔가 시작됐다...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> Agent Memory는 **에이전트가 스스로 Knowledge를 작성하고 축적**한다.
> *"The agent should get smarter, not restart from zero each session"*

---

## "또 신입사원이야"

제품이 론칭됐다. 소연의 데모는 성공적이었다.

지민은 유지보수 모드에 들어갔다. 새 세션을 열고 버그를 수정하려 했다.

```
지민: 사용자 로그인 후 세션 유지가 안 되는 버그 수정해줘
Claude: 네, 먼저 프로젝트를 파악할게요...
        어떤 패키지 매니저를 사용하나요?
```

지민은 멈췄다. **지난주 론칭 스프린트 동안 매일 함께 일한 Claude가 물었다.**

"어떤 패키지 매니저를 사용하나요?"

```
지난주 화요일: "pnpm 써" → 학습 ✅
지난주 수요일: pnpm 정상 사용 ✅
지난주 목요일: pnpm 정상 사용 ✅
이번주 월요일: "어떤 패키지 매니저를 사용하나요?" ← ?!
```

세션이 바뀌면서 모든 것을 잊었다. 지민이 중얼거렸다.

*"또 신입사원이야."*

Ch00에서 처음 Claude를 만났을 때 한 말이었다. 그 뒤로 CLAUDE.md(Ch01)를 만들고, Skills(Ch03)를 만들고, Rules(Ch05)를 만들었다. 하지만 이것들은 **사람이 사전에 알고 있는 지식**을 명시적으로 작성한 것이다.

지금 지민이 원하는 건 다르다. Claude가 **스스로 일하면서 발견한 것**을 기억하게 하고 싶다.

"pnpm을 쓴다"는 것은 지민이 미리 CLAUDE.md에 쓸 수 있다. 하지만 "N+1 쿼리 문제가 이 프로젝트에서 3번 발생했다"는 건 Claude가 코드 리뷰를 하면서 발견한 패턴이다. 이런 **운영 지식**은 사람이 사전에 작성할 수 없다.

---

## 해결책: 에이전트 전용 MEMORY.md

지민의 질문은 단순했다: "Claude가 세션 사이에 기억을 유지할 수 없을까?"

모든 레이어가 갖춰졌다. Task System, Background Tasks, Agent Teams, Worktree Isolation.

그런데 하나의 근본적인 문제가 남아 있었다:

```
세션 1 (월요일):
나: 패키지 설치해줘
Claude: npm install [실패]
나: 이 프로젝트는 pnpm 써야 해
Claude: 아, pnpm install [성공] → 이제 알겠다

세션 2 (화요일):
나: 새 패키지 추가해줘
Claude: npm install [실패]
나: ...
```

```
세션 1 (지난 주):
나: DB 마이그레이션 실행해줘
Claude: prisma migrate deploy 실행... [성공]
나: 잠깐, 그건 프로덕션 명령이야! 개발 환경에서는 prisma migrate dev 써
Claude: 죄송합니다, 알겠습니다.

세션 2 (이번 주):
Claude: prisma migrate deploy 실행... [성공]
나: 또!?
```

**에이전트의 Context는 세션이 끝나면 소멸한다.** 아무리 많이 가르쳐도 다음 세션에서 다시 가르쳐야 한다.

이건 CLAUDE.md나 Rules로 해결할 수 없다. CLAUDE.md는 사람이 미리 알아야 쓸 수 있다. 하지만 "이 프로젝트는 pnpm을 쓴다"는 걸 사전에 CLAUDE.md에 써놓기 어렵다. **에이전트가 일하면서 발견하는 것들**이기 때문이다.

---

## 해결책: 에이전트 전용 MEMORY.md

2026년 초, Claude Code에 Agent Memory 시스템이 추가됐다.

핵심 아이디어: **에이전트가 학습한 것을 파일에 기록하고, 다음 세션에서 자동으로 읽는다.**

각 에이전트는 자신의 `MEMORY.md` 파일을 갖는다. 세션이 시작되면 이 파일의 첫 200줄이 자동으로 시스템 프롬프트에 주입된다.

```
세션 시작 시 (자동):

~/.claude/MEMORY.md → 시스템 프롬프트에 주입
.claude/MEMORY.md   → 시스템 프롬프트에 주입
.claude-local/MEMORY.md → 시스템 프롬프트에 주입

에이전트가 활동 중:
발견 → 기록 → .claude/MEMORY.md 업데이트

다음 세션:
이 내용이 다시 자동 주입 → 에이전트가 기억한다
```

---

<!-- section:workshop -->
## 세 가지 메모리 스코프

메모리는 세 가지 범위로 나뉜다. CSS의 specificity처럼, 더 구체적인 스코프가 우선한다:

```
~/.claude/MEMORY.md          [User 스코프]
  적용 범위: 모든 프로젝트
  공유 여부: 개인 (git에 올라가지 않음)
  예시 내용:
    - "나는 TypeScript를 선호한다"
    - "작업 완료 시 항상 한국어로 요약해줘"
    - "절대 --no-verify 사용하지 마"

.claude/MEMORY.md            [Project 스코프]
  적용 범위: 이 프로젝트
  공유 여부: 팀 공유 (git에 커밋)
  예시 내용:
    - "이 프로젝트는 pnpm 사용 (npm 사용 금지)"
    - "DB 마이그레이션: 개발=prisma migrate dev, 프로덕션=별도 승인 필요"
    - "테스트는 항상 vitest 사용, jest 사용하지 말 것"

.claude-local/MEMORY.md      [Local 스코프]
  적용 범위: 이 프로젝트의 내 로컬 환경
  공유 여부: 개인 (gitignore에 포함)
  예시 내용:
    - "내 로컬 DB URL: postgresql://localhost:5432/dev_db"
    - "내 개발 환경 포트: 3001 (다른 서비스가 3000 사용)"
    - "내 로컬 환경에서는 Docker 대신 직접 서비스 실행"
```

**스코프 우선순위**: local > project > user

같은 설정이 여러 스코프에 있으면 더 구체적인 스코프가 이긴다.

---

## 자동 주입 메커니즘: 왜 200줄인가

첫 200줄만 자동 주입되는 이유가 있다.

```
시스템 프롬프트 비용:
  MEMORY.md 200줄 ≈ ~2,000 토큰
  매 대화마다 소비되는 토큰

200줄을 넘으면:
  → 주제별 파일로 분리
  → MEMORY.md에서 참조

예시:
  # MEMORY.md (200줄 이내로 유지)
  ## 핵심 사항
  - pnpm 사용 (npm 금지)
  - 자세한 패키지 관리: memory/package-management.md
  - DB 마이그레이션 규칙: memory/database-rules.md
  - API 패턴: memory/api-conventions.md
```

200줄 = "항상 필요한 핵심 지식"만 시스템 프롬프트에 넣고, 나머지는 필요할 때 참조한다. Context 비용을 최소화하면서도 필수 지식을 항상 유지하는 균형점이다.

---

## Memory Curation Lifecycle: 기억 관리하기

MEMORY.md는 한 번 작성하면 끝이 아니다. 살아있는 문서처럼 관리해야 한다:

```
발견 단계:
  에이전트가 일하다가 새로운 패턴을 학습
  "이 프로젝트에서 React Query를 사용한다"
  "Zod로 스키마 검증을 한다"

기록 단계:
  MEMORY.md에 추가
  - 에이전트가 자율적으로 기록
  - 또는 사용자가 "/remember pnpm 사용" 같은 명령으로

검증 단계:
  주기적으로 MEMORY.md 검토
  "이 내용이 여전히 사실인가?"
  "더 이상 유효하지 않은 내용은?"

정리 단계:
  오래된 내용 제거
  의존성 버전이 바뀐 내용 업데이트
  모순되는 내용 해결

아카이브 단계:
  더 이상 현재 맥락에 직접 필요하지 않지만
  참고가 될 수 있는 내용은 memory/archive/로 이동
```

---

## MEMORY.md vs CLAUDE.md vs Rules — 무엇이 다른가

이 세 가지를 혼동하기 쉽다. 차이를 명확히:

```
CLAUDE.md (항상 활성화된 프로젝트 정보):
  내용: 프로젝트가 무엇인지 (비교적 불변)
  작성자: 사람 (개발자, 팀)
  갱신: 드물게 (프로젝트 구조 변경 시)
  예시: "Next.js 14 + TypeScript + Tailwind CSS 프로젝트"

Rules (.claude/rules/*.md, 맥락 기반 선택):
  내용: 어떻게 작업하는지 (워크플로우 규칙)
  작성자: 사람 (팀 결정)
  갱신: 팀 정책 변경 시
  예시: "테스트 커버리지 80% 이상 필수"

MEMORY.md (에이전트가 학습한 운영 지식):
  내용: 에이전트가 경험으로 발견한 것들
  작성자: 에이전트 (자율적으로)
  갱신: 에이전트가 새 패턴을 발견할 때마다
  예시: "pnpm 사용 (npm install 실패 경험 기반)"
```

**핵심 차이**: CLAUDE.md와 Rules는 사람이 사전에 알고 있는 지식을 명시적으로 작성한다. MEMORY.md는 에이전트가 실제 작업 중에 발견한 지식을 자동으로 축적한다.

---

## Auto-Memory: 자동 학습 메커니즘

MEMORY.md에 기록하는 두 가지 방식이 있다:

```
수동 기록:
  사용자: "/remember 이 프로젝트는 pnpm 사용"
  → Claude가 MEMORY.md에 명시적으로 추가

자동 학습 (Auto-Memory):
  Claude가 작업 중 발견한 패턴을 스스로 기록
  → 빌드 명령어, 프로젝트 구조, 디버깅 인사이트
  → 사용자가 지시하지 않아도 학습
```

Auto-Memory는 Claude가 작업하면서 자동으로 운영 지식을 축적하는 메커니즘이다:

```
세션 1:
  Claude: npm install [실패]
  Claude: pnpm install [성공]
  → Auto-Memory: "이 프로젝트는 pnpm 사용"

세션 2:
  Claude: (MEMORY.md에서 pnpm 사용 확인)
  Claude: pnpm install [바로 성공]
```

**구체적으로, Claude는 언제 자동으로 기록하나?**

```
자동 기록이 발생하는 순간들:
  빌드/테스트 실패 후 올바른 방법을 발견했을 때
    → "npm install 실패 → pnpm install 성공" 패턴 기록

  사용자가 명시적으로 수정해준 패턴
    → "여기선 pnpm 써" → 기록

  반복적으로 같은 파일/패턴을 참조하게 될 때
    → "src/lib/result.ts의 Ok/Err 패턴" → 기록

  프로젝트 특유의 빌드/실행 방법을 발견했을 때
    → "이 프로젝트는 turbo dev, not npm run dev" → 기록
```

**Auto-Memory는 항상 정확하진 않다.** 한 번의 성공이 항상 올바른 패턴을 의미하진 않는다.
그래서 Memory Curation Lifecycle의 "검증 단계"가 중요하다 — 주기적으로 MEMORY.md를 리뷰하고 잘못된 기억을 수정해야 한다.

대부분의 운영 지식은 Auto-Memory로 축적된다. 사용자가 일일이 "/remember"하지 않아도, Claude는 실패와 성공 패턴을 스스로 기록한다. 이것이 세션을 거듭할수록 Claude가 더 나아지는 이유다.

---

## 과거 대화 검색: 잃어버린 기억 찾기

MEMORY.md는 큐레이션된 기억이다. 하지만 때로는 과거 대화 자체를 검색하고 싶다.
"지난주에 인증 관련 뭘 논의했지?"

```bash
# 키워드로 과거 대화 파일 찾기
grep -l -i "인증" ~/.claude/projects/*/*.jsonl

# 특정 대화에서 사용자 메시지만 추출
jq -r 'select(.type=="user") | .content' conversation.jsonl
```

기억의 3계층:
```
원본 대화 (.jsonl 파일):
  전체 기록, grep으로 검색 가능
  → "고고학적 발굴" — 모든 것이 있지만 정리 안 됨

MEMORY.md:
  에이전트가 큐레이션한 핵심 지식
  → "도서관" — 정리되고 분류됨

CLAUDE.md:
  항상 활성화된 프로젝트 정보
  → "명찰" — 가장 중요한 것만
```

---

## 실제 Agent Memory 사용 예시

### code-reviewer의 학습

```markdown
# .claude/agent-memory/code-reviewer/MEMORY.md

## 이 프로젝트의 패턴들

### 에러 처리
- Result 타입 사용 (try-catch 대신)
- `src/lib/result.ts`의 Ok/Err 함수 사용
- 예시: `return Err("User not found")` (throw 사용 금지)

### 데이터베이스
- Drizzle ORM 사용 (Prisma가 아님)
- 쿼리는 항상 `db.query.*` 패턴
- N+1 문제 발견 횟수: 3회 (반복되는 문제)

### 인증
- JWT가 아닌 세션 기반 (next-auth)
- 보호된 라우트: `withAuth` HOC 사용 필수
```

다음 세션에서 code-reviewer는 이미 이 패턴들을 알고 있다. 처음 코드베이스를 탐색하는 시간이 사라진다.

---

#### 🔨 지금 해보세요

1. Claude Code에서 "이 프로젝트는 pnpm을 쓴다고 기억해"라고 말한다
2. 세션을 종료하고 새 세션을 연다
3. "패키지 매니저가 뭐야?"라고 물어본다
4. Claude가 pnpm을 기억하는지 확인한다

#### ✅ 이 유닛 후 할 수 있는 것

- [ ] Claude에게 운영 지식을 기억시키기
- [ ] CLAUDE.md(사전 지식)와 MEMORY.md(학습된 지식)의 차이를 설명
- [ ] 에이전트 메모리가 없을 때 발생하는 "매일 같은 설명" 문제를 해결

> **❌ Anti-pattern:** MEMORY.md에 보장(guarantee)을 넣지 마라. "항상 pnpm을 써라"는 CLAUDE.md나 Rules에 넣어야 한다. MEMORY.md는 학습된 **운영 지식**용이다 — 보장이 아닌 관찰.

<!-- section:reflection -->
## Harness 관점: Knowledge 레이어의 완성

```
Knowledge 레이어의 진화:

1단계: CLAUDE.md (01-CLAUDE-md.md)
  정적 지식 — 사람이 사전에 작성
  "이 프로젝트는 Next.js 14야"

2단계: Skills (03-skills.md)
  On-demand 지식 — 필요할 때 로드
  "/commit 실행 시 → 커밋 형식 규칙 로드"

3단계: Rules (05-rules.md)
  맥락 기반 지식 — 상황에 따라 선택
  "TypeScript 파일 수정 시 → TS 규칙 로드"

4단계: MEMORY.md (Agent Memory)
  동적 지식 — 에이전트가 스스로 축적
  "pnpm 사용" (직접 경험으로 발견)

이제 에이전트는 시간이 지날수록 더 잘 안다.
프로젝트 첫 날과 6개월 후의 에이전트는 다르다.
```

---

## 이야기의 완성: 2022년부터 지금까지

2022년, Claude는 텍스트를 입력받고 텍스트를 반환하는 함수였다.

2023년, Tool Use API가 추가됐다. Claude가 도구를 요청하고 결과를 보고 다음 판단을 내릴 수 있게 됐다. **Agent Loop가 탄생했다.**

그 이후, Harness가 하나씩 구축됐다:

```
Tools 레이어:
  Agent Loop      ← 세상과 연결
  Background Tasks ← I/O 병렬화
  MCPs            ← 외부 서비스 연결

Knowledge 레이어:
  CLAUDE.md       ← 프로젝트 기억 주입
  Skills          ← On-demand 전문 지식
  Rules           ← 맥락 기반 규칙
  MEMORY.md       ← 에이전트의 경험 축적

Context 레이어:
  TodoWrite       ← 세션 내 계획 관리
  Task System     ← 영속적 작업 그래프
  Agents          ← 격리된 전문 에이전트
  Agent Teams     ← 수평적 팀 협력
  /compact        ← 메모리 압축으로 무한 세션

Permissions 레이어:
  Hooks           ← 행동 전/후 개입
  Worktree        ← 파일시스템 격리
  settings.json   ← 허용/차단 설정
```

**하나의 패턴이 관통한다**: 각 기능은 이전 기능이 드러낸 한계를 해결하기 위해 탄생했다. 그리고 해결하면서 새로운 한계를 드러낸다.

이 패턴은 앞으로도 계속될 것이다.
새로운 문제가 생기면 → 새로운 Harness 레이어가 추가된다.

---

## 에필로그: 지민의 변화

4주 전, 지민은 Claude Code를 설치하며 생각했다.
"AI 코딩 도구를 쓰면 빨라진다고 했잖아."

4주 후, 지민의 `.claude/` 디렉토리:

```
.claude/
  settings.json         ← 23개 훅, Permission Modes
  rules/                ← 7개 주제별 규칙 파일
  skills/               ← /commit, /deploy, /review
  agents/               ← planner, code-reviewer, security-reviewer
  MEMORY.md             ← 에이전트가 학습한 운영 지식
```

지민은 더 이상 "Claude Code 사용자"가 아니었다. **Harness Engineer**였다.

Claude가 느려지면 "컨텍스트가 찼구나" → `/compact`.
Claude가 실수하면 "Knowledge가 부족하구나" → Rule 추가.
Claude가 위험한 일을 하면 "Permissions가 없구나" → Hook 추가.
혼자 감당 안 되면 → Agent Teams + Worktree.
Claude가 같은 실수를 반복하면 → "Memory를 확인해봐."

현우가 옆에서 물었다. "AI 쓰는 거 진짜 효과 있어?"

지민은 웃었다.

"Claude가 똑똑한 게 아니야. **환경을 잘 만드는 게 중요해.**"

그리고 새 세션을 열었다. Claude가 인사했다.

```
Claude: 안녕하세요, 지민. pnpm 프로젝트 맞죠?
        지난주 N+1 쿼리 문제 수정한 거 기억하고 있어요.
        오늘은 뭘 도와드릴까요?
```

*"드디어 경력사원이네."*

지금 이 순간에도 Harness는 진화하고 있다.

---

> *"You are not writing the intelligence. You are building the world the intelligence inhabits."*
> — Harness Engineering

하지만 론칭 전 마지막 스퍼트에서 지민은 Agent Teams를 돌렸다. backend-agent, frontend-agent, qa-agent — 모두 Opus로.

다음 날 아침, 비용 대시보드를 열었다.

*"...이 청구서가 맞아?"*

→ **[Ch15. Token Economics — 청구서가 왔다](./14-token-economics.md)**
