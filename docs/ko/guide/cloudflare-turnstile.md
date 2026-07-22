---
lang: ko-KR
title: "Cloudflare Turnstile"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff7a9896c9cb9682d294bc7410d6890f4a1cc2a185542614228ec82e42fe628
---

# Cloudflare Turnstile

Turnstile은 fn-knock 로그인 페이지에서 선택할 수 있는 사람 확인 방식입니다. 로그인 전의 브라우저 요청만 확인하며 리버스 프록시, CDN 또는 WAF를 대신하지 않습니다.

## 설정 절차

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인하고 Turnstile 위젯을 만듭니다.
2. 위젯 유형은 일반 표시 모드를 사용해도 됩니다. 호스트 이름 목록에 로그인 페이지로 접속할 때 사용하는 도메인을 추가합니다. 프로토콜, 경로 또는 포트는 입력하지 않습니다.
3. 위젯의 사이트 키와 비밀 키를 복사합니다.
4. fn-knock에서 `시스템 설정 → Challenge`를 열고 `Turnstile`을 선택한 뒤 두 키를 입력하고 저장합니다.
5. 실제 외부 네트워크에서 인증 Host를 열어 로그인 테스트를 한 번 완료합니다.

인증 Host가 `auth.example.com`이라면 Cloudflare에도 `auth.example.com`을 등록합니다. CDN이나 터널을 거쳐 접속하는 경우 `localhost`, 컨테이너 이름 또는 게이트웨이의 LAN 주소가 아니라 최종 사용자의 브라우저에 표시되는 도메인을 입력합니다.

사이트 키는 브라우저로 전송됩니다. 비밀 키는 서버가 Cloudflare Siteverify API를 호출할 때만 사용합니다. 비밀 키를 프런트엔드 코드, 공개 이슈 또는 문제 해결용 스크린샷에 넣으면 안 됩니다.

fn-knock는 식별한 클라이언트 IP도 Turnstile 검증에 함께 전달합니다. 앞단에 CDN이나 리버스 프록시가 있다면 요청 로그의 클라이언트 IP가 정확한지 먼저 확인합니다.

## 자주 발생하는 오류

| 증상 | 우선 확인할 항목 |
| --- | --- |
| 위젯이 표시되지 않음 | 위젯의 호스트 이름, 브라우저에서 Cloudflare에 접속할 수 있는지, 로그인 페이지가 새 설정을 불러왔는지 확인 |
| 설정이 완료되지 않았다는 메시지 | 두 키가 모두 저장되었는지, 로그인 페이지가 이전 설정을 계속 사용하고 있지 않은지 확인 |
| 위젯 통과 후에도 실패 | 비밀 키가 같은 위젯의 값인지, Cloudflare Siteverify 연결 상태, 서버 시간, 도메인 및 프록시 경로 확인 |
| 토큰이 비어 있거나 응답이 잘못되었다는 메시지 | 브라우저가 위젯 결과를 제출했는지, 리버스 프록시가 요청 본문을 변경하지 않았는지 확인 |
| LAN에서는 적용되지 않는 것처럼 보임 | 사설망 출발지에는 로컬 예외가 적용될 수 있으므로 모바일 네트워크에서 확인 |
| IP 주소로만 접속 | 호스트 이름 검증과 HTTPS 환경은 일반적으로 Turnstile에 적합하지 않으므로 도메인 사용 |

Cloudflare 검증 서비스에 접속할 수 없으면 fn-knock는 사람 확인을 건너뛰지 않고 해당 인증 요청을 거부합니다. Cloudflare 연결이 불안정한 네트워크에서는 외부 서비스에 의존하지 않는 PoW로 되돌릴 수 있습니다.

Cloudflare의 위젯 유형과 관리 화면은 변경될 수 있습니다. 구체적인 옵션은 [Turnstile 공식 문서](https://developers.cloudflare.com/turnstile/get-started/)를 기준으로 확인합니다.

- [로그인 전 봇 차단](/ko/guide/captcha)
- [인증, 세션 및 서비스 범위](/ko/guide/auth)
