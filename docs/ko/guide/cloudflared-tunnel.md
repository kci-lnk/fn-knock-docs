---
lang: ko-KR
title: "cloudflared 기반 Cloudflare Tunnel"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: eec0d64b8afa9b973302d46c06e9eba28248e07035de9d98c29f37c41e520c0e
---

# cloudflared 기반 Cloudflare Tunnel

cloudflared는 LAN에서 Cloudflare Tunnel로 아웃바운드 연결을 만들고 공개 호스트 이름(Public Hostname)으로 들어온 요청을 fn-knock 게이트웨이에 전달합니다. fn-knock는 cloudflared 실행 리소스, 터널 토큰, 전송 프로토콜 및 프로세스만 관리합니다. 도메인과 오리진 `Service`는 계속 Cloudflare 대시보드에서 설정합니다.

새로 배포할 때는 `리버스 프록시 모드 → 서브도메인 매핑`을 사용합니다. Cloudflare가 Host를 유지한 채 전달하면 fn-knock가 Host에 따라 요청을 분배합니다. 경로 모드는 기존 단일 도메인 경로 엔드포인트와의 호환 용도로만 사용합니다.

Synology DSM 7 SPK는 Cloudflared 내장 리소스, 토큰 및 프로세스 관리를 제공합니다. Windows x86_64에서는 이러한 기능을 제공하지 않으므로 이 페이지의 시스템 설정 절차를 적용할 수 없습니다. 같은 Windows 호스트에서 Cloudflared를 직접 실행한다면 Service를 `http://127.0.0.1:7999`로 지정할 수 있지만 프로세스, 로그 및 업데이트도 직접 관리합니다.

## 1. 리소스 및 터널 준비

1. `시스템 설정 → Cloudflared`에서 리소스를 다운로드하고 상태가 준비 완료인지 확인합니다.
2. [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)를 열고 `Networks → Tunnels`로 이동합니다.
3. 새 Cloudflared Tunnel을 만들고 설치 페이지에서 `--token` 뒤에 있는 긴 문자열을 복사합니다.
4. `리버스 프록시 모드 → Cloudflared`로 돌아가 토큰을 붙여넣습니다. 전체 설치 명령을 붙여넣어도 페이지에서 토큰 추출을 시도합니다.
5. 전송 프로토콜은 `자동`을 우선 사용합니다. 먼저 QUIC를 시도하고 실패하면 HTTP/2로 전환합니다. UDP `7844`가 명확하게 차단된 경우에만 HTTP/2로 고정합니다.
6. 저장하고 시작한 뒤 상태와 로그에 Tunnel이 연결된 것으로 표시되는지 확인합니다.

토큰은 터널 접근 자격 증명입니다. 비밀번호처럼 보관하고 스크린샷이나 공개 로그에 넣지 않습니다.

## 2. Host 라우트 설정

먼저 fn-knock에 루트 도메인, 인증 서비스 및 서비스 Host를 저장합니다. 예:

```text
auth.example.com  -> 인증 서비스
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

그런 다음 터널의 공개 호스트 이름을 다음과 같이 설정합니다.

```text
Public Hostname  *.example.com
Service          http://127.0.0.1:7999
```

실제 게이트웨이 포트가 `7999`가 아니라면 관리 화면에 표시된 포트를 사용합니다. 와일드카드 공개 호스트 이름은 각 서비스 Host를 같은 게이트웨이로 전달하고, 구체적인 서비스는 로컬 Host 매핑에서 결정합니다.

Cloudflared 터널이 Cloudflare와 LAN 사이의 전송을 이미 보호한다면 로컬 오리진은 HTTP를 우선 사용하는 것이 가장 간단합니다. HTTPS 오리진이 필요할 때만 다음 절에 따라 인증서를 설정합니다.

## 3. HTTPS 오리진

게이트웨이에서 HTTPS를 활성화했다면 Service를 다음과 같이 입력할 수 있습니다.

```text
https://localhost:7999
```

Cloudflared는 오리진 인증서를 검증합니다. 자체 서명 인증서를 사용하거나 인증서에 `localhost`가 포함되지 않았다면 로그에 다음 메시지가 나타날 수 있습니다.

```text
certificate is valid for nas.example.com, not localhost
```

이는 터널이 오리진에는 도달했지만 검증하는 호스트 이름과 인증서가 일치하지 않는다는 뜻입니다. 다음 방법 중 하나를 선택합니다.

- Origin Server Name을 인증서가 포함하는 도메인으로 설정합니다.
- 위험을 명확히 이해하고 받아들일 수 있을 때만 해당 오리진의 TLS 검증을 끕니다.
- `http://127.0.0.1:7999`로 되돌리고 외부 HTTPS는 Cloudflare에서 처리합니다.

검증을 끄는 것을 인증서 수정이라고 표현하면 안 됩니다. 이는 검증을 중단할 뿐입니다. 인증서 관리 방법은 [SSL 인증서](/ko/guide/ssl)를 참고합니다.

## 경로 모드 호환 설정

`https://home.example.com/alist` 같은 기존 URL이 있다면 `리버스 프록시 모드 → 경로 모드`에서 공개 호스트 이름 하나를 그대로 사용할 수 있습니다.

```text
Public Hostname  home.example.com
Service          http://127.0.0.1:7999
```

Cloudflare는 요청을 게이트웨이까지 전달하기만 하고 경로 분기는 계속 fn-knock에서 처리합니다. Cloudflare와 fn-knock 양쪽에 서로 덮어쓰는 경로 재작성 규칙을 따로 관리하지 않습니다.

## 클라이언트 IP와 `local_exempt`

로그인과 허용 목록은 게이트웨이가 식별한 클라이언트 IP를 기준으로 판단합니다. 사설망, 루프백 및 링크 로컬 출발지는 `local_exempt`로 처리되어 일반 로그인과 기존의 엄격한 허용 목록 검사를 건너뜁니다.

Cloudflared가 같은 호스트의 게이트웨이에 연결하면 연결 자체는 루프백 주소에서 들어옵니다. 따라서 리버스 프록시 서브도메인 경로에서는 Cloudflare가 전달한 방문자 정보를 올바르게 사용합니다. 설정 후 모바일 네트워크에서 접속하고 fn-knock 요청 로그에 `127.0.0.1`이나 컨테이너 주소가 아닌 방문자의 공인 IP가 기록되는지 확인합니다. EdgeOne / ESA 클라이언트 IP 옵션은 Cloudflared에 적용되지 않습니다.

## 플랫폼별 제한

- Cloudflared는 아웃바운드 프로세스이므로 fn-knock가 호스트 방화벽을 관리할 필요가 없으며 Docker에서도 사용할 수 있습니다.
- 실행 플랫폼의 아키텍처와 일치하는 Cloudflared 리소스가 필요합니다. 리소스 페이지가 준비되지 않았다면 토큰을 저장해도 시작할 수 없습니다.
- Docker에서 `127.0.0.1`은 현재 컨테이너만 가리킵니다. Cloudflared를 별도 컨테이너로 실행한다면 Service를 fn-knock 컨테이너의 서비스 이름과 포트로 변경합니다.
- Synology DSM 7 SPK는 내장 Cloudflared를 지원합니다. DSM 데스크톱의 패키지 진입점에서 관리 페이지를 열고 실제 게이트웨이 포트 `7999`를 오리진으로 사용합니다.
- Windows는 내장 Cloudflared 리소스 페이지를 제공하지 않으며 별도로 실행하는 클라이언트는 fn-knock에서 관리하지 않습니다.
- fn-knock는 Cloudflare DNS, Tunnel, Public Hostname, 캐시 규칙 또는 Origin Request 설정을 생성하지 않습니다.

## 문제 해결

1. **프로세스가 시작되지 않음**: 리소스 상태, 토큰 및 전송 프로토콜 로그를 확인합니다.
2. **Tunnel은 온라인이지만 도메인에 접속할 수 없음**: Public Hostname, DNS 및 Service의 실제 포트를 확인합니다.
3. **TLS 오류가 반환됨**: 오리진 프로토콜, 인증서 신뢰 및 Origin Server Name을 확인합니다.
4. **인증 Host는 열리지만 서비스 Host에서 404가 반환됨**: 와일드카드 Public Hostname을 사용하고 요청 Host가 로컬 매핑에 있는지 확인합니다.
5. **모든 접속이 같은 출발지로 표시됨**: 요청 로그의 클라이언트 IP를 확인한 뒤 Cloudflare에서 게이트웨이까지 출발지 정보가 전달되는 과정을 점검합니다.
6. **페이지는 열리지만 리소스가 실패함**: WebSocket이 비활성화되지 않았는지 확인합니다. 경로 모드에서는 접두사 제거와 HTML 재작성도 점검합니다.

전체 실행 상태는 [터널](/ko/guide/tunnel), 전체 예시는 [리버스 프록시 접속 튜토리얼](/ko/tutorials/reverse-proxy-with-fknock)을 참고합니다.
