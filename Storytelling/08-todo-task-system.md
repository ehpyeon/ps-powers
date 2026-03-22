# TodoWrite & Task System — 계획 없는 에이전트는 표류한다

> **이전 이야기에서**: 지민은 Skills로 /commit, /deploy 같은 워크플로우를 패키징했다.
> 반복이 사라졌다. 하지만 결제 시스템처럼 10단계짜리 작업을 시키자
> Claude가 5단계에서 길을 잃기 시작했다...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Task System은 **Context를 외부화**해서 계획이 살아남게 한다.
> *"An agent without a plan drifts"*

---

## "어디까지 했어?"

소연이 슬랙에 메시지를 보냈다.

> 소연: 스프린트 리뷰 때 결제 시스템 데모 가능해? 2주 후야.

지민이 결제 시스템 구현을 요청했다.

```
지민: OAuth 2.0 + Stripe 결제 연동을 구현해줘
```

Claude가 작업을 시작했다. 1시간이 지났다.

```
지민: 어디까지 했어?
Claude: 음... 여러 작업을 진행했는데요...
        DB 스키마를 수정했고... 아, API 라우트도 만들었고...
        테스트도 좀 작성한 것 같은데... 정확히 어디까지인지는...
```

**1시간 동안 일했는데 진행 상황을 모른다.**

지민이 직접 파일을 확인해봤다. 1-3단계까지는 깔끔했다. 하지만 4단계부터 이상했다. 이미 완성한 DB 스키마를 다시 수정하고 있었다. 마치 길을 잃은 것처럼.

단순한 작업은 Skills로 충분했다. `/commit`, `/plan` — 몇 단계로 끝나는 것들.
하지만 실제 개발은 달랐다:

```
나: OAuth 2.0 로그인 시스템 구현해줘

Claude: 먼저 Google Developer Console에서 앱 등록...
        (1단계 완료)
        다음으로 NextAuth 설치...
        (2단계 완료)
        ...
        (30분 후)
나: 어디까지 했어?
Claude: 음... Google 앱은 등록했고, NextAuth도 설치했는데
        세션 미들웨어는 했는지 기억이 잘...
```

**10단계짜리 작업에서 에이전트는 길을 잃는다.**

핵심 통찰:
> *"On multi-step tasks, the model loses track. It repeats work, skips steps, or wanders off. A 10-step refactoring might complete steps 1-3, then the model starts improvising because it forgot steps 4-10."*

이유는 Agent Loop의 구조에 있다. 작업이 진행될수록 메시지 배열이 커진다.
초반에 세운 계획이 수십 개의 도구 결과 뒤로 밀려나면서 희미해진다.

---

## 해결책: 계획을 외부 도구로 만든다

핵심 통찰은 단순했다.

**계획을 Claude의 머릿속에 넣지 말고, 별도의 도구로 외부화한다.**

Agent Loop에 `todo` 도구를 추가하면:
```
메시지 배열 (계속 커짐):
  "이전 대화들..."
  "파일 읽기 결과들..."
  → 계획이 여기 묻혀있다면 잊혀진다

외부 TodoManager (항상 참조 가능):
  [ ] Google OAuth 앱 등록
  [>] NextAuth 설치 (현재 진행 중)
  [ ] 세션 미들웨어 구성
  [ ] 로그인 페이지 UI
  [ ] 테스트 작성
  → 몇 개의 결과가 쌓여도 이 목록은 사라지지 않는다
```

---

<!-- section:workshop -->
## TodoWrite: 세션 내 계획 관리

### 세 가지 상태와 하나의 핵심 제약

TodoWrite의 핵심은 단순하다. 세 상태와 하나의 엄격한 규칙:

```python
class TodoManager:
    def update(self, items: list) -> str:
        validated = []
        in_progress_count = 0

        for item in items:
            status = item.get("status", "pending")
            if status == "in_progress":
                in_progress_count += 1    # in_progress 개수 카운트
            validated.append({"id": item["id"], "text": item["text"],
                              "status": status})

        if in_progress_count > 1:
            raise ValueError("Only one task can be in_progress")  # ← 핵심 제약

        self.items = validated
        return self.render()
```

**왜 한 번에 하나만 `in_progress`인가?**

에이전트가 여러 작업을 동시에 "진행 중"으로 표시하면 실제로는 아무것도 진행하지 않는 상황이 생긴다. 한 번에 하나의 제약이 순차적 집중을 강제한다.

### 상태 흐름

```
pending   →   in_progress   →   completed
  [ ]              [>]              [x]

Google OAuth 앱 등록  [x]
NextAuth 설치        [>]   ← 지금 여기에 집중
세션 미들웨어         [ ]
로그인 페이지 UI      [ ]
테스트 작성          [ ]
```

### Nag Reminder: 기억을 강제하는 메커니즘

TodoWrite는 수동적이지 않다. 에이전트가 할 일 목록 업데이트를 잊으면 자동으로 상기시킨다:

```python
if rounds_since_todo >= 3 and messages:
    last = messages[-1]
    if last["role"] == "user" and isinstance(last.get("content"), list):
        last["content"].insert(0, {
            "type": "text",
            "text": "<reminder>Update your todos.</reminder>",  # ← 강제 주입
        })
```

3번의 도구 호출마다 "할 일 목록을 업데이트하세요" 알림이 Claude의 컨텍스트에 주입된다. 계획이 흐지부지되는 것을 시스템이 방지한다.

### Claude Code에서 TodoWrite

Claude Code에서 이 패턴은 `TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList` 도구로 구현됐다:

```
나: OAuth 로그인 전체 구현해줘

Claude: [TaskCreate: "Google OAuth 앱 등록", status: pending]
        [TaskCreate: "NextAuth 설치 및 설정", status: pending]
        [TaskCreate: "세션 미들웨어 구성", status: pending]
        [TaskCreate: "로그인 페이지 UI", status: pending]
        [TaskCreate: "통합 테스트 작성", status: pending]

        [TaskUpdate: "Google OAuth 앱 등록", status: in_progress]
        → Google Developer Console 접속...

        [TaskUpdate: "Google OAuth 앱 등록", status: completed]
        [TaskUpdate: "NextAuth 설치 및 설정", status: in_progress]
        → npm install next-auth...
```

이제 `/compact`가 실행돼도, 어디까지 했는지 Claude는 정확히 안다.

---

## Task System: 세션을 넘어선 영속 계획

TodoWrite는 강력하지만 한계가 있었다.

```
TodoManager의 한계:
- 메모리에만 존재 → /compact 후 사라짐
- 평면적 목록 → 의존성 표현 불가
- 단일 에이전트 → 병렬 작업 조율 불가
```

더 강력한 패턴도 존재한다.

### DAG (방향 비순환 그래프) Task System

실제 작업에는 순서가 있다. "DB 마이그레이션을 실행하기 전에 스키마 설계가 완료돼야 한다." 이런 의존성을 표현하는 구조:

```python
# 각 작업은 별도의 JSON 파일로 저장
# .tasks/task_1.json
{
  "id": 1,
  "subject": "DB 스키마 설계",
  "status": "completed",
  "blockedBy": [],      # 이 작업은 아무것도 기다리지 않는다
  "blocks": [2, 3],     # 2번, 3번이 이것을 기다린다
  "owner": ""
}

# .tasks/task_2.json
{
  "id": 2,
  "subject": "마이그레이션 스크립트 작성",
  "status": "pending",
  "blockedBy": [1],     # 1번이 완료돼야 시작 가능
  "blocks": [4],
  "owner": ""
}

# .tasks/task_3.json
{
  "id": 3,
  "subject": "API 엔드포인트 구현",
  "status": "pending",
  "blockedBy": [1],     # 역시 1번 완료 후
  "blocks": [4],
  "owner": ""
}

# .tasks/task_4.json
{
  "id": 4,
  "subject": "통합 테스트",
  "status": "blocked",
  "blockedBy": [2, 3],  # 2번, 3번 모두 완료돼야
  "blocks": [],
  "owner": ""
}
```

```
의존성 그래프:
         +---------+
    +--> | 작업 2  | --+
    |    +---------+   |
+------+               +--> +--------+
| 작업1|                    | 작업 4 |
+------+               +--> +--------+
    |    +---------+   |
    +--> | 작업 3  | --+
         +---------+

작업1 완료 → 작업2, 작업3이 동시에 unblocked
작업2, 작업3 완료 → 작업4가 unblocked
```

### 자동 의존성 해제

작업 완료 시 자동으로 의존하는 작업들이 unblocked된다:

```python
def _clear_dependency(self, completed_id: int):
    """완료된 작업 ID를 모든 blockedBy 목록에서 제거"""
    for f in self.dir.glob("task_*.json"):
        task = json.loads(f.read_text())
        if completed_id in task.get("blockedBy", []):
            task["blockedBy"].remove(completed_id)
            self._save(task)
            # blockedBy가 빈 목록이 되면 → 이 작업이 자동으로 ready 상태
```

**이게 Task System의 핵심이다.** 사람이 "이제 2번을 시작해도 돼"라고 지시할 필요가 없다. 1번 완료 → 시스템이 자동으로 2번, 3번을 ready 상태로 전환한다.

### 세 가지 질문에 언제나 답할 수 있다

```
지금 당장 시작할 수 있는 작업은?
  → status == "pending" AND blockedBy == []

기다리고 있는 작업은?
  → status == "pending" AND blockedBy != []

완료된 작업은?
  → status == "completed"
```

---

#### 🤔 뭐가 깨질까?

계획 없이 10단계 작업을 시킨다. 5단계 이후 무슨 일이 벌어질까?
Claude는 1-3단계를 잘 수행한다. 하지만 컨텍스트가 쌓이면서 초반 계획이 밀려나고, 5단계부터 즉흥적으로 행동한다. 이미 완료한 작업을 반복하거나, 남은 단계를 건너뛰거나, 원래 방향과 다른 길로 간다.

#### ✅ 이 유닛 후 할 수 있는 것

- [ ] TodoWrite로 작업 계획을 외부화
- [ ] blockedBy/blocks로 작업 의존성을 표현
- [ ] 계획 없이 작업할 때의 위험을 설명

## Harness 관점: Context가 외부화됐다

TodoWrite와 Task System은 Context 레이어에 근본적인 변화를 가져왔다:

```
Context 레이어의 진화:
  Before: 계획은 Claude의 메시지 배열 안에만 존재
           → /compact 후 사라짐
           → 오래된 내용에 묻혀 희미해짐

  After:  계획이 외부 파일로 외부화됨 (.tasks/)
           → /compact를 해도 살아남는다
           → 세션을 재시작해도 살아남는다
           → 여러 에이전트가 같은 Task System을 공유 가능
```

단순히 "메모 기능"이 생긴 게 아니다. Agent Loop의 Context 관리 방식이 바뀌었다.

```
s07부터 Task System은 후속 모든 개념의 조율 백본이 됐다:
  - s08 Background Tasks → 어떤 작업을 백그라운드로 실행할지
  - s09 Agent Teams → 팀원들이 공유하는 작업 보드
  - s11 Autonomous Agents → 팀원이 자동으로 작업 선택
  - s12 Worktree Isolation → 각 작업마다 독립 디렉토리 배정
```

---

## Verification Loop: 계획 실행의 완결

Task를 만들고, 실행하고, 완료로 표시했다.
**그런데 결과가 맞는지 어떻게 확인하나?**

```
Task: "JWT 인증 미들웨어 구현"
  상태: completed ✅
  ... 근데 진짜 작동하는 거 맞아?
```

Verification Loop는 **Write-Test-Verify-Fix** 사이클이다:

```
Write  → 코드 작성
Test   → 테스트 실행
Verify → 결과 확인
Fix    → 실패 시 수정
  ↓
다시 Test → 통과할 때까지 반복
```

Claude는 이 사이클을 **사람 개입 없이** 자율적으로 실행한다:

```
Claude:
  [Write] auth-middleware.ts 작성
  [Bash] npm test -- auth-middleware.test.ts
  [결과] 3/5 테스트 실패
  [Write] auth-middleware.ts 수정
  [Bash] npm test -- auth-middleware.test.ts
  [결과] 5/5 테스트 통과 ✅
  [TaskUpdate] status: completed
```

**TodoWrite/Task System과의 연계:**
각 Task의 완료 기준이 "테스트 통과"가 되면,
계획(Task) + 실행(Write) + 검증(Test) + 상태 추적(TodoWrite)이
하나의 **자율적 개발 사이클**을 형성한다.

이것이 Claude Code가 단순한 코드 생성기가 아니라 **자율적 개발 에이전트**인 이유다.

---

<!-- section:reflection -->
## Task System이 성숙하면서 생긴 문제

Task System으로 작업이 체계화됐다. 그런데 실제로 쓰다 보니 다른 문제가 생겼다.

복잡한 기능을 구현하다 보면 파일을 30개씩 읽고, 계획 세우는 데만 컨텍스트가 가득 찬다.

*"계획은 세웠는데... 파일 30개를 읽은 탐색 노이즈가 메인 컨텍스트를 가득 채웠다. 리뷰를 요청했더니 산만한 답이 돌아왔다."*

→ **[Ch06. Agents — 산만한 리뷰](./04-agents.md)**
