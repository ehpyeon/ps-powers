# 에필로그 — Harness Engineer

> **이전 이야기에서**: 지민은 Token Economics로 비용을 70% 절감했다.
> 모델 라우팅, 컨텍스트 압축, 온디맨드 로딩 — 효율적인 Harness가 곧 좋은 Harness였다.
> 4주가 지났다. 이제 전체 그림을 그릴 시간이다.

> *"The Model IS the Agent. The Code IS the Harness."*
> — 지민의 첫날에 들었던 말. 이제 그 의미를 안다.

---

## 4주 전으로 돌아가서

4주 전, 지민은 Claude Code를 처음 실행했다.

옆 자리 현우가 말했다. "그거 그냥 챗봇이잖아."

지민도 그렇게 생각했다. 텍스트를 넣으면 텍스트가 나오는 도구.

하지만 4주 동안 지민은 깨달았다. Claude는 처음부터 에이전트였다. **부족했던 것은 Claude가 아니라 환경이었다.**

---

<!-- section:reflection -->
## 전체 그림

지민이 화이트보드에 그린 최종 다이어그램:

```
                    Harness = Tools + Knowledge + Context + Permissions
                    ═══════════════════════════════════════════════════

    ┌─────────────────────────────────────────────────────────────────────┐
    │                         Permissions 레이어                          │
    │                                                                     │
    │  Hooks (Ch03)          Permission Modes (Ch10)     Security (Ch10)  │
    │  └ PreToolUse          └ Normal / Auto / Plan      └ 시크릿 보호    │
    │  └ PostToolUse                                     └ MCP 신뢰 경계  │
    │  └ 23개 이벤트                                                      │
    ├─────────────────────────────────────────────────────────────────────┤
    │                         Knowledge 레이어                            │
    │                                                                     │
    │  CLAUDE.md (Ch02)      Skills (Ch04)    Rules (Ch08)  Memory (Ch14)│
    │  └ 자동 주입            └ 온디맨드        └ 선택 로딩    └ 세션 영속  │
    │  └ 프로젝트 지식        └ /commit 등      └ 7개 파일     └ MEMORY.md │
    ├─────────────────────────────────────────────────────────────────────┤
    │                         Context 레이어                              │
    │                                                                     │
    │  Task System (Ch05)    Agents (Ch06)     Compact (Ch11)            │
    │  └ 외부화된 계획        └ 컨텍스트 격리    └ 3층 압축                 │
    │  └ DAG 의존성           └ messages=[]     └ 트랜스크립트              │
    │                                                                     │
    │  Agent Teams (Ch12)    Worktree (Ch13)   Token Economics (Ch15)    │
    │  └ 수평 확장            └ 파일 격리        └ 모델 라우팅              │
    │  └ Message Bus          └ 브랜치 바인딩    └ 비용 최적화              │
    ├─────────────────────────────────────────────────────────────────────┤
    │                         Tools 레이어                                │
    │                                                                     │
    │  Agent Loop (Ch01)     Background (Ch07)     MCPs (Ch09)           │
    │  └ while + tool_use    └ I/O 병렬화           └ 외부 서비스          │
    │  └ 30줄의 핵심          └ 진동벨 패턴          └ stdio/http          │
    │  └ Headless Mode       └ Autonomous Loops    └ GitHub/Stripe/...   │
    └─────────────────────────────────────────────────────────────────────┘

                          ▲ 모든 것의 기반 ▲
                    ┌─────────────────────────┐
                    │   Claude (The Model)     │
                    │   = The Agent            │
                    │   이미 추론할 수 있다     │
                    └─────────────────────────┘
```

---

## 16개의 메커니즘, 하나의 원칙

```
Ch00  Harness Engineering    "모델은 이미 에이전트다. 코드가 Harness다."
Ch01  Agent Loop             "30줄의 while 루프가 모든 것의 시작"
Ch02  CLAUDE.md              "매 세션 자동 주입되는 프로젝트 지식"
Ch03  Hooks                  "Claude가 움직일 때 시스템도 움직인다"
Ch04  Skills                 "필요할 때만 로드하는 온디맨드 지식"
Ch05  Task System            "계획을 컨텍스트 밖으로 외부화한다"
Ch06  Agents                 "깨끗한 컨텍스트에서 집중한다"
Ch07  Background Tasks       "I/O를 기다리지 않고 생각을 계속한다"
Ch08  Rules                  "350줄 모놀리스를 7개 모듈로 해체한다"
Ch09  MCPs                   "표준 프로토콜로 외부 세계와 연결한다"
Ch10  Security               "신뢰 경계를 설정하고 방어를 자동화한다"
Ch11  Context Compact        "컨텍스트를 압축해서 무한 세션을 가능하게 한다"
Ch12  Agent Teams            "여러 에이전트가 수평으로 협업한다"
Ch13  Worktree Isolation     "파일 충돌 없이 병렬 작업한다"
Ch14  Agent Memory           "세션을 넘어 학습이 축적된다"
Ch15  Token Economics        "비용을 의식해서 더 좋은 Harness를 만든다"
```

하나의 원칙이 관통한다:

**에이전트에게 적절한 환경을 주면, 에이전트는 스스로 해낸다.**

도구를 주면 행동하고 (Tools),
지식을 주면 판단하고 (Knowledge),
깨끗한 컨텍스트를 주면 집중하고 (Context),
적절한 권한을 주면 안전하게 일한다 (Permissions).

---

## 돌아보며

현우가 처음에 물었다. "그거 그냥 챗봇이잖아?"

지금의 대답:

*"아니, Claude는 처음부터 에이전트였어. 내가 만든 건 Claude가 아니라 **Harness**야.
도구를 달아주고, 지식을 주입하고, 컨텍스트를 관리하고, 권한을 설정한 것.
모델을 바꾼 게 아니라, 모델이 일할 수 있는 **환경**을 만든 거지."*

현우: "...그래서 네 직함이 뭐야?"

지민은 웃었다.

*"Harness Engineer."*

---

## Agent vs Command vs Skill — 언제 뭘 쓸까?

지민이 가장 많이 받는 질문: "이건 Agent로 만들어야 해, Skill로 만들어야 해?"

| 기준 | Agent | Command | Skill |
|------|-------|---------|-------|
| **컨텍스트** | 격리 (별도 창) | 공유 (메인) | 공유 (메인) |
| **호출 방식** | 자동 (프로액티브) | 사용자 시작 (`/`) | 자동 (설명 기반) |
| **메모리** | user/project/local | — | — |
| **모델 선택** | model 필드로 지정 | model 필드로 지정 | — |
| **격리 수준** | 별도 프로세스 | 없음 | context: fork 옵션 |
| **적합한 작업** | 자율적 다단계 작업 | 사용자 워크플로우 | 재사용 가능한 절차 |

```
선택 흐름:

"이 작업이 자율적으로 돌아가야 해?"
  예 → Agent (code-reviewer, planner 등)
  아니오 ↓

"사용자가 직접 시작하는 워크플로우야?"
  예 → Command (/commit, /deploy 등)
  아니오 ↓

"재사용 가능한 지식/절차야?"
  예 → Skill
```

---

## 퀵 레퍼런스: 상황별 가이드

| 상황 | 참고 챕터 |
|------|----------|
| Claude Code 처음 시작 | Ch00 → Ch01 → Ch02 |
| Claude가 규칙을 안 따름 | Ch02 (CLAUDE.md) → Ch08 (Rules) |
| Claude에게 자동화를 걸고 싶음 | Ch03 (Hooks) |
| 반복 작업이 피곤함 | Ch04 (Skills) |
| 큰 작업에서 길을 잃음 | Ch05 (Task System) |
| 코드 리뷰가 산만함 | Ch06 (Agents) |
| 빌드 기다리는 시간이 아까움 | Ch07 (Background Tasks) |
| CLAUDE.md가 너무 김 | Ch08 (Rules) |
| 외부 서비스를 연결하고 싶음 | Ch09 (MCPs) |
| 보안이 걱정됨 | Ch10 (Security) |
| Claude 응답이 느려짐 | Ch11 (Context Compact) |
| 혼자서는 시간이 부족함 | Ch12 (Agent Teams) |
| 에이전트들이 파일을 덮어씀 | Ch13 (Worktree Isolation) |
| 매번 같은 것을 가르침 | Ch14 (Agent Memory) |
| 비용이 걱정됨 | Ch15 (Token Economics) |
