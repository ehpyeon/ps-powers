# Worktree Isolation — 각자의 방에서 일하다

> **이전 이야기에서**: 지민은 Agent Teams로 세 에이전트를 동시에 실행시켰다.
> backend-agent, frontend-agent, qa-agent. 론칭까지 이틀.
> 세 에이전트가 동시에 작업을 시작했다. 그리고 5분 후...

> Harness = Tools + Knowledge + **Context** + **Permissions**
>
> Worktree Isolation은 **Context를 파일시스템 레벨에서 격리**한다.
> *"Each works in its own directory, no interference"*

---

## "내 코드가 사라졌다"

론칭까지 이틀이었다.

지민은 Agent Teams(Ch10)를 써서 세 에이전트를 동시에 돌렸다.

```
backend-agent:  결제 API 구현 중 — src/auth/middleware.ts 수정
frontend-agent: 결제 UI 구현 중 — 별도 파일 작업
qa-agent:       인증 테스트 작성 중 — src/auth/middleware.ts 읽기 + 수정
```

5분 후 지민의 터미널에 이상한 메시지가 나타났다.

```
backend-agent: ✅ JWT 검증 로직 개선 완료. 파일 저장됨.
qa-agent:      ✅ 인증 테스트 추가 완료. 파일 저장됨.
```

둘 다 성공했다. 지민은 안심하고 결과를 확인했다.

`git diff`를 열었다. 그리고 얼어붙었다.

**backend-agent의 JWT 코드가 없었다.** qa-agent가 같은 파일을 나중에 저장하면서 덮어쓴 것이다.

```
시간순:
  10:00:00  backend-agent: middleware.ts 수정 (JWT 추가)
  10:00:03  qa-agent:      middleware.ts 수정 (테스트 헬퍼 추가)
  10:00:03  → qa-agent의 버전이 마지막 → backend의 변경 소실
```

**1시간 동안 작업한 JWT 코드가 사라졌다.** 론칭까지 이틀 남은 상황에서.

더 심각한 문제도 있었다:

```
backend-agent: git add src/auth/
qa-agent:      git add src/auth/   (동시에!)
→ 두 에이전트의 변경사항이 같은 스테이징에 섞임
→ 어떤 커밋이 어떤 에이전트의 것인지 분간 불가
```

현우가 옆에서 봤다. "그래서 내가 AI한테 맡기면 위험하다고 했잖아."

지민은 현우에게 대답하지 않았다. 머릿속에서 빠르게 생각했다.
*"에이전트가 서로 방해하지 않으려면... 같은 파일을 건드리면 안 된다.
아니, 더 근본적으로 — **같은 디렉토리에 있으면 안 된다.**"*

---

<!-- section:workshop -->
## Git Worktree: 같은 저장소, 다른 방

Git에는 이미 이 문제를 해결하는 기능이 있었다.

**git worktree**: 같은 저장소를 여러 디렉토리에서 동시에 체크아웃.

```
기존 (충돌):
  /project/                ← 모든 에이전트가 여기서 작업
    src/auth/middleware.ts  ← backend도 수정, qa도 수정... 💥

worktree 적용 후:
  /project/                          (main 브랜치)
  /project/.worktrees/agent-auth/    (feature/jwt 브랜치)
  /project/.worktrees/agent-qa/      (test/auth-tests 브랜치)
```

세 디렉토리가 **같은 git 저장소를 공유**하지만, 각각 **독립적인 파일**을 갖는다.

agent-auth가 `.worktrees/agent-auth/src/auth/middleware.ts`를 수정해도
agent-qa의 `.worktrees/agent-qa/src/auth/middleware.ts`에는 **아무 영향이 없다.**

물리적으로 다른 파일이기 때문이다.

지민은 처음에 믿기 어려웠다. "진짜 충돌이 안 나?"

진짜 안 난다. **각 에이전트에게 전용 방을 준 것이다.** 같은 건물(저장소)에 살지만, 방(worktree)은 따로다.

---

## Control Plane / Execution Plane

Worktree를 Task System(Ch08)과 연결하면 강력한 구조가 나온다:

```
Control Plane (.tasks/):
  공유 작업 보드 — 모든 에이전트가 읽고 쓸 수 있다
  → 작업 상태, 의존성, 담당자 정보
  → "누가 뭘 하고 있는지"의 단일 진실 원천

Execution Plane (.worktrees/):
  에이전트 전용 실행 공간 — 담당 에이전트만 접근
  → 실제 코드 수정
  → 다른 에이전트의 작업과 물리적으로 격리
```

Task와 Worktree가 바인딩된다:

```json
// .tasks/task_1.json
{
  "id": 1,
  "subject": "JWT 검증 로직 개선",
  "status": "in_progress",
  "owner": "agent-auth",
  "worktree": "agent-auth"    // ← 이 Task는 이 Worktree에서 실행
}
```

에이전트가 작업을 시작하면:
1. 새 git worktree 생성 → 독립 브랜치 체크아웃
2. Task JSON에 worktree 바인딩
3. 해당 worktree 안에서만 코드 수정
4. 작업 완료 → PR 또는 머지 → worktree 정리

---

## Claude Code에서의 구현

에이전트 정의 파일에 `isolation: worktree` 한 줄이면 된다:

```yaml
---
name: feature-implementer
description: 독립적인 기능 구현. 병렬 작업 시 파일 충돌 없음.
tools: ["Read", "Write", "Edit", "Bash"]
isolation: worktree    # ← 이 한 줄
---
```

이 에이전트를 실행하면 Claude Code가 자동으로:
1. 새 git worktree 생성
2. 해당 worktree 안에서 에이전트 실행
3. 변경사항 없으면 자동 정리
4. 변경사항 있으면 보존 (브랜치에 커밋)

### 안전 검증: .gitignore 필수

Worktree를 쓰기 전에 반드시 확인해야 할 것:

```bash
# .worktrees/가 gitignore에 있는지 확인
git check-ignore -q .worktrees 2>/dev/null
echo $?  # 0이면 OK, 1이면 추가 필요

# 없으면 먼저 추가
echo ".worktrees/" >> .gitignore
git add .gitignore && git commit -m "chore: worktree 디렉토리 gitignore 추가"
```

이걸 안 하면 worktree 내용이 실수로 저장소에 커밋될 수 있다. **항상 먼저 확인.**

### Hooks와의 연계

프로젝트의 `settings.json`에는 Worktree 생명주기 훅이 설정돼 있다:

```json
{ "event": "WorktreeCreate", "command": "python3 hooks.py", "async": true }
{ "event": "WorktreeRemove", "command": "python3 hooks.py", "async": true }
```

Worktree가 생성되면 소리가 나고, 제거되면 로그가 남는다.
Ch02(Hooks)의 Permissions 레이어가 여기서도 작동한다.

---

## Event Stream: 무슨 일이 있었는지 기록한다

Worktree와 Task가 바인딩되면 **라이프사이클**이 생긴다. 생성, 작업, 완료, 정리. 이 과정을 기록하지 않으면 "뭐가 언제 어떻게 됐는지" 추적할 수 없다.

```
events.jsonl — 라이프사이클 로그:

{"ts":"10:00:01","event":"worktree_create","agent":"backend-agent","branch":"feature/jwt","path":".worktrees/agent-auth"}
{"ts":"10:00:02","event":"task_bind","task_id":1,"worktree":"agent-auth"}
{"ts":"10:15:30","event":"task_complete","task_id":1,"agent":"backend-agent"}
{"ts":"10:15:31","event":"worktree_merge","branch":"feature/jwt","target":"main","conflicts":0}
{"ts":"10:15:32","event":"worktree_remove","path":".worktrees/agent-auth"}
```

모든 이벤트가 **append-only JSONL 파일**에 쌓인다. 삭제 없이 추가만 한다.

이 로그가 주는 것:
- **감사(Audit)**: 어떤 에이전트가 언제 무엇을 했는지
- **복구(Recovery)**: 충돌 시 마지막 정상 상태로 되돌리기
- **재현(Replay)**: 같은 시퀀스를 다시 실행하기

```bash
# 실시간 모니터링
tail -f .tasks/events.jsonl | jq '.'

# 특정 에이전트의 활동만 보기
cat .tasks/events.jsonl | jq 'select(.agent == "backend-agent")'
```

---

## 격리의 3계층

지민은 이 시점에서 큰 그림이 보이기 시작했다.

Ch04(Agents)에서 **메시지를 격리**했다. `messages=[]`로 시작해서 노이즈를 차단.
여기서 **파일을 격리**했다. git worktree로 충돌을 차단.
더 깊이 가면? **프로세스를 격리**한다. 컨테이너로 시스템 수준 위험을 차단.

```
격리의 3계층 — 같은 원칙, 다른 깊이:

1계층: 메시지 격리 (Ch04)
  messages=[] → 컨텍스트 오염 방지
  대상: Claude의 단기 기억

2계층: 파일 격리 (여기)
  git worktree → 파일 충돌 방지
  대상: 파일시스템

3계층: 프로세스 격리 (Container)
  Docker → 시스템 수준 안전
  대상: OS 프로세스, 네트워크 전체
```

```
Worktree가 막는 것:
  ✅ 다른 에이전트의 파일을 덮어쓰는 것
  ✅ git 스테이징/커밋 충돌

Worktree가 막지 못하는 것:
  ❌ rm -rf / (시스템 디렉토리 삭제)
  ❌ 무한 루프 프로세스 (CPU 점유)
```

정말 위험한 작업(야간 자율 실행, 신뢰할 수 없는 패키지 설치)은 컨테이너를 쓴다:

```bash
docker run -it -v $(pwd):/workspace anthropic/claude-code
# 컨테이너 안: 파일, 네트워크, 프로세스가 모두 격리
# 실패해도 호스트에 영향 없음
```

**세 계층 모두 같은 원칙: 최소 권한.** 에이전트에게 필요한 것만 주고, 나머지는 차단한다.

---

<!-- section:reflection -->
## 지민의 팀이 안전해지다

Worktree를 적용한 후:

```
backend-agent:  .worktrees/agent-auth/     에서 JWT 작업
frontend-agent: .worktrees/agent-frontend/  에서 UI 작업
qa-agent:       .worktrees/agent-qa/        에서 테스트 작업

결과:
  backend-agent: ✅ JWT 검증 완료 → feature/jwt 브랜치
  frontend-agent: ✅ 결제 UI 완료 → feature/payment-ui 브랜치
  qa-agent: ✅ 인증 테스트 완료 → test/auth-tests 브랜치

  세 브랜치를 main에 순서대로 머지.
  충돌? Git이 자동 해결하거나 지민이 리뷰.
```

1시간 전에 사라졌던 JWT 코드 같은 사고는 이제 **물리적으로 불가능**하다.

현우가 말했다. "...이건 인정한다."

---

## 론칭 전야, 마지막 문제

팀은 순조로웠다. 에이전트들이 각자의 worktree에서 충돌 없이 일했다.
론칭까지 하루.

그런데 지민이 새 세션을 열었을 때 Claude가 물었다.

```
Claude: 이 프로젝트에서 어떤 패키지 매니저를 사용하나요?
```

지민은 멈췄다. **어제 분명히 가르쳤다.** "pnpm 써." 그리고 Drizzle ORM을 쓴다는 것도, N+1 쿼리를 조심해야 한다는 것도.

하지만 세션이 바뀌면서 모든 것을 잊었다.

```
월요일: "pnpm 써야 해" → 학습 ✅
화요일: npm install [실패] → 또 가르쳐야 함
수요일: npm install [실패] → "진짜...?"
```

CLAUDE.md에 쓰면 되지 않느냐고? 이건 CLAUDE.md에 쓸 종류의 지식이 아니다.
이건 **에이전트가 일하면서 발견한 운영 지식**이다.
에이전트가 경험에서 배운 것. 사람이 사전에 알고 있던 게 아닌 것.

*"에이전트가 스스로 기억할 수 없을까? 세션이 끝나도 학습이 남는 방법이?"*

→ **[Ch14. Agent Memory — 드디어 경력사원이네](./12-agent-memory.md)**
