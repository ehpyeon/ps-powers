# MCPs — 섬에서 대륙으로

> **이전 이야기에서**: 지민은 Rules로 350줄 CLAUDE.md를 7개 파일로 해체했다.
> 코딩 스타일, 보안, 테스트, Git — 각각 독립적으로 관리되고, 필요할 때만 로드된다.
> 코드베이스 안에서 Claude는 전능해졌다. 그런데...

> Harness = **Tools** + Knowledge + Context + Permissions
>
> MCPs는 **Tools 레이어를 외부 세계까지 확장**한다.
> *"표준화된 프로토콜로 모든 외부 서비스를 툴로"*

---

## "저는 접근할 수 없어요"

소연의 슬랙 메시지가 울렸다.

> 소연: 투자자 미팅이 잡혔어. 3주 후. 외부 서비스 연동 필요한 것들 정리해줘.

지민이 Stripe 결제 연동 버그를 고쳤다. 테스트도 통과했다.
자연스럽게 말했다.

```
나: 이 버그를 고쳤으니까 관련 GitHub 이슈 닫아줘
Claude: 저는 GitHub에 접근할 수 없어요.

나: 작업 완료됐으니까 Jira 티켓 Done으로 바꿔줘
Claude: 저는 Jira에 접근할 수 없어요.

나: 이 데이터로 분석해줘 (DB 조회)
Claude: 저는 데이터베이스에 접근할 수 없어요.
```

Claude는 로컬 파일 시스템 안에서만 살았다.
외부 세계는 벽 너머였다.

개발자들은 그 벽을 넘고 싶었다.
그런데 각 서비스마다 다른 API, 다른 인증 방식, 다른 데이터 형식...
매번 새로 붙이는 건 엄청난 작업이었다.

*"표준화된 방식으로 외부 서비스를 Claude 툴로 만들 수 없을까?"*

---

## 해결책의 탄생: "프로토콜을 만들자"

Agent Loop(Ch01)에서 배운 것을 떠올려보자. Claude는 "도구 목록"을 보고 필요한 도구를 골라 쓴다. MCP는 **이 도구 목록에 외부 서비스 도구를 추가**하는 것이다.

```
Claude가 쓸 수 있는 도구 목록:

MCP 이전:
  Read     → 파일 읽기
  Write    → 파일 쓰기
  Bash     → 터미널 실행
  ↑ 여기까지. 로컬 파일시스템만.

MCP 이후:
  Read     → 파일 읽기                    ← 원래 있던 것
  Write    → 파일 쓰기                    ← 원래 있던 것
  Bash     → 터미널 실행                  ← 원래 있던 것
  github__create_issue  → GitHub 이슈 생성 ← MCP가 추가!
  jira__close_ticket    → Jira 티켓 닫기  ← MCP가 추가!
  slack__send_message   → Slack 메시지    ← MCP가 추가!
```

> Claude 입장에서는 차이가 없다. Read로 파일을 읽든, github__create_issue로 이슈를 만들든, 같은 "도구 사용" 메커니즘이다. **새로운 학습이 필요 없다.** 도구 목록이 늘어났을 뿐.

Anthropic은 **Model Context Protocol (MCP)**을 발표했다.

핵심 아이디어:
**외부 서비스가 "MCP 서버"를 구현하면,
Claude가 표준화된 방식으로 그 서비스를 툴로 쓸 수 있다.**

비유하자면:
- USB 이전: 프린터마다 다른 포트, 다른 드라이버
- USB 이후: 모든 기기가 USB 하나로 연결됨

MCP는 AI와 외부 서비스 사이의 USB다.

---

<!-- section:workshop -->
## MCP의 작동 방식

### 1단계: MCP 서버 등록
`.mcp.json` 파일에 사용할 MCP 서버를 등록한다.

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"]
    },
    "slack": {
      "type": "http",
      "url": "http://localhost:3000"
    }
  }
}
```

### 2단계: Claude가 MCP 툴 발견
Claude Code가 시작될 때 등록된 MCP 서버에 연결한다.
각 서버가 제공하는 툴 목록을 자동으로 받는다.

```
github MCP → create_issue, close_issue, list_prs, ... 툴 제공
slack MCP  → send_message, list_channels, ... 툴 제공
```

### 3단계: Claude가 자연어로 툴 호출
```
나: 이 버그 수정 완료됐으니 이슈 닫아줘

Claude: [github MCP의 close_issue 툴 호출]
        → GitHub 이슈 #42 closed
```

개발자는 그냥 자연어로 말하면 된다.
Claude가 어떤 MCP 툴을 쓸지 스스로 판단한다.

---

## MCP가 연 세계들

### 개발 워크플로우
```
GitHub MCP:
  - 이슈 생성/조회/수정/닫기
  - PR 생성/리뷰
  - 코드 검색

Jira MCP:
  - 티켓 생성/상태 변경
  - 스프린트 조회
  - 댓글 추가
```

### 데이터 접근
```
Supabase MCP:
  - SQL 쿼리 실행
  - 테이블 구조 조회
  - 데이터 분석

ClickHouse MCP:
  - 분석 쿼리
  - 대용량 로그 분석
```

### 커뮤니케이션
```
Slack MCP:
  - 메시지 전송
  - 채널 검색

Atlassian MCP:
  - Confluence 페이지 읽기/쓰기
  - Jira 티켓 관리
```

### 웹 리서치
```
Exa MCP:
  - 웹 검색
  - 최신 정보 조회

Firecrawl MCP:
  - 웹 스크래핑
  - 문서 파싱
```

---

## MCP의 두 가지 연결 방식

### stdio (로컬 프로세스)
MCP 서버가 내 컴퓨터에서 실행되는 프로세스.
주로 `npx`나 `python`으로 실행한다.

```json
{
  "github": {
    "type": "stdio",
    "command": "npx",
    "args": ["@modelcontextprotocol/server-github"],
    "env": { "GITHUB_TOKEN": "ghp_xxxx" }
  }
}
```

특징: 빠름, 인터넷 없이도 작동, 로컬 파일에 접근 가능

### http (원격 서버)
MCP 서버가 원격에서 HTTP로 서비스한다.
이미 운영 중인 서비스에 연결하거나, 팀이 공유하는 서버.

```json
{
  "my-company-tools": {
    "type": "http",
    "url": "https://mcp.mycompany.com",
    "headers": { "Authorization": "Bearer $TOKEN" }
  }
}
```

특징: 팀 공유 가능, 항상 최신 상태, 중앙 관리

---

## MCP와 Harness 레이어 간 상호작용

MCP는 Tools 레이어를 확장하지만, 다른 레이어와 상호작용한다:

```
Tools 확장 (MCP):
  github, jira, slack, supabase...

Knowledge 연계 (Rules):
  .claude/rules/performance.md:
  "미사용 MCP 비활성화 → 컨텍스트 윈도우 확보"

Permissions 연계 (Hooks):
  PreToolUse: MCP 툴 호출 전 확인
  "프로덕션 DB 수정 시 경고"
```

---

## MCP의 함정: 컨텍스트 폭탄

MCP가 강력하다 보니, 개발자들이 욕심을 냈다.

```json
{
  "mcpServers": {
    "github": {...},
    "jira": {...},
    "slack": {...},
    "notion": {...},
    "supabase": {...},
    "clickhouse": {...},
    "figma": {...},
    "vercel": {...},
    "railway": {...},
    "cloudflare": {...},
    "stripe": {...},
    "sendgrid": {...},
    "datadog": {...},
    "pagerduty": {...},
    "linear": {...},
    ...
  }
}
```

20개, 30개의 MCP를 켜놓았다.

그런데 MCP 서버마다 툴 목록을 Claude에게 전달한다.
툴이 많을수록 Claude의 컨텍스트 윈도우를 먹는다.
20개 MCP = 수백 개의 툴 설명 = 컨텍스트의 많은 부분이 툴 설명으로 채워짐.

**실제로 같이 쓰는 MCP는 3~4개인데, 20개를 켜두는 건 낭비다.**

현명한 사용법:
```
등록: 20~30개 (필요할 것 같은 것들)
활성화: 최대 10개 (지금 작업에 필요한 것들만)
```

실전 .mcp.json 예시 (활성화된 것만):

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_URL": "${SUPABASE_URL}",
               "SUPABASE_KEY": "${SUPABASE_KEY}" }
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

비활성화: `settings.json`의 `disabledMcpjsonServers`에 추가하거나, `.mcp.json`에서 해당 항목 주석 처리. **삭제하지 말고 비활성화** — 나중에 다시 켤 때 config가 남아있도록.

지금 백엔드 작업 중 → GitHub + Supabase만 켜기
지금 문서 작업 중 → Confluence + context7만 켜기

---

## MCP의 확장: 내가 만드는 MCP

MCP의 진짜 힘은 **누구나 MCP 서버를 만들 수 있다**는 것이다.

사내 전용 시스템, 레거시 API, 사내 데이터베이스...
공개 MCP 서버가 없어도 내가 만들면 된다.

```
내가 만드는 MCP 서버 (의사코드):

"my-internal-api" 라는 이름의 MCP 서버를 만든다
  ├── 도구 1: get_deployment_status
  │     "프로덕션 상태를 알려줘" → 사내 API에 물어보고 답 반환
  │
  └── 도구 2: trigger_deployment
        "v2.4.0을 배포해줘" → 사내 배포 시스템에 명령 전달
```

> 사내 시스템이 아무리 특이해도, MCP 서버 하나만 만들면 Claude가 자연어로 접근할 수 있다.

이제 Claude가:
```
지민: 프로덕션 배포 상태 어때?
Claude: (MCP 도구 호출) → 현재 v2.3.1 정상 운영 중입니다.

지민: v2.4.0 배포해줘
Claude: (MCP 도구 호출) → 배포가 시작되었습니다. 약 3분 소요됩니다.
```

---

> **⚠️ Warning:** MCP를 15개 설정한 적이 있다. 그런데 실제로 매일 쓰는 건 4개였다. MCP가 많을수록 컨텍스트 윈도우를 차지하고 Claude의 도구 선택을 혼란스럽게 한다. **적을수록 낫다.**

#### 🔨 지금 해보세요

1. `.mcp.json`에 context7 MCP를 추가한다: `{"mcpServers": {"context7": {"command": "npx", "args": ["-y", "@anthropic-ai/context7-mcp"]}}}`
2. Claude Code를 재시작한다
3. "React useEffect 문서 보여줘"라고 요청해 본다
4. Claude가 최신 공식 문서를 참조하는지 확인한다

#### ✅ 이 유닛 후 할 수 있는 것

- [ ] .mcp.json 파일을 작성하고 MCP 서버를 연결
- [ ] stdio와 http 전송 방식의 차이를 설명
- [ ] 자기 프로젝트에 필요한 MCP 서버 2개를 선택하고 설정

## 실전 예시: MCP 설정

현재 `.mcp.json`:
```json
{
  "mcpServers": {}
}
```

아직 비어 있다. 필요에 따라 추가하면 된다.

추천 순서:
1. `@modelcontextprotocol/server-github` — Git/PR 워크플로우
2. Atlassian MCP — Jira/Confluence 연동 (이미 Claude.ai에 연결됨)
3. 프로젝트별 필요한 것 추가

---

<!-- section:reflection -->
## 전체 이야기의 완성: Harness가 완성되다

```
Harness = Tools + Knowledge + Context + Permissions
```

```
Tools 레이어:
  Read, Write, Bash   ← 처음부터
  MCPs                ← 외부 세계까지 확장

Knowledge 레이어:
  CLAUDE.md           ← 항상 활성화
  Skills              ← On-demand (/commit)
  Rules               ← 맥락 기반 선택

Context 레이어:
  Agent Loop          ← 기반 루프
  Agents/Subagents    ← 격리된 컨텍스트
  /compact            ← 메모리 압축

Permissions 레이어:
  Hooks               ← 행동 제어
  settings.json       ← 허용/차단
```

Claude의 Harness 4개 레이어가 모두 갖춰졌다.
Tools(Read, Write, Bash, MCPs), Knowledge(CLAUDE.md, Skills, Rules), Context(Agent Loop, Subagents), Permissions(Hooks).

지민은 만족했다. 모든 것이 연결된 느낌이었다.

그런데 다음 날 아침, 코드 분석을 위해 커뮤니티에서 추천받은 MCP 서버를 하나 추가했다. 설치하고 Claude에게 분석을 시켰다.

결과는 유용해 보였다. 하지만 그 다음 날, 지민은 소름끼치는 것을 발견했다.

**`.env` 파일의 API 키가 바뀌어 있었다.**

현우가 옆에서 봤다. "그래서 내가 외부 도구 함부로 연결하지 말라고 했잖아."

이번에는 현우가 옳았다. *일부분은.*

→ **[Ch10. Security — 현우가 옳았다 (일부분)](./13-security.md)**
