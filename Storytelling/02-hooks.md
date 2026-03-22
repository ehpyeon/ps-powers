# Hooks — 행동 전후에 개입하는 23개의 문

> **이전 이야기에서**: 지민은 CLAUDE.md로 Claude에게 프로젝트를 기억시켰다.
> 이제 "Next.js 14 프로젝트야"를 매번 말할 필요가 없었다. Claude가 더 자신감 있게 일하기 시작했다.
> 파일을 수정하고, 코드를 실행하고... 그러던 어느 날 밤.

> Harness = Tools + Knowledge + Context + **Permissions**
>
> Hooks는 Harness의 **Permissions 제어 메커니즘**이다.
> *"Claude가 움직일 때 나도 움직이고 싶다"*

---

## 그날 밤에 일어난 일

지민이 자고 있는 동안 Claude가 코드 리뷰를 하고 있었다.
테스트가 실패했다. Claude는 "수정하겠습니다"라며 코드를 고쳤다.
그리고 `git push`를 main 브랜치에 실행했다.

아침에 Slack 알림이 7개 와 있었다.

```
현우: @지민 프로덕션 빌드 실패함. 누가 main에 직접 push 했어?
현우: 새벽 2시에?
```

지민은 깨달았다. **Claude에게 기억(CLAUDE.md)을 줬더니 자신감이 생겼다. 하지만 경계가 없었다.**

CLAUDE.md로 Claude가 프로젝트를 기억하게 됐다.
Claude는 이제 더 자신감 있게 행동했다.
파일을 고치고, 터미널 명령을 실행하고, 여러 파일을 한꺼번에 수정했다.

그런데 개발자들에게 불편함이 생겼다.

```
Claude가 파일을 수정함
  → 나는 수동으로 lint를 돌려야 함
  → 나는 수동으로 테스트를 실행해야 함
  → 나는 수동으로 포매터를 실행해야 함
  → ...
```

더 답답한 상황도 있었다.

```
Claude가 git push를 실행하려 함
  → 내가 원하지 않는 순간일 수 있음
  → 막을 방법이 없음
```

그리고 아주 사소하지만 삶의 질과 직결된 욕구도 있었다.

```
Claude가 30분짜리 작업을 하고 있음
  → 나는 딴 일을 하고 있음
  → 작업이 끝났는지 계속 탭을 확인해야 함
  → "끝나면 소리 내줘" 같은 게 있으면 좋겠다
```

*"Claude의 모든 행동에 내가 개입할 수 있는 방법이 필요하다."*

---

## 해결책의 탄생: "이벤트 시스템"

Anthropic은 Claude Code에 이벤트 기반 훅 시스템을 도입했다.

Agent Loop의 관점에서 보면, Hooks는 루프의 각 단계에 끼어드는 인터셉터다:

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(...)

        for block in response.content:
            if block.type == "tool_use":
                # ← PreToolUse 훅 (허용/차단)
                output = TOOL_HANDLERS[block.name](**block.input)
                # ← PostToolUse 훅 (반응/주입)
```

핵심 아이디어는 단순하다:
**Claude가 특정 행동을 할 때마다, 지정한 스크립트를 실행한다.**

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npm run lint"
      }]
    }]
  }
}
```

Claude가 파일을 수정할 때마다(`Edit|Write`) → lint 자동 실행.
한 줄의 설정으로 수동 작업이 자동화됐다.

---

## Harness에서 Hooks의 위치

```
Permissions 레이어가 없는 Harness:
  Claude가 어떤 툴이든 아무 때나 실행 가능
  → rm -rf 실수, git push 실수, 프로덕션 DB 수정 실수

Permissions 레이어가 있는 Harness:
  PreToolUse: 실행 전 차단/허용 결정
  PostToolUse: 실행 후 반응 (린트, 테스트, 알림)
  UserPromptSubmit: 입력에 컨텍스트 주입
  → Claude는 같은 루프를 돌지만, 행동 경계가 명확해진다
```

Permissions 레이어의 핵심 원칙:
> "에이전트에게 필요한 권한만 준다. 최소 권한이 실수를 방지한다."
> Hooks는 이 원칙을 **동적으로** 실행한다.

---

<!-- section:workshop -->
## Permission Modes: 거시적 권한 스위치

Hooks가 **미시적** 권한 제어(개별 툴 단위)라면,
Permission Modes는 **거시적** 권한 스위치(세션 전체)다.

```
세 가지 모드:

Normal Mode (기본값):
  Claude가 파일을 수정하거나 명령을 실행하기 전에 매번 승인을 요청한다.
  → 안전하지만, 승인 클릭이 잦다

Auto-Accept Mode:
  Claude의 행동을 자동으로 승인한다.
  → 빠르지만, 위험한 행동도 바로 실행된다

Plan Mode (읽기 전용):
  Claude가 분석과 계획만 한다. 코드를 수정하지 않는다.
  → 탐색과 아키텍처 리뷰에 최적
```

**Shift+Tab** 하나로 모드를 전환한다.

실전 워크플로우:
```
새 프로젝트 탐색  → Plan Mode     (안전하게 구조 파악)
구현 시작        → Normal Mode    (승인하면서 진행)
신뢰된 반복 작업  → Auto-Accept   (테스트 작성 등)
위험한 작업 전    → Normal Mode로 복귀
```

Hooks와 Permission Modes의 관계:
```
Permission Modes = 큰 다이얼  (세션 전체의 권한 수준)
Hooks            = 작은 다이얼 (특정 툴/이벤트별 미세 조정)

예: Auto-Accept 모드에서도 Hooks가 git push를 막을 수 있다.
    큰 다이얼이 "열림"이어도, 작은 다이얼이 "닫힘"이면 차단된다.
```

기타 핵심 단축키:
- **Ctrl+B**: 백그라운드 모드 토글 (Claude가 뒤에서 작업)
- **Ctrl+O**: 추론 과정 보기 (Claude의 사고 과정 확인)

---

## Hooks의 세 가지 힘

### 힘 1: 반응 (Reaction)
Claude의 행동이 완료된 후 무언가를 한다.

```
PostToolUse (Edit/Write 후)
  → 포매터 실행
  → 타입 체크
  → 품질 게이트 경고
  → 로그 기록

Stop (Claude 응답 완료 후)
  → 완료 알림 소리 재생
  → Slack 메시지 전송
```

### 힘 2: 차단 (Blocking)
Claude의 행동을 **실행 전에** 막는다.

```
PreToolUse (실행 전)
  → git push 전에 브랜치 확인
  → rm -rf 명령어 감지 및 차단
  → 프로덕션 DB 접근 시 경고
```

훅 스크립트가 exit code 2를 반환하면 → Claude가 그 행동을 하지 않는다.

### 힘 3: 주입 (Injection)
Claude가 보는 정보를 조작한다.

```
UserPromptSubmit (사용자 입력 직후)
  → 프롬프트에 추가 컨텍스트 자동 삽입
  → "현재 브랜치: feature/login" 같은 정보 주입
```

---

## Hooks가 커버하는 23개 이벤트

처음엔 몇 개 없었다. 수요가 늘면서 계속 추가됐다.

| 카테고리 | 이벤트 | 발화 시점 |
|--------|--------|---------|
| **툴** | PreToolUse | 툴 실행 직전 |
| | PostToolUse | 툴 성공 후 |
| | PostToolUseFailure | 툴 실패 후 |
| | PermissionRequest | 권한 요청 시 |
| **세션** | SessionStart | 세션 시작/재개 |
| | SessionEnd | 세션 종료 |
| | UserPromptSubmit | 사용자 입력 직후 |
| **응답** | Stop | Claude 응답 완료 |
| | StopFailure | API 에러로 실패 |
| | Notification | 알림 발생 |
| **에이전트** | SubagentStart | 서브에이전트 시작 |
| | SubagentStop | 서브에이전트 완료 |
| **컴팩트** | PreCompact | 컨텍스트 압축 전 |
| | PostCompact | 컨텍스트 압축 후 |
| **기타** | ConfigChange | 설정 파일 변경 |
| | InstructionsLoaded | CLAUDE.md 로드 |
| | WorktreeCreate/Remove | 워크트리 관련 |
| | ...외 5개 | |

각 이벤트가 추가될 때마다 뒤에는 실제 개발자의 수요가 있었다.
`TeammateIdle`은 멀티 에이전트 팀 기능을 위해,
`InstructionsLoaded`는 어떤 규칙 파일이 로드됐는지 알고 싶어서.

---

## Hooks의 두 가지 실행 모드

### 동기 (Sync) — Claude를 기다리게 한다
```json
{ "type": "command", "command": "npm run typecheck" }
```
훅이 끝날 때까지 Claude가 다음 행동을 하지 않는다.
결과가 중요한 품질 게이트에 적합.

### 비동기 (Async) — Claude를 기다리게 하지 않는다
```json
{ "type": "command", "command": "play-sound.py", "async": true }
```
훅이 백그라운드에서 실행되는 동안 Claude는 계속 일한다.
알림, 로깅처럼 사이드 이펙트에 적합.

---

> **❌ Anti-pattern:** `dangerously-skip-permissions`를 쓰지 마라. 대신 settings.json의 `allow` 필드에 필요한 명령만 pre-allow하라. 전체 권한 해제는 보안 레이어를 무력화한다.

#### 🔨 지금 해보세요

1. `.claude/settings.json`에 PostToolUse 훅을 추가한다: `{"event": "PostToolUse", "command": "echo 'Tool used!'", "async": true}`
2. Claude에게 파일을 수정하게 시키고, 훅이 실행되는지 확인한다
3. 훅을 `blocking: true`로 바꿔서 Claude의 작업을 차단해 본다

#### ✅ 이 유닛 후 할 수 있는 것

- [ ] PreToolUse와 PostToolUse 훅의 차이를 설명
- [ ] settings.json에 훅을 추가하고 실행 확인
- [ ] exit 2로 작업을 차단하는 블로킹 훅을 구현

## 실전 예시: 프로젝트의 훅들

이 프로젝트에 구현된 훅을 실제 코드로 살펴보자.

### hooks.py — 23개 이벤트에 사운드 재생

사운드 시스템의 구조는 단순하다: 이벤트 이름 = 사운드 폴더 이름.

```
.claude/hooks/sounds/
  sessionstart/      ← SessionStart 이벤트 발화 시
  pretooluse/        ← PreToolUse 이벤트 발화 시
  posttooluse/       ← PostToolUse 이벤트 발화 시
  stop/              ← Stop 이벤트 발화 시
  pretooluse-git-committing/  ← git commit 감지 시 특별 소리
  ...
```

각 폴더 안에 `.mp3` 파일을 넣으면 해당 이벤트 발화 시 자동 재생된다. 폴더 안에 파일이 여러 개면 랜덤으로 선택된다.

```
SessionStart → hooks/sounds/sessionstart/start.mp3
git commit   → hooks/sounds/pretooluse-git-committing/commit.mp3
Stop         → hooks/sounds/stop/complete.mp3
```

### quality-gate.py — 자동 품질 검사원

Claude가 파일을 수정할 때마다 이 훅이 자동으로 검사한다. 무엇을 검사하냐면:

```
품질 검사가 잡아내는 것들:

1. 디버그 코드 — 개발 중에만 쓰는 코드가 남아 있으면 경고
   → console.log()   "이 줄 나중에 지워야 하는데 잊었죠?"
   → print()         "이것도요"
   → debugger        "이건 브라우저를 멈추게 합니다"

2. 시크릿 하드코딩 — 비밀번호나 API 키가 코드에 직접 적혀 있으면 경고
   → api_key = "sk-abc123..."     "이거 GitHub에 올라가면 큰일납니다"
   → password = "my-secret"       "환경변수로 옮기세요"
   → Bearer eyJhbGci...           "토큰이 코드에 있으면 안 돼요"

3. 미완성 TODO — 티켓 번호 없는 TODO/FIXME가 있으면 경고
   → TODO: 나중에 고치자          "언제요? 티켓 번호를 붙이세요"
   → HACK: 임시 해결              "이건 기술 부채입니다"
```

> 마치 코드를 커밋하기 전에 시니어 개발자가 한 번 훑어보는 것과 같다. 단, 이 "시니어"는 **24시간 깨어 있고, 절대 귀찮아하지 않는다.**

이 검사를 설정하는 방법:

```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "python3 .claude/hooks/scripts/quality-gate.py",
      "async": true,
      "timeout": 5000
    }]
  }]
}
```

- `"matcher": "Edit|Write"` → Claude가 파일을 **편집하거나 새로 쓸 때만** 검사 실행 (읽기에는 실행 안 됨)
- `"async": true` → 검사하는 동안 Claude는 다음 작업 계속 진행 (기다리지 않음)
- `"timeout": 5000` → 검사가 5초 안에 안 끝나면 건너뜀

### toggle-hook.py — 개별 훅 on/off 유틸리티

```bash
# 훅 상태 확인
python3 .claude/hooks/scripts/toggle-hook.py list

# 특정 훅 토글
python3 .claude/hooks/scripts/toggle-hook.py toggle PostToolUse

# hooks-config.local.json에 저장 (git에 올라가지 않음)
```

---

<!-- section:reflection -->
## 훅이 성숙하면서 생긴 문제

훅 시스템이 강력해질수록, 개발자들은 더 복잡한 걸 원했다.

*"Claude에게 코드 리뷰를 시키는데, 항상 같은 지시를 내린다.
'변경된 파일을 분석하고, 보안 문제를 찾고, 심각도별로 정리해줘.'
이걸 매번 타이핑하는 건 너무 번거롭다."*

*"자주 쓰는 워크플로우를 버튼처럼 만들 수 없을까?"*

→ **[Ch04. Skills — 하루에 열 번 같은 말](./03-skills.md)**
