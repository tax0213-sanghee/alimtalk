# 세무사 알림톡 (alimtalk.kr)

세무사 사무소의 고객에게 **매주 세무일정 · 경영정보 알림톡을 자동으로 보내 주는 구독 서비스**.
운영자 한 명이 개발자 없이 직접 고쳐 나간다. 설명과 화면 문구는 쉬운 한국어로 쓴다.

> ★ **택스팟(taxpot)과는 별개 서비스다.** 택스팟 폴더 · 저장소 · Supabase · 환경 변수를 건드리지 않는다.
>   택스팟은 세무사가 건별로 결제하고 직접 보내는 알림톡, 이곳은 운영사가 매주 대신 보내고 월 정액으로 받는 알림톡이다.
>   화면 디자인(색 · 글꼴 · 부품 모양)만 택스팟을 따른다.

## 폴더 짜임

```
(저장소 맨 위)
├─ CLAUDE.md                  ← 이 파일 (배포되지 않음)
├─ 깃허브에_올리기.bat / 깃허브에서_받기.bat
└─ 알림톡홈페이지/             ← ★ Netlify Base directory. 여기 안의 것만 alimtalk.kr 에 올라간다
   ├─ index.html              랜딩 (헤더: 로그인 · 서비스 신청)
   ├─ login.html              로그인 ↔ 사무실 만들기(?mode=new) — 택스팟 로그인과 같은 짜임
   ├─ signup.html             /login?mode=new 로 넘겨 주기만 함
   ├─ app.html                세무사 관리센터 (/app) — 홈 · 주소록 · 템플릿 선택 · 카카오톡 전송 · 전송 결과 · 이용료/카드
   ├─ admin.html              운영사 관제탑 (/admin) — 서버가 비밀번호로 잠근다
   ├─ auth.js / auth.css      로그인 상태 · 로그인 화면 모양
   ├─ netlify.toml            주소(/login /app /admin), 함수 위치
   └─ netlify/
      ├─ functions/           서버 함수 (Node, .mjs) — 주소는 /api/...
      │  └─ nhn-check.mjs     NHN 연결 시험 (/api/nhn-check, 조회만)
      └─ edge-functions/
         └─ admin-gate.mjs    /admin 앞에서 ADMIN_PASSWORD 확인, 12시간 서명 쿠키(al_admin)
```

## 배포

- GitHub `main` 에 올리면 Netlify 가 저절로 alimtalk.kr 에 배포한다(Base directory = `알림톡홈페이지`, 빌드 명령 없음).
- 서버 함수가 생기거나 바뀌면 배포 요약에 "N functions deployed" 가 떠야 한다.

## 환경 변수 (Netlify 에만 둔다 — 코드 · 대화 · 커밋에 값을 절대 쓰지 않는다)

| 이름 | 쓰임 |
|---|---|
| `NHN_APPKEY` | NHN Cloud 알림톡 AppKey |
| `NHN_SECRET_KEY` | NHN Cloud 알림톡 Secret Key (`X-Secret-Key` 헤더) |
| `ADMIN_PASSWORD` | 관제탑 비밀번호. 바꾸면 모든 관제탑 로그인이 풀린다 |
| `NHN_SENDER_KEY` | (예정) 발신 프로필 **그룹** 키 — 그룹 템플릿 등록 · 발송에 쓴다 |

## NHN Cloud 알림톡 API (v2.3)

- 기본 주소 `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/{appkey}` , 헤더 `X-Secret-Key`
- 발송 `POST /messages` (예약은 `requestDate` "yyyy-MM-dd HH:mm", 60일까지) · 예약 취소 `DELETE /messages/{requestId}`
- 템플릿 `GET|POST /senders/{senderKey}/templates` · 수정 `PUT .../templates/{templateCode}` · 삭제 `DELETE ...`
- 결과 `GET /messages` , `GET /message-results` (startUpdateDate · endUpdateDate)
- 대체문자 `resendParameter` — 발신번호(`resendSendNo`)는 NHN SMS 에 등록된 번호여야 한다
- 안내서: https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-api-guide/
- 매주 바뀌는 일정은 **본문이 아니라 버튼 링크**에 담는다 — 본문을 통째로 변수로 두면 검수에서 반려되고, 매주 재검수하게 된다.

## 지금 상태와 다음 할 일

1. ✅ NHN 키 연결 확인 (`/api/nhn-check` → ok)
2. ✅ 관제탑 잠금 (edge-functions/admin-gate.mjs)
3. ⬜ 관제탑 › 알림톡 템플릿 — NHN 에서 실제 템플릿 · 검수 상태 불러오기 (`NHN_SENDER_KEY` 필요)
4. ⬜ 관제탑 › 카카오톡 전송 · 예약내역 · 전송내역을 실제 NHN 발송 · 결과로
5. ⬜ 진짜 로그인 · 자료 저장 — **택스팟과 다른 별도 Supabase 프로젝트**. 바꿀 곳은 auth.js 의 signUp · signIn · signOut
6. ⬜ 매주 자동 발송 (Netlify 예약 함수)
7. ⬜ 주소록 수 기준 월 자동결제 (토스페이먼츠 빌링)

★ app.html · admin.html 의 주소록 · 내역 · 결제 기록은 **예시 자료**다. 실제 자료로 바꾸기 전까지 고객에게 열지 않는다.

## 지킬 것

- 새 서버 함수는 관제탑 쿠키(`al_admin`)를 확인한 뒤에만 발송 · 예약 · 템플릿 변경을 한다 (admin-gate.mjs 의 validToken 과 같은 셈).
- 세무사 고객의 이름 · 번호는 화면 밖(로그 · 오류 메시지)에 남기지 않는다.
- 화면 문구는 세무사가 알아듣는 말로. 내부 이름(webhook, senderKey 등)을 화면에 띄우지 않는다.
- 한 번에 크게 바꾸지 말고, 바꾼 뒤 무엇을 확인하면 되는지 운영자에게 한 줄로 알려 준다.
