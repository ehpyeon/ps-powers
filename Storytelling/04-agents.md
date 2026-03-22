# Agents — 격리된 전문 에이전트

> **이전 이야기에서**: 지민은 Task System으로 10단계 작업을 계획대로 진행할 수 있게 됐다.
> Verification Loop로 자동 검증까지. 하지만 결제 시스템 구현 중
> 코드 리뷰를 요청했더니 이상한 일이 벌어졌다...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Agents는 **Context 격리**로 노이즈 없는 집중을 가능하게 한다.
> *"Break big tasks down; each subtask gets a clean context"*

---

## 산만한 리뷰

코드 리뷰를 요청했을 뿐이었다.

그런데 Claude는 "잠깐만요, 먼저 전체 코드를 파악할게요"라며 파일 20개를 읽기 시작했다.
10분 후, Claude의 리뷰는 이상하게 산만했다.

DB 스키마 이야기를 하다가 갑자기 패키지 설치 방법을 언급했다.
방금 물어본 결제 로직의 보안 취약점에 대해서는 한 줄도 없었다.

현우가 리뷰 결과를 보더니 말했다. "AI한테 코드 리뷰를? 사람이 보는 게 낫지 않아?"

지민은 깨달았다. 현우의 말이 틀린 건 아니었다. 하지만 문제는 AI가 아니라 **환경**이었다.
Claude가 멍청해진 게 아니다.
**50,000 토큰의 잡음 속에서 리뷰를 하고 있었다.**

```python
messages = [
    "user: 결제 시스템 구현해줘",
    "[tool_result] src/api/routes.ts (500줄)",       # ← 2000 토큰
    "[tool_result] src/models/user.ts (300줄)",      # ← 1200 토큰
    "[tool_result] src/db/schema.sql (200줄)",       # ← 800 토큰
    ... (파일 탐색 20개 더)
    "assistant: 계획을 세울게요...",
    ... (구현 과정 전체)
    "user: 이제 코드 리뷰해줘"    # ← 여기서 리뷰 요청
]
# 총 컨텍스트: 50,000 토큰. 리뷰에 필요한 것: 5,000 토큰. 노이즈: 90%.
```

*"리뷰어에게 리뷰 대상만 보여줄 수 없을까? 지금까지의 탐색 과정, 계획, 잡담 없이?"*

---

## 용어 정리: Subagent vs Teammate

이 파일에서 다루는 "에이전트"는 정확히는 **Subagent**다.

```
Subagent (이 파일):
  부모가 생성 → 작업 수행 → 요약 반환 → 소멸
  수직적 관계. 부모가 기다린다.
  예: code-reviewer, planner, security-reviewer

Teammate (10-agent-teams.md):
  독립적으로 생존 → 작업 보드로 협력 → 여러 작업 순회
  수평적 관계. 아무도 기다리지 않는다.
  예: backend-agent, frontend-agent, qa-agent
```

**둘 다 "Agent"이지만 생명주기가 다르다.**
Subagent는 일회용 전문가, Teammate는 상주 팀원이다.

---

## 탄생 배경: 컨텍스트가 오염된다

Agent Loop와 Skills가 완성되면서 Claude Code는 복잡한 작업을 처리하기 시작했다.

그런데 치명적인 문제가 드러났다.

```python
# Agent Loop의 메시지 배열이 점점 커진다
messages = [
    "user: 결제 시스템 구현해줘",
    "assistant: 먼저 코드베이스를 파악해볼게요...",
    "user: [tool_result] src/api/routes.ts (500줄)",       ← 2000 토큰
    "user: [tool_result] src/models/user.ts (300줄)",      ← 1200 토큰
    "user: [tool_result] src/db/schema.sql (200줄)",       ← 800 토큰
    "user: [tool_result] package.json",                    ← 300 토큰
    "user: [tool_result] README.md",                       ← 500 토큰
    ... (파일 탐색 20개 더)
    "assistant: 좋아요, 이제 계획을 세울게요...",
    "assistant: 1단계: stripe 패키지 설치...",
    ... (계획과 구현이 섞이기 시작)
]
# 총 컨텍스트: 50,000 토큰
# 그 중 실제 코드 리뷰에 필요한 것: 5,000 토큰
# 노이즈 비율: 90%
```

**코드 리뷰 에이전트가 50,000 토큰의 컨텍스트를 전부 들고 리뷰해야 한다.**
탐색 과정, 계획, 잡담, 파일 내용들...
정작 리뷰에는 필요 없는 것들이 대부분이다.

핵심 통찰:
> "As the agent works, its messages array grows. Every file read, every bash output stays in context permanently."

---

## 핵심 통찰: 프로세스 격리 = 컨텍스트 격리

해결책은 우아했다.

**새로운 에이전트에게는 항상 빈 메시지 배열을 준다.**

```python
# 서브에이전트 실행
def run_subagent(prompt: str) -> str:
    sub_messages = [{"role": "user", "content": prompt}]
    # ↑ messages=[] 로 시작! 부모 대화 내용 없음

    # 서브에이전트만의 루프
    while True:
        response = client.messages.create(messages=sub_messages, ...)
        if response.stop_reason != "tool_use":
            break
        # 툴 실행, 결과 추가...

    # 부모에게는 요약만 반환
    return last_text_from(response)
    # 서브에이전트의 30개 툴 콜은 부모 컨텍스트에 들어오지 않음
```

```
부모 에이전트                    서브에이전트
┌──────────────────┐             ┌──────────────────┐
│ messages=[       │             │ messages=[]      │ ← 깨끗!
│   긴 대화...     │             │                  │
│   30개 파일...   │  요청       │  독립적으로 작업  │
│                  │ ──────────> │  (파일 읽기, 분석)│
│   result = "..." │ <────────── │  return 요약     │
│                  │  요약만     │                  │
└──────────────────┘             └──────────────────┘
                                 서브에이전트의 30개 툴 콜 = 버려짐
```

"탐색해서 답을 찾아주는 일"을 서브에이전트에게 맡기면:
1. 서브에이전트가 깨끗한 컨텍스트로 탐색
2. 찾은 내용을 요약해서 부모에게 전달
3. 부모 컨텍스트에는 요약만 남음 (탐색 노이즈 없음)

---

<!-- section:workshop -->
## Claude Code에서 Agents = 전문화된 서브에이전트

Context Isolation 패턴이 Claude Code에서는 **Agent 정의 파일**로 구현됐다.

`.claude/agents/code-reviewer.md` 파일 하나로:
1. 특정 역할에 특화된 Knowledge 주입
2. 필요한 Tools만 부여 (최소 권한)
3. 적합한 모델 선택
4. 깨끗한 Context에서 실행

실제 프로젝트의 `code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality,
             security, and maintainability. Use immediately after writing or
             modifying code. MUST BE USED for all code changes.
tools: ["Read", "Grep", "Glob", "Bash"]   ← 쓰기 권한 없음
model: sonnet
---

You are a senior code reviewer ensuring high standards of code quality and security.

## Review Process
1. Run `git diff --staged` and `git diff` to see all changes
2. Read the full file and understand imports, dependencies, and call sites
3. Apply review checklist below, from CRITICAL to LOW
4. Report findings — only issues >80% confident are real problems

## Review Output Format

[CRITICAL] Hardcoded API key in source
File: src/api/client.ts:42
Issue: API key exposed in source code.
Fix: Move to environment variable

## Review Summary
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0     | pass   |
| HIGH     | 2     | warn   |
Verdict: WARNING — 2 HIGH issues before merge.
```

이 파일 하나가 에이전트의 전부다: 역할 정의, 툴 목록, 모델 선택, 작업 지침.

### `model` 필드: 인지 비용의 최적화

에이전트마다 `model` 필드가 있다. 어떤 모델을 선택할까?

```
Opus 4.6:    깊은 추론, 복잡한 아키텍처 설계, 어려운 디버깅
             → planner (아키텍처 결정은 비싸도 정확해야 한다)

Sonnet 4.6:  일반 개발, 코드 리뷰, 멀티스텝 구현
             → code-reviewer (비용 대비 최적, 대부분의 작업)

Haiku 4.5:   패턴 추출, 단순 분석, 백그라운드 정리
             → refactor-cleaner (빠르고 저렴, 반복적 스캔)
```

**모델 선택은 Harness 설계 결정이다.**
비싼 모델이 항상 좋은 게 아니다. 작업의 인지적 요구 수준에 맞춰야 한다.

```
planner:           model: opus   ← 한 번의 결정이 전체 방향을 정함
code-reviewer:     model: sonnet ← 빈번하게 호출, 정확도와 비용의 균형
security-reviewer: model: sonnet ← 보안은 중요하지만 패턴 매칭이 주 작업
refactor-cleaner:  model: haiku  ← 데드코드 탐지는 반복적, 빠른 스캔이 핵심
```

---

## Context Isolation의 세 가지 이점

### 이점 1: 집중력

```
code-reviewer 에이전트가 보는 것:
- 변경된 파일들
- 리뷰 기준 (Knowledge)
- 그것뿐

code-reviewer 에이전트가 보지 않는 것:
- 지난 3시간의 구현 과정
- 다른 파일들의 내용
- 이전 대화의 잡담
```

**불필요한 노이즈 없이 역할에만 집중.**

### 이점 2: 병렬 실행

```
메인 Claude가 동시에 실행:
┌─ planner: 아키텍처 계획 (독립적 컨텍스트)
├─ security-reviewer: 보안 스캔 (독립적 컨텍스트)
└─ doc-updater: 문서 업데이트 (독립적 컨텍스트)
```

실제 사용 예시 — 세 에이전트를 동시에 dispatch:

```
메인 Claude:
  [Agent: planner, "결제 시스템 아키텍처 설계해줘"]      ─┐
  [Agent: security-reviewer, "현재 인증 코드 보안 검토"]  ─┤ 동시 실행
  [Agent: code-reviewer, "방금 작성한 API 코드 리뷰"]    ─┘

  (세 에이전트가 각자 독립적 컨텍스트에서 작업)

  planner 결과: "3-tier 아키텍처 추천..."
  security 결과: "JWT 만료 처리 누락..."
  reviewer 결과: "N+1 쿼리 문제 발견..."
```

각 에이전트가 독립적 컨텍스트를 갖기 때문에 병렬 실행이 안전하다.

### 이점 3: 최소 권한

```
planner:           Read, Grep, Glob → 읽기 전용 (코드 수정 불가)
code-reviewer:     Read, Grep, Glob, Bash → 읽기 + 실행
security-reviewer: Read, Write, Edit, Bash → 모든 권한 (수정해서 고쳐야 하므로)
```

각 에이전트에게 필요한 툴만 준다.
`planner`는 실수로도 코드를 수정할 수 없다.

---

## Description: 에이전트 자동 선택의 열쇠

에이전트 시스템의 강력한 특성은 **description**에 있다.

```yaml
description: 코드 작성/수정 완료 후 PROACTIVELY 사용.
             모든 코드 변경에 MUST BE USED.
```

Claude는 이 description을 보고 스스로 판단한다:
*"사용자가 코드를 작성했다. code-reviewer를 써야겠다."*

사용자가 "리뷰해줘"라고 말하지 않아도 에이전트가 실행된다.
이것이 proactive agent orchestration이다.

---

> **💡 Tip:** 구현 에이전트와 검증 에이전트를 분리하면 품질이 2-3배 올라간다. 같은 에이전트가 자기 코드를 리뷰하면 "내가 쓴 코드니까 맞겠지" 편향이 생긴다. 별도 컨텍스트의 검증 에이전트가 리뷰해야 한다.

> **💬** "Claude에게 자기 작업을 검증할 방법을 주면 품질이 2-3배 올라간다. 이것이 내가 줄 수 있는 가장 중요한 팁이다." — Boris Cherny, Claude Code 창시자

## 실전 예시: 에이전트 팀 구성

| 에이전트 | Harness 역할 | 전문 Knowledge |
|---------|-------------|----------------|
| **planner** | Context 격리 + Knowledge 전문화 | 계획 수립, 단계 분해 |
| **code-reviewer** | Context 격리 + Knowledge 전문화 | 코드 품질 리뷰 |
| **security-reviewer** | Context 격리 + Knowledge 전문화 | OWASP, 보안 패턴 |
| **refactor-cleaner** | Context 격리 + Knowledge 전문화 | 데드코드 탐지 |

---

## Preloaded Knowledge: 에이전트 안의 Skill

에이전트에게 Tools와 Model을 줬다. 그런데 **Knowledge도 줄 수 있다.**

03-skills.md에서 배운 Skills는 사용자가 `/commit`으로 호출한다.
하지만 에이전트의 `.md` 파일 안에 직접 Knowledge를 넣으면?

```
Slash Command Skill:
  사용자: /commit
  → SKILL.md가 컨텍스트에 로드됨
  → 호출 시에만 존재

Agent Preloaded Skill:
  code-reviewer.md 안에 리뷰 체크리스트가 직접 포함
  → 에이전트가 생성될 때 이미 컨텍스트에 존재
  → 별도 호출 불필요
```

실제 `code-reviewer.md`를 다시 보면:

```markdown
---
name: code-reviewer
tools: ["Read", "Grep", "Glob", "Bash"]
model: sonnet
---

You are a senior code reviewer...

## Review Checklist       ← 이것이 Preloaded Knowledge
1. Security: 하드코딩된 시크릿 확인
2. Performance: N+1 쿼리 확인
3. Style: 불변성 패턴 확인
```

`## Review Checklist` 이하가 바로 **Preloaded Skill**이다.
에이전트 정의 파일 자체가 Knowledge 주입의 수단이 된다.

```
Harness 관점:
  Agent = Tools (tools 필드)
        + Knowledge (agent.md 본문 = Preloaded Skill)
        + Context (messages=[] 격리)
        + Permissions (최소 권한 툴셋)

  에이전트 하나가 Harness의 4개 레이어를 모두 가진다.
```

---

<!-- section:reflection -->
## 에이전트가 성숙하면서 생긴 문제

에이전트 시스템이 정착하면서 또 다른 문제가 드러났다.

*"`npm install` 하는 30초 동안 Claude는 아무것도 못 한다. 빌드 대기 중에 다른 작업을 할 수 없나?"*

→ **[Ch07. Background Tasks — 30초의 침묵](./09-background-tasks.md)**
