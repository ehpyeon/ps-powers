# Agent Teams — 혼자서는 안 된다

> **이전 이야기에서**: 지민은 /compact로 컨텍스트를 관리하고, HANDOFF.md로 세션을 넘기는 법을 배웠다.
> 단일 에이전트의 메모리 문제는 해결됐다.
> 하지만 론칭까지 3일 남았다. 프론트엔드, 백엔드, 테스트. 한 에이전트로는 시간이 부족했다...

> Harness = Tools + Knowledge + **Context** + Permissions
>
> Agent Teams는 **Context를 수평으로 확장**한다.
> *"When the task is too big for one, delegate to teammates"*

---

## 금요일 데모까지 3일

소연이 Slack에 메시지를 보냈다.

> 소연: 금요일 투자자 데모 확정. 결제 시스템 전체가 동작해야 해.

지민은 남은 작업을 정리했다.

```
남은 일:
  □ Stripe webhook handler (백엔드)    — 4시간
  □ 결제 UI 컴포넌트 (프론트엔드)      — 3시간
  □ 결제 플로우 E2E 테스트             — 2시간 (위 둘 완료 후)
  □ 에러 핸들링 + 로깅                 — 2시간
  □ 배포 + 모니터링 설정               — 1시간

총 필요 시간: ~12시간
실제 남은 시간: 3일... 하지만 다른 기능도 있다.
```

문제는 이것이었다. **Claude는 한 번에 하나만 할 수 있다.**

Subagent(Ch04)를 쓰면? 부모가 기다려야 한다. 수직적 구조. 코드 리뷰를 맡길 수는 있지만, **프론트엔드와 백엔드를 동시에 구현하게 할 수는 없다.**

Background Tasks(Ch09)를 쓰면? I/O만 병렬화된다. `npm install`은 뒤에서 돌리면서 코드를 쓸 수 있지만, **LLM 추론 자체는 여전히 하나.**

지민에게 필요한 건 **동시에 생각하는 여러 Claude**였다.

---

## Subagent와 Teammate의 차이

Ch04에서 배운 Subagent를 다시 떠올려보자:

```
Subagent (수직적):
  지민 → Claude(부모) → code-reviewer(자식)
  부모가 기다린다. 자식이 끝나면 요약만 받는다.
  자식은 일회용. 태어나서 일하고 사라진다.

Teammate (수평적):
  오케스트레이터
    ├── backend-agent (독립적으로 실행)
    ├── frontend-agent (독립적으로 실행)
    └── qa-agent (독립적으로 실행)
  아무도 기다리지 않는다. 각자 자기 일을 한다.
  팀원은 상주한다. 여러 작업을 순회한다.
```

**Subagent는 일회용 전문가.** 물어보면 답하고 사라진다.
**Teammate는 상주 팀원.** 출근해서 작업 보드를 확인하고, 일을 찾고, 할 일이 없으면 기다린다.

---

## Task Board: 08에서 배운 그것

Agent Teams의 "작업 보드"는 Ch08에서 배운 **Task System 그 자체**다.

```
Ch08 (혼자):
  지민 → Claude → .tasks/task_*.json (혼자 읽고 쓰기)

Ch10 (팀):
  오케스트레이터 ─┬── .tasks/task_*.json ── 공유 작업 보드
  backend-agent ──┤   (모든 에이전트가 접근)
  frontend-agent ─┤
  qa-agent ───────┘
```

같은 `.tasks/` 인프라. 같은 `blockedBy`/`blocks` DAG. 차이는 여러 에이전트가 **동시에 접근**한다는 것.

---

<!-- section:workshop -->
## Message Bus: 편지함

팀이 생기면 소통이 필요하다. 하지만 에이전트들은 **서로의 컨텍스트를 볼 수 없다.** (그것이 Context Isolation의 목적이니까.)

해결책: 파일 기반 편지함.

```
.team/
  config.json           ← 팀원 목록과 상태
  inbox/
    backend-agent.jsonl  ← 백엔드 에이전트의 편지함
    frontend-agent.jsonl ← 프론트엔드 에이전트의 편지함
    lead.jsonl           ← 오케스트레이터의 편지함
```

작동 방식은 실제 회사 메일함과 동일하다:

```
편지함 비유:

보내기:
  오케스트레이터 → backend-agent에게 편지 보냄
  → backend-agent.jsonl 파일에 한 줄 추가됨
  → 쌓기만 한다 (삭제 안 함)

읽기:
  backend-agent가 편지함을 열어봄
  → 쌓인 편지를 전부 읽음
  → 읽은 편지는 편지함에서 제거 (같은 편지를 두 번 읽지 않도록)
  → 이것을 "drain-on-read"라고 부른다 (읽으면서 비우기)
```

> Ch09의 BackgroundManager에서 배운 "진동벨" 패턴과 같은 원리다. 쌓아두고, 확인할 때 한 번에 수거.

각 에이전트는 매번 생각하기 전에 편지함을 확인한다:

```
에이전트의 매 반복:
  1. "새 편지 있어?" → 편지함 확인
  2. 편지가 있으면 → 내용을 읽고 고려
  3. Claude가 판단 → 다음 행동 결정
  4. 작업 완료 → 1번으로 돌아감
```

---

## Teammate의 생명주기

Subagent는 단순했다: 일이 주어지면 하고, 끝나면 사라진다. 아르바이트처럼.

Teammate는 다르다. **정규직처럼 출근하고, 할 일을 찾고, 없으면 기다리다가 퇴근한다.**

```
Teammate의 하루 (비유):

출근 (spawn)
  → "오늘 할 일이 뭐지?" → 작업 시작 (WORKING)
  → 작업 완료 → "다른 할 일 있나?" (IDLE)
  → 편지함에 새 지시 도착 → 다시 작업 (WORKING)
  → 작업 완료 → "다른 할 일 있나?" (IDLE)
  → 1분 동안 할 일이 없음... → 퇴근 (SHUTDOWN)
```

```
실제 흐름:

오케스트레이터: "backend-agent, 결제 API 구현해"
→ backend-agent: WORKING 🔨 (구현 중...)
→ backend-agent: IDLE 💤    (완료, 다음 지시 대기)
→ (편지함에 새 메시지!)
→ backend-agent: WORKING 🔨 (새 작업 시작)
→ backend-agent: IDLE 💤    (완료)
→ (60초 동안 편지 없음... 작업 보드도 비어있음...)
→ backend-agent: SHUTDOWN 🚪 (자동 퇴근)
```

IDLE 상태에서 에이전트는 **5초마다** 두 가지를 확인한다. 마치 스마트폰을 5초마다 확인하듯:

```
IDLE 상태의 에이전트 (의사코드):

5초마다 반복 (최대 60초 = 12회):
  1. "편지 왔어?" → 편지함 확인
     → 왔으면 → 읽고 → WORKING으로! (일 시작)

  2. "작업 보드에 미할당 작업 있어?" → 보드 스캔
     → 조건: 아직 시작 안 됨 + 담당자 없음 + 차단 안 됨
     → 있으면 → 내가 가져감 (atomic claim) → WORKING으로!

  3. 둘 다 없으면 → 5초 더 기다림...

12회 반복해도 할 일이 없으면 → SHUTDOWN (퇴근)
```

> **"Atomic claim"이란?** 두 에이전트가 동시에 같은 작업을 가져가면 안 된다. 마치 회의실 예약처럼 — 먼저 예약한 사람이 가져간다. 시스템이 "이 작업은 이미 다른 에이전트가 가져갔어"라고 알려준다.

**스스로 일을 찾는 에이전트.** 리더가 10개의 할 일을 하나하나 지시할 필요 없다. 에이전트가 알아서 작업 보드를 스캔하고 미할당 작업을 가져간다.

---

## Team Protocols: 위험한 작업 전에 묻는다

지민은 팀을 돌리면서 불안한 순간이 있었다.

```
backend-agent: "레거시 테이블을 삭제하고 새 스키마로 마이그레이션하겠습니다."
```

지민: "잠깐, 그건 프로덕션 DB인데...!"

팀에는 프로토콜이 필요하다. **위험한 작업 전에 승인을 받는 절차.** 실생활에서 "이거 해도 될까요?"라고 먼저 물어보는 것과 같다.

```
승인 프로토콜 (비유: 결재 시스템):

팀원 → 리더:
  "이 작업을 하려고 합니다: 레거시 테이블 삭제 후 새 테이블 생성"
  "위험도: 높음 ⚠️"
  → 편지함으로 승인 요청 전송

리더 → 팀원:
  "거절합니다. 테이블 직접 삭제는 위험해요.
   마이그레이션 스크립트를 먼저 만드세요."
  → 편지함으로 거절 응답

팀원:
  → 거절을 받았으므로 원래 계획 취소
  → 마이그레이션 스크립트 방식으로 변경
```

> 이 "요청→승인/거절" 패턴은 회사의 결재 시스템과 동일하다. 위험한 일은 먼저 물어보고, 허락받은 후에 실행한다.

같은 패턴으로 **종료 프로토콜**도 작동한다:

```
리더 → 팀원: "작업 마무리하고 종료해줘" (shutdown_request)
팀원 → 리더: "현재 작업 완료 후 종료하겠습니다" (shutdown_response)
→ 진행 중인 작업이 반쪽짜리로 남지 않는다
```

---

## /compact 후 "나는 누구인가?"

장시간 작업 후 에이전트의 컨텍스트가 압축되면 재미있는 문제가 생긴다.

```
/compact 전: "나는 backend-agent이고, 결제 API를 담당하고 있다"
/compact 후: "..."  (정체성 정보가 압축으로 사라짐)
```

해결: 컨텍스트가 짧아지면 정체성을 자동으로 재주입한다:

```python
if len(messages) <= 3:  # 압축 발생으로 판단
    messages.insert(0, {"role": "user",
        "content": f"<identity>You are '{name}', role: {role}. "
                   f"Continue your work.</identity>"})
```

에이전트가 "나는 누구인가"를 잊지 않는다.

---

## 지민의 팀이 움직이다

지민은 Claude Code의 실험적 Agent Teams를 켰다:

```bash
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude
```

```
지민: 결제 시스템 전체를 구현해줘

오케스트레이터:
  작업 분해:
  [TaskCreate: "Stripe webhook handler", pending]
  [TaskCreate: "결제 UI 컴포넌트", pending]
  [TaskCreate: "결제 플로우 E2E 테스트", pending, blockedBy: [1,2]]

  [병렬 dispatch]:
  → backend-agent: "task 1 — webhook handler 구현"
  → frontend-agent: "task 2 — 결제 UI 구현"
  (두 에이전트 동시 실행)

  (완료 알림 수신)
  → qa-agent: "task 3 — E2E 테스트" (1, 2 완료됨)
```

tmux로 세 pane을 열어서 실시간으로 관찰했다:

```bash
tmux new-session -d -s team
tmux send-keys 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude' Enter
tmux split-window -h
tmux send-keys 'tail -f .tasks/events.jsonl | jq .' Enter
tmux split-window -v
tmux send-keys 'watch -n 2 "cat .tasks/task_*.json | jq .status"' Enter
tmux attach -t team
```

세 에이전트가 각자 일하고 있었다. 서로의 존재를 모른 채, 편지함과 작업 보드만으로 조율하면서.

12시간 분의 일이 4시간 만에 끝났다.

소연에게 Slack을 보냈다. "데모 준비 완료될 것 같습니다."

---

## Autonomous Agents: 스스로 일을 찾는 팀원

지민은 팀이 안정되자 한 단계 더 나아갔다.

처음에는 오케스트레이터가 모든 작업을 할당했다. "backend-agent, 이거 해" → "frontend-agent, 저거 해." 하지만 작업이 20개가 넘어가자 오케스트레이터가 병목이 됐다.

*"팀원이 스스로 작업 보드를 보고 일을 가져가면 안 될까?"*

IDLE 상태의 에이전트가 **자율적으로 작업을 스캔하고 가져가는 패턴**이다:

```
Autonomous Agent의 Idle Cycle:

5초마다 반복 (최대 60초 = 12회):

  1. "편지함에 새 지시 있어?" → 편지함 확인
     → 있으면 → 읽고 → WORKING 상태로 전환

  2. "작업 보드에 미할당 작업 있어?" → Task Board 스캔
     → 조건: status == "pending"
             AND owner == null
             AND blockedBy가 모두 완료됨
     → 있으면 → Atomic Claim (내가 가져감) → WORKING

  3. 둘 다 없으면 → 5초 더 기다림...

12회 반복해도 할 일이 없으면 → SHUTDOWN (자동 퇴근)
```

이 패턴이 중요한 이유: **스케일**. 오케스트레이터가 10명의 팀원에게 일일이 지시할 필요 없이, 작업 보드에 작업을 올리면 팀원들이 알아서 가져간다.

### Request-Response 프로토콜

자율적으로 움직이는 팀원이 위험한 작업을 하려 할 때는 어떻게 할까?

**구조화된 요청-응답** 패턴으로 해결한다:

```
프로토콜 흐름 (상태머신):

  [요청]                    [응답]
  ┌────────────┐           ┌────────────┐
  │ request_id │──────────→│ request_id │ (같은 ID로 매칭)
  │ type: plan │           │ decision:  │
  │ content:   │           │  approved  │
  │  "DB 삭제" │           │  OR        │
  └────────────┘           │  rejected  │
                           │ reason:    │
                           │  "..."     │
                           └────────────┘

상태 전이:
  pending → approved  (실행 허가)
  pending → rejected  (계획 변경 필요)
```

같은 FSM으로 여러 프로토콜을 구현할 수 있다:
- **Plan approval**: "이 계획대로 진행해도 될까요?"
- **Shutdown**: "작업 마무리하고 종료해주세요"
- **Review**: "이 코드를 리뷰해주세요"

모두 `request_id`로 연결되는 요청-응답 쌍이다.

---

> **💬** "tmux와 worktree를 조합해서 5개 Claude를 동시에 돌려라. 각 터미널 탭에서 독립적으로 작업하면서 작업 보드로 조율한다." — Boris Cherny, Claude Code 창시자

<!-- section:reflection -->
## Harness 관점: Context Isolation의 진화

```
Ch04 (Subagent): 수직적 격리
  부모 → 자식 (깨끗한 컨텍스트)
  자식 → 부모 (요약 반환)
  부모가 기다린다.

Ch10 (Agent Teams): 수평적 격리
  에이전트A ──┐
  에이전트B ──┼── 공유 Task Board + Message Bus
  에이전트C ──┘
  아무도 기다리지 않는다. 각자 독립 컨텍스트.
```

---

## "내 코드가 사라졌다"

팀이 잘 돌아갔다. 하지만 다음 날 아침, 지민이 결과를 확인하다가 소름이 끼쳤다.

backend-agent가 수정한 `src/auth/middleware.ts`의 JWT 코드가 없었다.
qa-agent가 같은 파일을 테스트 헬퍼 추가하면서 **덮어쓴 것이다.**

```
10:00:00  backend-agent: middleware.ts 수정 (JWT 추가)
10:00:03  qa-agent:      middleware.ts 수정 (헬퍼 추가)
→ qa-agent 버전이 마지막 저장 → backend의 변경 소실 💥
```

1시간 작업이 사라졌다. 론칭까지 이틀.

*"팀이 같은 파일을 동시에 건드리면 안 된다.
아니, 더 근본적으로 — 같은 디렉토리에 있으면 안 된다."*

→ **[Ch13. Worktree Isolation — 내 코드가 사라졌다](./11-worktree-isolation.md)**
