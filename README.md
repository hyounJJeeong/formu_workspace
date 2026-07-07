# FÓRMU Work Space

효운 · 가희 공동 작업 공간. React + Supabase + Vercel로 만든 실제 배포 가능한 웹앱(PWA)입니다.
디자인(색상·폰트·레이아웃)은 원본 HTML 프로토타입 그대로 유지했습니다.

## 포함된 기능
- ✅ 로그인 (Supabase Auth, 이메일 매직 링크 — 비밀번호 불필요)
- ✅ 공동 작업 (같은 workspace_id를 공유하는 두 계정)
- ✅ 자동 저장 (모든 변경사항이 즉시 Supabase에 저장됨)
- ✅ 실시간 동기화 (Supabase Realtime — 상대방이 추가한 항목이 바로 보임)
- ✅ 카카오 공유 (딥링크 방식 — 원본과 동일. 공식 SDK는 별도 신청 필요, 아래 참고)
- ✅ Pinterest 보드 임베드
- ✅ Google Calendar 연동 ("Google 캘린더에 추가" 버튼 — OAuth 없이 바로 작동)
- ✅ 파일 업로드 (Supabase Storage, 자료 탭에서 파일 첨부)
- ✅ 댓글 (할일/목표/일정/자료 각 항목에 댓글 스레드)
- ✅ 알림 (브라우저 Notification API, 탭을 열어둔 동안 작동)
- ✅ 모바일 최적화 (반응형 레이아웃)
- ✅ PWA (홈 화면에 앱처럼 설치 가능)

---

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. 왼쪽 메뉴 **SQL Editor** → New query에서 `supabase/schema.sql` 파일 내용을 전체 붙여넣고 실행합니다.
   - 마지막 줄 `insert into workspaces ...` 실행 결과로 나온 **id 값을 복사**해두세요. (`.env`에 필요합니다)
3. **Database → Replication**에서 아래 테이블의 실시간 동기화를 켭니다:
   `tasks`, `okrs`, `key_results`, `events`, `notes`, `comments`, `workspace_members`
4. **Storage**에서 새 버킷을 만듭니다: 이름 `attachments`, Private로 설정.
   - Storage → Policies에서 아래와 같은 정책을 추가하세요 (업로드/다운로드 허용):
     ```
     bucket_id = 'attachments'
     ```
     (2인용 워크스페이스이므로 간단히 인증된 사용자 전체 허용 정책으로 시작해도 무방합니다. 더 엄격하게 하려면 폴더명이 workspace id와 일치하는지 확인하는 정책을 사용하세요.)
5. **Authentication → Providers**에서 Email(매직 링크)이 켜져 있는지 확인합니다 (기본값으로 켜져 있음).
6. **Project Settings → API**에서 `Project URL`과 `anon public` 키를 복사해둡니다.

## 2. 로컬에서 실행하기

```bash
npm install
cp .env.example .env
# .env를 열어 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_WORKSPACE_ID 채우기
npm run dev
```

브라우저에서 두 사람이 각자 자기 이메일로 로그인한 뒤, 상단의 "효운" 또는 "가희" 이름 칩을 눌러 자리를 하나씩 선택하면 됩니다 (한 사람당 한 자리).

## 3. Vercel에 배포하기

1. 이 프로젝트를 GitHub 저장소에 올립니다.
2. [vercel.com](https://vercel.com) 에서 New Project → 해당 저장소 선택.
3. Environment Variables에 `.env`와 동일하게 3개 값을 등록합니다.
4. Deploy 클릭. 완료되면 `https://your-project.vercel.app` 같은 주소가 생깁니다.
5. Supabase **Authentication → URL Configuration**의 Redirect URLs에 이 Vercel 주소를 추가하세요 (매직 링크가 정상 작동하려면 필요).

## 4. 홈 화면에 앱처럼 설치하기 (PWA)

- 아이폰 Safari: 공유 버튼 → "홈 화면에 추가"
- 안드로이드 Chrome: 메뉴 → "홈 화면에 추가" / 자동으로 뜨는 설치 배너 사용

## 알아둘 점 (완전한 통합을 위한 다음 단계)

- **카카오 공유**: 지금은 원본과 동일하게 `kakaotalk://` 딥링크 + 클립보드 복사 방식입니다. 공식 카카오톡 공유 SDK(말풍선 카드 형태)를 쓰려면 [Kakao Developers](https://developers.kakao.com)에서 앱을 만들고, 배포 도메인을 등록한 뒤 JavaScript 키를 발급받아야 합니다. 발급받으면 알려주시면 연동 코드를 추가해드릴 수 있어요.
- **Google Calendar**: 지금은 "이 이벤트를 내 캘린더에 추가" 링크 방식(설정 불필요, 바로 작동)입니다. 두 사람의 캘린더를 자동으로 양방향 동기화하려면 Google Cloud Console에서 OAuth 클라이언트를 만들고 Supabase Edge Function으로 토큰을 교환하는 백엔드 작업이 추가로 필요합니다.
- **푸시 알림**: 지금은 탭을 열어둔 브라우저에서만 작동하는 알림입니다. 앱이 꺼져 있어도 오는 진짜 푸시 알림을 원하면 서비스 워커에 Web Push(VAPID 키) 로직을 추가해야 합니다.

## 프로젝트 구조

```
src/
  components/       화면별 React 컴포넌트
  hooks/            Supabase 데이터 fetch + realtime 구독
  lib/              Supabase 클라이언트, 유틸 함수
supabase/
  schema.sql        테이블 + RLS 정책 (Supabase SQL Editor에서 실행)
public/
  manifest.json     PWA 설치 정보
  sw.js             서비스 워커 (오프라인 셸 캐싱)
```
