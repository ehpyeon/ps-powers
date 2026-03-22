# 00. The Agent Loop — 모든 것의 시작

> **이전 이야기에서**: 지민은 Claude Code를 설치하고 첫 실행을 했다.
> Claude가 스스로 파일을 읽고 분석하는 모습에 놀랐다.
> "이건 그냥 챗봇이 아닌데?" — 하지만 왜 이렇게 작동하는지는 아직 모른다.
>
> 옆 자리 현우가 흘끗 봤다. "그거 그냥 챗봇이잖아. 복사-붙여넣기가 좀 편해진 거지."

> *"One loop & Bash is all you need"*
> — Harness Engineering

---

## 진짜 시작점: Claude는 그냥 텍스트를 반환했다

2022년, Anthropic이 Claude를 출시했을 때 Claude는 **텍스트를 받고 텍스트를 반환하는 함수**였다.

```
Input:  "이 코드의 버그를 찾아줘"
Output: "3번째 줄에서 null 체크가 빠진 것 같습니다..."
```

도움이 됐다. 그런데 Claude가 아무리 똑똑해도, **실제 파일을 읽을 수 없었고, 터미널을 실행할 수 없었다.** 개발자는 Claude의 답을 보고, 직접 코드를 고치고, 에러 메시지를 복사해서 다시 붙여넣어야 했다.

**개발자 자신이 루프였다.**

---

## 전환점: Tool Use의 등장 (2023)

Anthropic은 Claude API에 `tool_use`라는 기능을 추가했다.

아이디어는 간단했다:
*"Claude가 텍스트만 반환하는 게 아니라, '이 함수를 실행해줘'라고 요청할 수 있으면 어떨까?"*

```python
# Claude의 응답이 이렇게 바뀌었다
response = {
  "stop_reason": "tool_use",
  "content": [{
    "type": "tool_use",
    "name": "bash",
    "input": {"command": "cat src/main.py"}
  }]
}
```

이제 Claude가 파일을 읽고 싶다고 **요청**할 수 있었다.
개발자는 그 요청을 실행하고 결과를 돌려주면 됐다.

그런데 이걸 매번 수동으로 하면... 여전히 개발자가 루프다.

---

## The Loop의 발견: 30줄로 만드는 에이전트

누군가 깨달았다. *"자동화하면 되잖아."*

코드를 몰라도 괜찮다. 이 30줄이 하는 일은 딱 세 가지다:

```
Agent Loop가 하는 일 (의사코드):

1. 사용자의 질문을 Claude에게 보낸다
2. Claude가 답한다
   └─ "할 말이 있어요" → 대답하고 끝
   └─ "이 도구를 실행해주세요" → 3번으로
3. 요청받은 도구를 실행한다 (파일 읽기, 터미널 실행 등)
4. 실행 결과를 Claude에게 다시 보낸다
5. 2번으로 돌아간다 → Claude가 "끝"이라고 할 때까지 반복
```

> 핵심은 **반복**이다. Claude가 "이 파일을 읽어줘" → 읽어서 돌려줌 → "이 코드를 실행해줘" → 실행해서 돌려줌 → "다 됐어요" → 끝. 이 반복이 Agent Loop의 전부다.

실제 Python 코드로 보면:

```python
def agent_loop(query):                              # 사용자 질문을 받는 함수
    messages = [{"role": "user", "content": query}]  # 대화 기록 시작
    while True:                                      # 무한 반복 (끝날 때까지)
        response = client.messages.create(           # Claude에게 보내기
            model=MODEL, messages=messages, tools=TOOLS
        )

        if response.stop_reason != "tool_use":       # Claude가 "끝"이라고 하면
            return                                   # → 여기서 멈춤

        # Claude가 "이 도구를 실행해줘"라고 요청한 경우:
        for block in response.content:
            if block.type == "tool_use":             # 도구 실행 요청이면
                output = run_bash(block.input["command"])  # 실행하고
                results.append({"content": output})  # 결과를 모음

        messages.append({"role": "user", "content": results})
        # ↑ 결과를 Claude에게 다시 보냄 → while True로 돌아감 → 반복!
```

- `while True` = "Claude가 끝이라고 할 때까지 계속 돌아" (반복문)
- `client.messages.create(...)` = "Claude에게 메시지를 보내고 답을 받아" (API 호출)
- `run_bash(...)` = "터미널에서 명령어를 실행해" (도구 실행)
- `messages.append(...)` = "대화 기록에 추가해" (기억 쌓기)

**이게 전부다.** 30줄.

Claude는 이제 스스로 파일을 읽고, 코드를 실행하고, 결과를 보고, 다음 행동을 결정한다. 개발자가 중간에서 복사-붙여넣기를 할 필요가 없다.

---

## 핵심 통찰: "모델이 에이전트다"

여기서 중요한 인식의 전환이 일어났다.

흔한 오해: *"에이전트를 만들려면 복잡한 프레임워크, 프롬프트 체인, 의사결정 트리가 필요하다."*

실제: **에이전트는 이미 Claude 안에 있다.**

DeepMind의 DQN, OpenAI Five, AlphaStar... 이 모든 AI 에이전트들이 증명한 것은 하나다: **에이전트는 수십억 번의 학습을 통해 행동하는 법을 배운 모델이다.** 코드로 만들어지는 게 아니다.

Claude는 이미 생각하고, 계획하고, 행동하는 법을 안다.
우리가 해야 할 일은 Claude가 **일할 수 있는 환경을 만드는 것**이다.

---

## Harness: 환경을 설계하는 일

이 환경을 **Harness(하네스)** 라고 부른다.

```
Harness = Tools + Knowledge + Context + Permissions

Tools:       Claude의 손 — 파일 읽기, 코드 실행, API 호출
Knowledge:   Claude의 기억 — 프로젝트 정보, 규칙, 도메인 지식
Context:     Claude의 단기 메모리 — 지금까지 한 일
Permissions: Claude의 경계 — 무엇을 할 수 있고 없는지
```

**Claude Code는 이 Harness다.**

Claude Code는 Claude를 똑똑하게 만들지 않는다.
Claude는 이미 똑똑하다.
Claude Code는 Claude에게 **손, 눈, 작업 공간**을 준다.

---

## Claude Code의 본질

Claude Code를 분해하면:

```
Claude Code = agent loop (기반)
            + tools       (Read, Write, Bash, Glob, Grep, ...)  ← 손
            + CLAUDE.md   (프로젝트 지식)                        ← 기억
            + skills      (on-demand 지식)                       ← 전문 지식
            + /compact    (context 압축)                         ← 메모리 관리
            + subagents   (context 격리)                         ← 집중력
            + hooks       (permission governance)               ← 경계
            + rules       (구조화된 지식)                        ← 조직된 기억
            + MCPs        (외부 툴)                              ← 확장된 손
```

이 목록의 모든 항목은 **Harness 설계 결정**이다.
각 항목은 특정 문제를 해결하기 위해 추가됐다.
그리고 각 항목이 추가될 때마다, 새로운 문제가 드러났다.

---

<!-- section:workshop -->
## Agent Loop의 두 얼굴: Interactive vs Headless

지금까지의 Agent Loop는 사람이 프롬프트를 치는 것을 가정했다.
그런데 CI/CD 파이프라인에서는? 크론 잡에서는? 누구도 키보드 앞에 없다.

**같은 Agent Loop가 비대화형으로도 작동한다.**

```bash
# Headless 모드: -p 플래그
claude -p "이 코드의 보안 취약점을 분석해줘"

# stdin 파이핑: 로그를 Claude에게 직접 전달
cat error.log | claude -p "이 에러 로그를 분석하고 원인을 찾아줘"

# JSON 출력: 자동화 파이프라인용
claude -p --output-format json "package.json의 의존성을 분석해줘"
```

CI/CD에서의 실전 패턴:
```bash
# PR 자동 보안 리뷰
git diff main --name-only | claude -p "변경된 파일들의 보안 취약점을 리뷰해줘"

# 번역 자동화
claude -p "새 문자열을 한국어로 번역하고 PR 생성해줘"

# 로그 모니터링
tail -f app.log | claude -p "이상 징후 발견하면 Slack으로 알려줘"
```

핵심 통찰: Agent Loop의 `while True`는 동일하다.
입력이 터미널에서 오든, 파이프에서 오든, 루프는 같은 방식으로 돈다.
**Interactive는 사람이 루프를 트리거하고, Headless는 시스템이 트리거한다.**

---

## 같은 루프, 다른 인터페이스

Agent Loop는 터미널에서만 돌까? 아니다.

```
Terminal (CLI)     ← 파이프, 자동화에 최적
VS Code Extension  ← 인라인 diff, @멘션, 코드 리뷰
Desktop App        ← 시각적 diff, 장시간 작업, 멀티 세션
Web (claude.ai/code) ← 설치 없이, 모바일에서 이어가기
JetBrains Plugin   ← IntelliJ, PyCharm, WebStorm
iOS App            ← 이동 중 작업 확인
```

그리고 이 환경들 사이를 넘나들 수 있다:

```
/teleport  → 터미널 세션을 웹으로 이동
/desktop   → 터미널 세션을 데스크톱 앱으로 이동
```

```
나: (터미널에서 2시간 작업 중)
나: 밖에 나가야 하는데...
나: /teleport
→ 세션이 claude.ai/code로 이동
→ 폰으로 작업 상태 확인 가능
→ 나중에 다시 터미널로 돌아올 수 있음
```

핵심 통찰: **루프는 환경에 독립적이다.**
Harness(Tools + Knowledge + Context + Permissions)만 같으면 어디서든 같은 에이전트가 작동한다.
터미널이든, IDE든, 웹이든 — Claude가 보는 것은 같은 messages 배열이다.

---

<!-- section:reflection -->
## 이제 이야기가 시작된다

Agent Loop와 Harness 개념을 이해했다면,
Claude Code의 모든 기능을 "왜 이게 필요했는지"로 설명할 수 있다.

```
Agent Loop 발견
    ↓ "프로젝트마다 컨텍스트를 설명해야 한다"
CLAUDE.md — Knowledge 레이어
    ↓ "Claude의 행동에 반응하고 싶다"
Hooks — Permission & Reaction 레이어
    ↓ "같은 워크플로우를 반복한다"
Skills — On-demand Knowledge 레이어
    ↓ "컨텍스트가 오염된다, 작업이 너무 크다"
Agents — Context Isolation 레이어
    ↓ "CLAUDE.md가 너무 커졌다"
Rules — Structured Knowledge 레이어
    ↓ "외부 세계와 단절돼 있다"
MCPs — Tool Expansion 레이어
```

모든 것은 하나의 루프에서 시작됐다.

→ **[Ch02. CLAUDE.md — 매일 출근하는 신입사원](./01-CLAUDE-md.md)**
