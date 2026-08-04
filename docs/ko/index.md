---
layout: home

hero:
  name: fn-knock
  text: HomeLab을 위한 안전한 통합 게이트웨이
  tagline: NAS, 사진 라이브러리, 다운로드 도구와 자체 호스팅 서비스를 하나의 게이트웨이 뒤에 배치합니다. 공인 IP에서는 직접 연결하고, CGNAT 환경에서는 FRP 또는 Cloudflare Tunnel을 사용해 인증 후 서비스에 연결합니다.
  image:
    src: /logo.png
    alt: fn-knock
  actions:
    - theme: brand
      text: 배포 시작
      link: /ko/quick-start/deployment-options
    - theme: alt
      text: 공인 IP 배포
      link: /ko/quick-start/subdomain-mode
    - theme: alt
      text: CGNAT 배포
      link: /ko/quick-start/reverse-proxy-mode

features:
  - title: 여러 서비스를 연결하는 단일 게이트웨이
    details: NAS와 자체 호스팅 서비스를 개별 서브도메인으로 라우팅하고 로그인, TLS 및 접근 정책을 한곳에서 관리합니다.
    link: /ko/guide/subdomain-proxy
  - title: 서비스 연결 전 사용자 인증
    details: TOTP, 패스키, 비밀번호, 외부 IdP를 지원하며 세션, IP 허용 목록, WAF 및 요청 로그를 제공합니다.
    link: /ko/guide/auth
  - title: 장비와 네트워크 구성에 맞춘 배포
    details: fnOS, Docker, OpenWrt, Linux, macOS, Synology DSM, Windows에 배포하고 FRP 또는 Cloudflare Tunnel을 함께 사용할 수 있습니다.
    link: /ko/quick-start/deployment-options
---

## 최초 설정

아래 순서로 서비스 하나를 먼저 연결하고 전체 경로를 검증한 뒤 나머지 서비스를 등록합니다.

1. fnOS, Docker, OpenWrt, Linux, macOS, Synology DSM, Windows 중 환경을 선택하고 [설치 및 배포](/ko/quick-start/deployment-options)를 완료합니다.
2. 홈 네트워크 조건에 따라 [공인 IP 서브도메인 라우팅](/ko/quick-start/subdomain-mode) 또는 [FRP / Cloudflare Tunnel을 이용한 NAT 통과](/ko/quick-start/reverse-proxy-mode)를 선택합니다.
3. 인증을 설정합니다. [TOTP 인증기](/ko/guide/totp) 하나를 복구 수단으로 유지한 뒤 필요에 따라 패스키나 외부 IdP를 추가합니다.
4. 테스트 서비스를 하나 등록하고 [TLS 인증서](/ko/guide/ssl)를 설정한 다음 모바일 네트워크에서 로그인부터 서비스 접근까지 전체 흐름을 확인합니다.
5. 경로가 안정적으로 동작하면 [서비스 검색](/ko/guide/service-discovery)을 사용해 서비스를 추가하고 [fn-knock 설정 백업](/ko/guide/backup-and-restore)을 내보냅니다.

::: warning 게이트웨이 우회 경로 금지
fn-knock는 자신을 통과하는 트래픽만 보호할 수 있습니다. 라우터, 컨테이너 플랫폼 또는 클라우드 방화벽에서 NAS 관리 화면이나 서비스의 원본 포트를 계속 공개하면 해당 요청은 fn-knock 인증, WAF 및 요청 로그를 우회합니다.
:::

## 현재 환경에 맞춰 계속하기

- **아직 설치하지 않았거나 패키지를 선택하기 어렵다면:** [배포 및 접근 방식 선택](/ko/quick-start/deployment-options)부터 시작합니다.
- **공인 IPv4 또는 IPv6를 사용할 수 있다면:** 도메인을 fn-knock로 지정하고 [공인 IP 서브도메인 라우팅](/ko/quick-start/subdomain-mode)을 따릅니다.
- **CGNAT 환경이거나 ISP가 인바운드 연결을 차단한다면:** FRP 또는 Cloudflare Tunnel을 사용하고 [NAT 통과 가이드](/ko/quick-start/reverse-proxy-mode)를 따릅니다.
- **클라이언트가 서비스의 원본 포트로 연결해야 한다면:** 현재 플랫폼이 [원본 포트 직접 접근](/ko/quick-start/direct-mode)을 지원하는지 먼저 확인합니다.
- **로그인, TLS 또는 리버스 프록시가 동작하지 않는다면:** [자주 묻는 질문 및 문제 해결](/ko/faq)을 확인합니다.
- **업그레이드, 마이그레이션 또는 재설치를 준비한다면:** 먼저 [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)를 읽습니다.
