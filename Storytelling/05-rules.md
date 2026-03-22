# Rules — CLAUDE.md를 해체하다

> **이전 이야기에서**: 지민은 Background Tasks로 빌드와 코딩을 동시에 처리하게 됐다.
> 프로젝트가 빠르게 성장했다. 파일 50개에서 100개로.
> 그리고 CLAUDE.md도 함께 자라고 있었다...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> Rules는 **비대해진 Knowledge를 주제별로 해체**한다.
> *"불필요한 Knowledge로 Context를 오염시키지 않는다"*

---

## 탄생 배경: "350줄 괴물"

CLAUDE.md는 완벽한 해결책처럼 보였다.
프로젝트 규칙을 한 곳에 모아서 Claude에게 주입.

3개월이 지나자 지민은 CLAUDE.md를 열어보고 당황했다:

```markdown
# My Project

## About This Project (10줄)
## Tech Stack (15줄)
## Coding Style
  - 불변성 규칙 (8줄)
  - 파일 크기 제한 (5줄)
  - 에러 핸들링 (10줄)
  - 네이밍 컨벤션 (12줄)
## Testing Standards
  - TDD 규칙 (15줄)
  - 커버리지 기준 (8줄)
  - E2E 테스트 (10줄)
## Security Guidelines
  - 시크릿 관리 (10줄)
  - 입력 검증 (8줄)
  - OWASP 체크리스트 (20줄)
## Git Workflow
  - 커밋 형식 (10줄)
  - PR 프로세스 (15줄)
  - 브랜치 전략 (12줄)
## Agent Orchestration
  - 언제 planner를 쓸지 (10줄)
  - 언제 code-reviewer를 쓸지 (8줄)
## Performance
  - 모델 선택 기준 (10줄)
  - 컨텍스트 관리 (8줄)
...
```

**총 350줄.** 이런 CLAUDE.md가 도처에 퍼졌다.

문제가 여러 개였다:

**문제 1: 찾기 힘들다**
"보안 규칙이 어디 있었지?" → Ctrl+F로 찾아야 함

**문제 2: 유지보수가 힘들다**
보안 규칙만 업데이트하려 해도 350줄 파일을 열어야 함

**문제 3: 컨텍스트 낭비**
`planner`는 보안 규칙이 필요 없다. 근데 전부 읽는다.
Claude의 컨텍스트 윈도우를 불필요한 정보로 채운다.

**문제 4: 언어/프레임워크별 차이**
TypeScript 프로젝트와 Python 프로젝트는 규칙이 다른데,
한 파일에 다 넣으면 충돌이 생긴다.

*"규칙을 주제별로 나누고, Claude가 필요한 것만 읽게 하면 어떨까?"*

---

## 해결책의 탄생: "규칙 파일을 분리하자"

Harness Knowledge 레이어를 다시 보면:

```
Knowledge 레이어의 진화:
  1단계: CLAUDE.md — 항상 활성화 (무조건 읽힘)
  2단계: Skills    — 명시적 요청 시 활성화 (/commit 같은 명령)
  3단계: Rules     — 맥락 기반 활성화 (Claude가 필요하다고 판단할 때)
```

`.claude/rules/` 폴더에 파일을 나눠서 넣으면,
Claude가 **맥락에 따라 필요한 파일만 선택적으로 로드**한다.

```
.claude/rules/
  coding-style.md       ← 불변성, 파일 크기, 네이밍
  testing.md            ← TDD, 커버리지 기준
  security.md           ← 시크릿 관리, OWASP 체크
  git-workflow.md       ← 커밋 형식, PR 프로세스
  agents.md             ← 에이전트 오케스트레이션 규칙
  development-workflow.md ← 전체 개발 프로세스
  performance.md        ← 모델 선택, 컨텍스트 관리
```

이제 CLAUDE.md는 가볍다:

```markdown
# My Project
Next.js + TypeScript 프로젝트.
규칙은 .claude/rules/ 참조.
```

---

<!-- section:workshop -->
## Rules 로딩 메커니즘: 어떻게 "맥락 기반 선택"이 작동하나

Rules 파일은 두 가지 방식으로 로드된다.

### 방식 1: 자동 로딩 (glob 패턴)

`CLAUDE.md`에 glob 패턴을 적으면, 해당 패턴과 일치하는 파일들이 자동으로 로드된다:

```markdown
# CLAUDE.md

<claude_config>
  <rules>
    <!-- 항상 로드 -->
    <rule glob=".claude/rules/coding-style.md" />
    <!-- TypeScript 파일 작업 시 로드 -->
    <rule glob=".claude/rules/typescript/**/*.md" when="*.ts,*.tsx" />
    <!-- 테스트 파일 작업 시 로드 -->
    <rule glob=".claude/rules/testing.md" when="*.test.*,*.spec.*" />
  </rules>
</claude_config>
```

### 방식 2: 암묵적 로딩 (Claude의 판단)

`.claude/rules/`에 있는 파일들의 **파일명**을 보고 Claude가 스스로 판단한다:

```
Claude가 코드 작성 중:
  → "coding-style.md 가 있다. 읽어야겠다."
  → "security.md 도 관련 있을 것 같다."

Claude가 커밋 준비 중:
  → "git-workflow.md 가 필요하다."

Claude가 에이전트 실행 전:
  → "agents.md 를 확인해야겠다."
```

**파일명이 곧 메타데이터다.** 잘 지은 파일명이 Claude의 판단을 도운다.

잘못된 예: `rules1.md`, `misc-rules.md`, `stuff.md`
올바른 예: `coding-style.md`, `security.md`, `git-workflow.md`

---

## Rules가 해결한 것들

### 선택적 로딩
코드 작성 중 → `coding-style.md` + `security.md` 로드
커밋 준비 중 → `git-workflow.md` 로드
계획 수립 중 → `development-workflow.md` + `agents.md` 로드

Claude가 "지금 뭘 하는지"를 보고 관련 규칙만 읽는다.
불필요한 컨텍스트 소비가 사라진다.

### 독립적 유지보수
보안 팀이 `security.md`를 업데이트해도 다른 파일에 영향 없음.
테스트 기준을 바꾸려면 `testing.md`만 열면 된다.

### 언어별 레이어링
더 정교한 구조도 가능하다:

```
.claude/rules/
  common/
    coding-style.md     ← 모든 언어에 공통
    security.md
  typescript/
    coding-style.md     ← TypeScript 특화 규칙 (공통 오버라이드)
  python/
    coding-style.md     ← Python 특화 규칙
```

TypeScript 프로젝트 → `common/coding-style.md` + `typescript/coding-style.md`
Python 프로젝트 → `common/coding-style.md` + `python/coding-style.md`

CSS의 특이성(specificity)처럼, 더 구체적인 규칙이 이긴다.

---

## Rules vs CLAUDE.md: 언제 뭘 쓸까?

| | CLAUDE.md | Rules |
|--|----------|-------|
| **목적** | 프로젝트 개요, 핵심 컨텍스트 | 규칙과 가이드라인 |
| **내용** | 스택, 목적, 핵심 제약 | 코딩 스타일, 워크플로우, 보안 |
| **길이** | 짧게 유지 (핵심만) | 주제별로 상세하게 |
| **수정 빈도** | 드물게 | 필요할 때마다 |

**CLAUDE.md**: "이 프로젝트가 뭔지"
**Rules**: "이 프로젝트에서 어떻게 일하는지"

---

## 실전 예시: Rules 파일 구성

```
.claude/rules/
  coding-style.md        불변성, 파일 크기, 에러 핸들링
  agents.md              언제 어떤 에이전트를 쓸지
  development-workflow.md 리서치→계획→TDD→리뷰→커밋
  git-workflow.md         컨벤셔널 커밋, PR 프로세스
  testing.md             TDD, 80% 커버리지
  security.md            시크릿 관리, 즉시 플래그 패턴
  performance.md         모델 선택, 컨텍스트 윈도우 관리
```

실제 파일 내용을 보면 구조가 명확해진다:

### `coding-style.md` (발췌)

```markdown
# 코딩 스타일

## 불변성 (CRITICAL)

기존 객체를 절대 변경하지 말고, 항상 새 객체를 만들어서 반환:

// 잘못된 방식: 원본 변경
user.name = newName

// 올바른 방식: 새 복사본 반환
return { ...user, name: newName }

## 파일 구성

작은 파일 여럿 > 큰 파일 하나:
- 일반적으로 200-400줄, 최대 800줄
- 타입 기준이 아닌 기능/도메인 기준으로 구성

## 완료 체크리스트

작업 완료 전 확인:
- [ ] 함수가 작음 (50줄 미만)
- [ ] 깊은 중첩 없음 (4레벨 초과 금지)
- [ ] 변경(mutation) 없음
```

### `security.md` (발췌)

```markdown
# 보안 가이드라인

## 즉시 플래그할 패턴

| 패턴 | 심각도 | 수정 방법 |
|------|--------|----------|
| 하드코딩된 시크릿 | CRITICAL | 환경변수로 이동 |
| 사용자 입력으로 셸 명령 실행 | CRITICAL | 안전한 API 사용 |
| 문자열 연결 SQL 쿼리 | CRITICAL | 파라미터화된 쿼리 |
| innerHTML에 사용자 입력 | HIGH | textContent 또는 DOMPurify |

## 보안 이슈 발견 시 대응

1. 즉시 중단
2. **security-reviewer** 에이전트 사용
3. CRITICAL 이슈 먼저 수정 후 계속 진행
```

### `git-workflow.md` (발췌)

```markdown
# Git 워크플로우

## 커밋 메시지 형식

<type>: <설명>

타입: feat, fix, refactor, docs, test, chore, perf, ci

예시:
- feat: 사용자 인증 기능 추가
- fix: 로그인 시 토큰 갱신 버그 수정

## 커밋 전 체크

- [ ] 하드코딩된 시크릿 없음
- [ ] console.log / print 디버그 코드 제거
```

각 파일이 하나의 주제에만 집중한다는 것을 볼 수 있다.
`coding-style.md`에 보안 규칙이 없고, `security.md`에 코딩 스타일이 없다.

---

> **💬** "대부분의 세션을 Plan 모드로 시작하라. 만족할 때까지 왔다갔다 하라. Plan 모드에서 합의한 후 구현으로 넘어가면 실수가 줄어든다." — Boris Cherny, Claude Code 창시자

<!-- section:reflection -->
## 벽 너머의 세계

Rules로 내부 Knowledge가 체계화됐다.
지민의 Claude는 코딩 스타일도 알고, 보안 규칙도 알고, 테스트 기준도 알았다.

코드베이스 안에서 Claude는 전능했다.

그런데 어느 날, 지민이 버그를 고친 후 자연스럽게 말했다.

```
지민: 이 버그 고쳤으니까 관련 GitHub 이슈 닫아줘
Claude: 저는 GitHub에 접근할 수 없어요.

지민: 작업 끝났으니 Jira 티켓 Done으로 바꿔줘
Claude: 저는 Jira에 접근할 수 없어요.

지민: 이 데이터 분석해줘 (Supabase DB)
Claude: 저는 데이터베이스에 접근할 수 없어요.
```

코드는 고쳤다. 하지만 이슈를 닫으려면 브라우저를 열어야 했다.
티켓을 바꾸려면 Jira에 로그인해야 했다.
데이터를 보려면 DB 클라이언트를 켜야 했다.

**Claude는 코드베이스라는 섬에 갇혀 있었다.** 바다 건너 GitHub, Jira, Slack, 데이터베이스가 보이지만 건너갈 수 없었다.

*"외부 서비스를 Claude의 도구로 만들 수 있는 표준화된 방법이 있다면?"*

→ **[Ch09. MCPs — 섬에서 대륙으로](./06-mcps.md)**
