# CLAUDE.md — Claude를 위한 온보딩 문서

> **이전 이야기에서**: Agent Loop의 비밀을 이해했다.
> 30줄의 while 루프. Claude가 도구를 요청하고, 시스템이 실행하고, 결과를 돌려준다.
> 지민은 감탄했다. 하지만 새 대화를 시작하자마자 문제를 발견했다...

> Harness = Tools + **Knowledge** + Context + Permissions
>
> CLAUDE.md는 **Knowledge 레이어의 첫 번째 구현**이다.
> *"매번 설명하는 건 지쳤다"*

---

## 탄생 배경: "매일 출근하는 신입사원"

Agent Loop가 완성됐다. Claude는 이제 파일을 읽고, 코드를 실행하고, 결과를 보고 다음 행동을 결정할 수 있었다.

그런데 결정적인 문제가 있었다.

**Claude는 매 세션마다 빈 slate에서 시작했다.**

```
# Claude가 아는 것 (대화 시작 시)
- 일반적인 프로그래밍 지식 ✅
- 자신이 Claude라는 것 ✅
- 이 프로젝트가 뭔지 ❌
- 여기서 어떤 코딩 규칙을 쓰는지 ❌
- 어떤 스택인지 ❌
- 주의해야 할 것이 뭔지 ❌
```

Harness 관점에서 보면 이건 **Knowledge 레이어가 없는 Harness**다.

```
Claude Code (초기) = agent loop + tools
                   ← Knowledge 없음!
```

개발자들은 매번 직접 Knowledge를 주입해야 했다:

```
나: 우리 프로젝트는 Next.js 14, TypeScript, Tailwind야.
    테스트는 Vitest로 하고, pnpm이야.
    컴포넌트는 feature 폴더 아래 두는 구조야.
Claude: 알겠습니다!
(다음 날)
나: 버튼 컴포넌트 만들어줘
Claude: 어떤 스택을 쓰시나요?
나: ...
```

---

## 해결책: 자동 Knowledge 주입

Anthropic이 선택한 해결책은 우아하게 단순했다.

*"대화 시작 시 프로젝트 루트의 파일을 자동으로 읽어서 시스템 프롬프트에 주입한다."*

`CLAUDE.md`의 탄생.

```
Claude Code 기동 시:
1. 프로젝트 루트에서 CLAUDE.md 탐색
2. 파일 내용을 시스템 컨텍스트에 주입
3. Claude는 대화 시작 전 이미 프로젝트를 "안다"
```

```markdown
# My Project

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- Vitest for testing, pnpm as package manager

## Code Style
- Feature-based folder structure
- Functional components only, no default exports
```

이걸 한 번 써두면, 다시는 설명하지 않아도 된다.

---

## CLAUDE.md가 Harness에서 하는 일

```
Harness = Tools + Knowledge + Context + Permissions
                    ↑
              CLAUDE.md가 여기를 채운다
```

CLAUDE.md는 Claude Code Harness의 **항상 활성화된 Knowledge**다.

모든 대화에서, 모든 에이전트에게, 자동으로 주입된다.

Claude를 새 팀원이라고 생각해보자:
- 팀원이 매일 출근할 때마다 회사 소개를 다시 해야 하는가? → ❌ 비효율
- 입사 첫날 회사 온보딩 문서를 주고, 이후엔 안 해도 되는가? → ✅ CLAUDE.md

**CLAUDE.md는 Claude를 위한 온보딩 문서다.**

---

<!-- section:workshop -->
## CLAUDE.md의 계층 구조

시간이 지나면서 CLAUDE.md는 더 정교해졌다.
**어디에 두느냐**에 따라 적용 범위가 달라진다:

```
~/.claude/CLAUDE.md             ← 모든 프로젝트에 적용 (전역 지식)
~/projects/my-app/CLAUDE.md     ← 이 프로젝트에만 적용
~/projects/my-app/src/CLAUDE.md ← 이 폴더 안에서만 적용
```

모노레포에서 패키지마다 다른 규칙을 적용할 수 있게 됐다:
```
packages/
  frontend/CLAUDE.md   ← React + TypeScript 규칙
  backend/CLAUDE.md    ← Node.js + PostgreSQL 규칙
  shared/CLAUDE.md     ← 공통 규칙
```

---

## CLAUDE.md vs Rules: Knowledge의 진화

CLAUDE.md는 너무 인기가 많아졌다. 개발자들이 점점 더 많은 것을 넣기 시작했다.

```markdown
# My Project (CLAUDE.md 1년 후...)

## About... (10줄)
## Tech Stack... (15줄)
## Coding Rules... (50줄) ← 점점 커짐
## Testing Standards... (30줄) ← 더 커짐
## Security Guidelines... (40줄) ← 더욱 커짐
## Git Workflow... (30줄)
## Performance... (25줄)
...총 350줄
```

**Knowledge 레이어가 단일 파일로는 관리하기 어려워졌다.**

이것이 Rules 시스템 탄생의 씨앗이다.
Knowledge를 주제별로 나누고, Claude가 필요한 것만 로드하게 된다.

원칙:
- **CLAUDE.md**: "이 프로젝트가 뭔지" (짧게, 핵심만)
- **Rules**: "여기서 어떻게 일하는지" (주제별로 상세하게)

---

## 핵심 원칙

**CLAUDE.md는 Claude가 읽는 README다.**

사람이 읽는 README처럼 장황할 필요 없다.
Claude는 이미 프로그래밍을 알고, 일반적인 패턴을 안다.
**이 프로젝트만의 특수성**을 알려주면 된다.

```markdown
# 좋은 CLAUDE.md
이 프로젝트는 NextJS 14 App Router + Supabase 백엔드.
pnpm 사용. 에러는 항상 서버 로그 확인.
절대로 src/lib/auth.ts를 직접 수정하지 말 것 (레거시).

# 나쁜 CLAUDE.md (너무 장황함)
TypeScript는 마이크로소프트가 만든 JavaScript의 타입 안전 버전입니다.
이 언어는 2012년에 처음 출시되었으며...
```

---

## 콜드 스타트 해결: /init

CLAUDE.md를 쓰라는데, 처음엔 뭘 넣어야 할지 모른다.
**CLAUDE.md를 쓰려면 프로젝트를 알아야 하는데, Claude가 프로젝트를 알려면 CLAUDE.md가 필요하다.**

이 부트스트래핑 역설을 `/init`이 해결한다.

```
$ claude
나: /init

Claude: 프로젝트를 스캔합니다...
        package.json, tsconfig.json, .gitignore 분석 중...
        src/ 구조 파악 중...

        CLAUDE.md를 생성했습니다:
        - Tech Stack: Next.js 14, TypeScript, Tailwind
        - Package Manager: pnpm
        - Test Framework: Vitest
        - 주요 디렉토리 구조 포함
```

`/init`은 Claude가 프로젝트를 스캔하고 CLAUDE.md 초안을 자동 생성한다.
완벽하진 않지만, 빈 파일에서 시작하는 것보다 훨씬 낫다.
**초안을 만들고, 사람이 다듬는 것.** 이것이 올바른 워크플로우다.

---

## 좋은 지시의 문법: 프롬프팅 5패턴

CLAUDE.md, Rules, Skills, Agent 정의... 모두 Claude에게 주는 **지시**다.
좋은 지시와 나쁜 지시의 차이는 무엇인가?

```
5가지 패턴:

1. 구체적 요구사항    "Next.js 14 App Router, TypeScript strict mode"
                     (모호하게: "웹 프레임워크 사용")

2. 단계별 지시        "1. 먼저 타입 정의 2. API 라우트 구현 3. 테스트 작성"
                     (모호하게: "구현해줘")

3. 출력 형식 지정     "테스트를 포함해서", "주석 추가해서"
                     (모호하게: 형식 언급 안 함)

4. 컨텍스트 참조      "src/lib/auth.ts 참고해서", "@파일명"
                     (모호하게: "기존 코드 참고해서")

5. 금지 지시          "절대 src/legacy/ 수정 금지", "default export 사용 금지"
                     (모호하게: 금지 사항 언급 안 함)
```

이 5패턴은 CLAUDE.md에만 해당하는 게 아니다.
Rules 파일, Skill 정의, Agent description... 모든 곳에 적용되는 **지시의 공통 문법**이다.

```markdown
# 나쁜 Rules 파일
코드를 잘 짜세요.

# 좋은 Rules 파일 (5패턴 적용)
## 불변성 (CRITICAL)                          ← 구체적 요구사항
기존 객체를 변경하지 말고 새 객체를 반환       ← 단계별 지시
return { ...user, name: newName }             ← 출력 형식 (코드 예시)
src/lib/result.ts의 Ok/Err 패턴 참고          ← 컨텍스트 참조
절대 Array.prototype을 직접 수정하지 말 것     ← 금지 지시
```

---

> **⚠️ Warning:** CLAUDE.md가 200줄을 넘으면 Claude가 규칙을 무시하기 시작한다. 핵심만 남기고, 세부 사항은 Rules(Ch08)로 분리하라.

> **💬** "CLAUDE.md를 팀 전체가 공유하고, 매주 여러 번 업데이트하라. PR에 @claude를 태그하면 CLAUDE.md 업데이트도 PR에 포함시킨다." — Boris Cherny, Claude Code 창시자

---

#### 🔨 지금 해보세요

1. 프로젝트 루트에 `CLAUDE.md` 파일을 생성한다
2. 기술 스택(언어, 프레임워크)과 규칙 3가지를 작성한다
3. Claude Code 세션을 열어서 "이 프로젝트가 뭐야?" 물어본다
4. Claude가 CLAUDE.md 내용을 바탕으로 답하는지 확인한다

#### 🤔 뭐가 깨질까?

지민이 CLAUDE.md를 삭제하고 "인증 시스템 구현해줘"라고 시킨다. 무슨 일이 생길까?
Claude는 프로젝트의 기술 스택을 모른다. Express인지 Next.js인지, JWT인지 세션인지 — 추측으로 구현한다. 결과물이 프로젝트와 맞지 않아 처음부터 다시 해야 한다.

#### ✅ 이 유닛 후 할 수 있는 것

- [ ] CLAUDE.md를 작성하고 Claude가 자동으로 읽는지 확인
- [ ] 프로젝트 개요, 기술 스택, 핵심 규칙을 200줄 이내로 정리
- [ ] 새 세션에서 CLAUDE.md 없이 vs 있을 때의 차이를 설명

<!-- section:reflection -->
## 다음 이야기

CLAUDE.md로 Knowledge 레이어가 생겼다.
Claude가 프로젝트를 기억하게 됐고, 더 자신감 있게 행동하기 시작했다.

파일을 수정하고, 코드를 실행하고, 커맨드를 돌리고...

*"그런데 Claude가 어떤 행동을 할 때, 나도 뭔가 하고 싶다.
파일이 저장되면 자동으로 lint를 돌리고,
작업이 끝나면 알림 소리를 받고,
위험한 커맨드는 실행 전에 막고 싶다."*

이것이 Harness의 **Permissions 레이어**에 대한 수요였다.

→ **[Ch03. Hooks — 그날 밤에 일어난 일](./02-hooks.md)**
