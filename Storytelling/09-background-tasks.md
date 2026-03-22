# Background Tasks — 빠른 두뇌, 느린 손

> **이전 이야기에서**: 지민은 Subagent로 코드 리뷰의 노이즈를 격리했다.
> code-reviewer가 깨끗한 컨텍스트에서 정확한 리뷰를 해줬다.
> 하지만 CI/CD 파이프라인을 구축하면서 새로운 벽에 부딪혔다...

> Harness = **Tools** + Knowledge + **Context** + Permissions
>
> Background Tasks는 **Tools 실행 방식**을 확장하고 **Context 오염을 최소화**한다.
> *"Run slow operations in the background; the agent keeps thinking"*

---

## 30초의 침묵

지민이 Enter를 눌렀다.

```
지민: 의존성 설치하고 그 동안 설정 파일 만들어줘

Claude: npm install 실행합니다...
```

30초가 지났다. 터미널에는 아무 변화가 없었다.

지민은 커피를 한 모금 마셨다. 다시 터미널을 봤다. 여전히 돌아가고 있었다.

```
        [30초 더 대기]
        설치 완료! 이제 설정 파일 만들겠습니다.
```

총 60초. **그 중 절반은 Claude가 아무것도 하지 않고 기다리기만 한 시간이었다.**

"설정 파일은 npm install 끝나기 전에도 만들 수 있잖아." 지민이 중얼거렸다. "왜 기다리는 거야?"

이건 사소한 불편이 아니었다. 현실의 블로킹 시간을 합산하면:

```
npm install       → 30초~3분
docker build      → 1분~10분
pytest            → 30초~5분
cargo build       → 1분~10분
database migration → 10초~1분
```

하루에 빌드를 20번 돌린다면? **최소 30분이 Claude가 멍하니 앉아 있는 시간이다.**

지민의 론칭 데드라인은 다가오고 있었다. 이 30분을 버릴 여유가 없었다.

---

## "왜 기다리지?": Agent Loop의 구조적 한계

문제의 원인은 Agent Loop(00에서 배운 것)의 구조에 있었다.

```python
def agent_loop(messages):
    while True:
        response = client.messages.create(...)

        for tool_call in response.content:
            if tool_call.type == "tool_use":
                output = TOOL_HANDLERS[tool_call.name](**tool_call.input)
                #             ↑ 여기서 30초 블로킹
                # 이 줄이 끝나야 다음 줄로 간다
                results.append(...)

        messages.append({"role": "user", "content": results})
        # 모든 툴 결과가 모여야 다음 LLM 호출
```

`execute_tool()` 한 줄이 끝나야 다음 줄로 넘어간다.
npm install이 3분 걸리면, Claude는 3분 동안 **생각도 하지 않는다.**

지민은 처음에 이것이 버그라고 생각했다. "고치면 되지 않나?"

하지만 곧 깨달았다. **이건 버그가 아니라 올바른 설계였다.**

---

## 올바른 설계가 문제인 이유

에이전트의 추론은 **반드시 순차적이어야 한다.**

왜? Claude가 파일을 읽고, 결과를 보고, 다음 행동을 결정한다. 만약 두 개의 LLM 호출이 동시에 진행된다면?

```
Claude A: auth.ts를 읽었다 → "JWT 방식으로 가자"
Claude B: auth.ts를 읽었다 → "세션 방식으로 가자"
→ 충돌. 어느 쪽의 판단을 따라야?
```

**추론의 순차성은 에이전트의 일관성을 보장한다.** 이건 건드리면 안 된다.

그런데 `npm install`은 추론이 아니다. **순수한 I/O 대기다.** CPU를 쓰지 않는다. 네트워크에서 패키지를 다운로드하는 것을 기다릴 뿐이다.

```
구분:
  추론 (reasoning): Claude가 생각하는 것 → 순차적이어야 함 ✅
  I/O 대기 (waiting): 외부 프로세스를 기다리는 것 → 병렬화 가능 ✅
```

지민의 눈이 커졌다. *"추론은 순차적으로 두고, I/O만 빼내면 되잖아."*

---

<!-- section:workshop -->
## BackgroundManager: 카페에서 주문하는 것과 같다

해결책은 놀랍도록 단순했다. 카페에 비유하면 이렇다:

```
카페 비유:

[블로킹 방식] — 줄 서서 기다리기
  1. 커피 주문 → 바리스타가 만드는 동안 줄에서 기다림 (3분)
  2. 커피 받음 → 이제야 자리에 가서 일 시작
  → 3분 낭비

[백그라운드 방식] — 진동벨
  1. 커피 주문 → 진동벨 받음 (0.001초)
  2. 자리에 가서 일 시작 (커피는 뒤에서 만들어지는 중)
  3. 벨이 울림 → 커피 가져옴
  → 기다리는 시간 0초
```

이것을 코드로 만든 것이 **BackgroundManager**다.

```
BackgroundManager가 하는 일 (의사코드):

run("npm install"):
  1. "npm install"을 별도 공간에서 실행 시작       ← 주문 넣기
  2. 진동벨(task_id) 즉시 반환                    ← 벨 받기
  3. Claude는 다른 일 계속                        ← 자리 가서 일하기

_execute() [뒤에서 조용히]:
  1. npm install 완료될 때까지 기다림              ← 바리스타가 커피 만드는 중
  2. 완료되면 알림 큐에 결과 추가                  ← 벨 울리기

drain_notifications() [매 반복 시작 시]:
  1. "끝난 작업 있어?" 확인                       ← 벨 울렸나 보기
  2. 있으면 결과를 Claude에게 전달                 ← 커피 가져오기
```

> **핵심은 "진동벨" 패턴이다.** 명령을 넣고 즉시 돌아온다. 결과는 나중에 알림으로 받는다. Claude는 기다리는 동안 다른 파일을 쓰고, 설정을 만들고, 테스트를 작성한다.

기술적으로 궁금한 분을 위한 Python 코드:

```python
class BackgroundManager:
    def run(self, command):                  # "npm install"을 받으면
        thread = threading.Thread(           # 별도 실행 공간을 만들어서
            target=self._execute,            # 거기서 실행하고
            args=(task_id, command),
            daemon=True                      # 메인이 끝나면 같이 끝남
        )
        thread.start()                       # 실행 시작!
        return f"task {task_id} started"     # ← 즉시 반환 (0.001초)
```

그리고 Agent Loop는 매 반복 시작 시 "진동벨이 울렸나?" 확인한다:

```
Agent Loop에 추가된 한 줄 (의사코드):

매 반복 시작:
  1. "끝난 백그라운드 작업 있어?" ← 진동벨 확인
  2. 있으면 → 결과를 Claude에게 알려줌
  3. Claude가 결과를 보고 다음 판단
```

```python
def agent_loop(messages):
    while True:
        # ← 매 반복 시작: "끝난 백그라운드 작업 있어?"
        notifs = BG.drain_notifications()
        if notifs:
            messages.append({"role": "user",
                "content": f"<background-results>{notifs}</background-results>"})

        response = client.messages.create(...)
        # Claude는 이제 완료된 작업 결과를 알고 다음 판단을 한다
```

---

## 지민의 30초가 사라지다

Claude Code에서는 `run_in_background=true` 파라미터로 구현됐다.

지민이 다시 같은 요청을 했다:

```
지민: 의존성 설치하면서 동시에 Docker도 빌드하고, 그 동안 문서도 생성해줘

Claude: [Bash: "npm install", run_in_background=true] → job-01
        [Bash: "docker build -t app .", run_in_background=true] → job-02

        // 기다리지 않고 즉시 다음 작업:
        [Read: "src/api.ts"]
        [Write: "docs/api.md", content: "...API 문서..."]
        [Write: "docs/setup.md", content: "...설치 가이드..."]

        // 완료 알림이 들어오면:
        npm install 완료 (23.4s): 247 packages added ✅
        docker build 완료 (68s): Successfully built 3a2f1b9 ✅

        세 작업 모두 완료했습니다.
```

```
타임라인:

블로킹 방식 (이전):
  [npm 30초]──────────[docker 68초]──────────────────[문서 작성]──── = 108초+

백그라운드 방식 (이후):
  [npm 30초]─────────┐
  [docker 68초]──────────────────────────────────┐
  [문서 작성 10초]─────────────────────────────── │─── = 68초
                                                  ↑
                                          Docker 완료 시점
```

총 소요 시간: **68초** (가장 느린 Docker 빌드 시간).
블로킹이었다면: **108초+**. 37% 절약.

빌드를 하루 20번 돌리면? 하루 13분 절약. 한 달이면 4시간.

Context 관점에서도 좋다:

```
블로킹 방식:
  tool_result: "npm install 실행 중..."      ← Context에 즉시 들어옴
  tool_result: (30초 후) "설치 완료 247 패키지"

백그라운드 방식:
  tool_result: "Background task started"     ← 작은 토큰 (6단어)
  (중간에 다른 작업들)
  notification: "npm install 완료"           ← 완료 시에만 Context 진입
```

I/O 대기 중의 "실행 중..." 상태가 Context를 오염시키지 않는다.

---

## Autonomous Loops: 사람이 루프 밖으로 나가다

지민은 Background Tasks에 익숙해지면서 더 대담한 생각을 하기 시작했다.

*"밤 사이에 Claude가 혼자 일하게 할 수 없을까?"*

Background Tasks + Headless Mode(00에서 배운 `claude -p`)를 조합하면 **자율 루프**가 만들어진다.

```
Agent Loop의 진화:

1단계 (2022):  사람이 루프의 일부 (복사-붙여넣기)
2단계 (Loop):  사람이 프롬프트만 입력 (Claude가 나머지)
3단계 (Headless): 시스템이 프롬프트 입력 (사람 불필요)
4단계 (Autonomous): 시스템이 반복 프롬프트 (무한 자율 실행)
```

가장 단순한 자율 루프:

```bash
# 5분마다 이슈를 확인하고 처리하는 야간 에이전트
while true; do
  claude -p "GitHub 이슈 확인하고, 해결 가능한 것 처리해줘"
  sleep 300
done
```

### 자율 루프 패턴 카탈로그

단순한 while 루프에서 시작해 점점 정교한 패턴으로 진화한다:

```
패턴 1: Sequential Pipeline
  claude -p "분석" | claude -p "구현" | claude -p "테스트"
  → 각 단계의 출력이 다음 단계의 입력
  → 단계마다 깨끗한 컨텍스트 (이전 단계의 노이즈 없음)

패턴 2: 반복 PR 루프
  for issue in $(gh issue list --json number -q '.[].number'); do
    claude -p "이슈 #$issue를 분석하고 PR을 만들어줘"
  done
  → CI가 실패하면 자동으로 수정 재시도
  → SHARED_TASK_NOTES.md로 반복 간 컨텍스트 전달

패턴 3: De-Sloppify (정리 패스)
  claude -p "이 기능을 구현해줘"         ← 1차: 구현
  claude -p "방금 구현한 코드를 정리해줘"  ← 2차: 정리
  → "~하지 마"보다 별도 정리 패스가 품질이 높다
  → 테스트에서 프레임워크 기능 테스트를 제거
  → 과도한 방어 코드를 정리

패턴 4: DAG Orchestration
  여러 claude -p를 병렬 실행 (Background Tasks 활용)
  → Task System(Ch05)의 DAG와 동일한 원리
  → 의존성 없는 작업은 동시 실행
  → 합류 지점에서 결과 통합
```

**De-Sloppify가 특히 중요하다.** "하지 마"라는 부정 지시는 효과가 낮다. 대신 구현 후 별도의 정리 에이전트를 돌리는 것이 더 깨끗한 결과를 낸다.

지민은 CI/CD 파이프라인에 자율 루프를 연결했다.
PR이 올라오면 Claude가 자동으로 리뷰하고, 간단한 수정은 직접 커밋까지 했다.

*"처음엔 내가 Claude의 손이었다. 이제 Claude가 밤 사이에도 혼자 일한다."*

---

<!-- section:reflection -->
## Harness 관점: Agent Loop의 궁극적 확장

```
Harness = Tools + Knowledge + Context + Permissions

Background Tasks는 Tools 레이어의 실행 방식을 확장했다:
  이전: 모든 도구가 블로킹으로 실행
  이후: I/O는 백그라운드, 추론은 전경

Context 오염도 줄었다:
  이전: 대기 중 상태가 Context에 축적
  이후: 완료된 결과만 Context에 진입
```

00에서 시작된 Agent Loop의 여정을 되돌아보면:

```
Agent Loop (Ch00):  Claude가 도구를 쓸 수 있게 됐다
  → Background Tasks (여기): I/O를 병렬화했다
  → Autonomous Loops:         사람이 루프 밖으로 나갔다
```

하지만 아직 해결 못 한 문제가 있었다.

---

## CLAUDE.md가 괴물이 되다

Background Tasks로 빌드, 설치, 테스트를 병렬 실행하면서 개발 속도가 빨라졌다.
프로젝트가 빠르게 성장했다. 파일이 50개에서 100개로 늘었다.

그런데 CLAUDE.md도 함께 자라고 있었다.

```
CLAUDE.md 3개월 전: 50줄 (프로젝트 개요 + 기술 스택)
CLAUDE.md 지금:    350줄 (코딩 스타일 + 보안 규칙 + 테스트 기준 +
                          Git 워크플로우 + 성능 가이드 + 에이전트 규칙 + ...)
```

지민이 Ctrl+F로 "보안 규칙"을 찾으려 했다. 350줄 파일을 스크롤하면서 생각했다.

*"이건... 관리가 안 되는데."*

그때 Slack 알림이 왔다. 새로 합류한 현우가 물었다:

> 현우: CLAUDE.md에 내 코딩 스타일 규칙도 추가해도 돼?

지민은 CLAUDE.md를 다시 열어봤다. 350줄. 현우의 규칙까지 추가하면 400줄.
그리고 Claude는 매 세션마다 **이 400줄을 전부** 컨텍스트에 올린다.

코드 리뷰할 때 배포 절차 2000 토큰은 필요 없는데.
커밋할 때 보안 가이드 1500 토큰은 필요 없는데.

**모든 규칙이 모든 작업에 항상 로드된다.**

→ **[Ch08. Rules — 350줄 괴물](./05-rules.md)**
