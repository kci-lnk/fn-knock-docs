---
lang: ko-KR
title: "배포 및 접근 방식 선택"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 864d6c653b9a318f10adffa3005157d2a80b7718d3631dfff494c19b2e608c48
---

# 배포 및 접근 방식 선택

fn-knock를 배포할 때는 프로그램을 어디에서 실행할지, 외부 트래픽을 게이트웨이까지 어떻게 전달할지, 게이트웨이가 요청을 대상 서비스로 어떻게 넘길지를 차례로 결정합니다. 마지막으로 접근 정책을 통해 어떤 요청을 허용할지 정합니다.

fn-knock는 외부 엔드포인트를 한곳으로 모으고 서비스 앞단에 인증을 적용하지만, 시스템 업데이트, 백업, 최소 권한, 업스트림 서비스 자체의 보안 설정을 대신하지는 않습니다.

## 배포 방식 선택

| 배포 방식 | 관리 엔드포인트 | 기본 게이트웨이 엔드포인트 | 적합한 환경 | 주요 제한 |
| --- | --- | --- | --- | --- |
| fnOS 네이티브 FPK | fnOS 바탕화면의 `Knock` 아이콘(로컬 CGI가 백엔드 `7998`로 전달) | `7999` | 호스트 기능을 온전히 사용하려는 fnOS 기기 | `7998`은 관리 백엔드이며 인터넷 공개 또는 브라우저용 관리 엔드포인트가 아님 |
| Docker Compose | `7991` | `7999` | NAS, 홈랩 서버 또는 일반 Docker 호스트 | 직접 연결 모드, 호스트 방화벽 관리, 자동 HTTPS, SSH 보안, Smart Connect, 웹 터미널 미지원 |
| OpenWrt 패키지 | `서비스 → Knock`; 기본 포트 `7991` | `7999` | 메인 라우터, x86 소프트 라우터 또는 보조 게이트웨이 | 자동 HTTPS, SSH 보안, 웹 터미널, 웹 관리 패널 FPK 업데이트 미지원. Smart Connect는 기존 `dnsmasq` 구성에 의존 |
| [Linux(systemd / OpenRC)](/ko/quick-start/linux-deployment) | `7991` | `7999` | 일반 Linux 서버, VPS 또는 직접 관리하는 호스트 | root 권한과 실행 중인 systemd 또는 OpenRC가 필요하며, 호스트 방화벽은 관리자가 직접 관리 |
| [Synology DSM 7 x86_64 / ARM SPK](/ko/quick-start/synology-deployment) | DSM 바탕화면의 패키지 엔드포인트 | `7999` | Intel/AMD/ARM CPU를 사용하는 DSM 7 NAS | 직접 연결, 호스트 방화벽 관리, Smart Connect, 웹 터미널, SSH 보안 미지원. 패키지 센터에서 업데이트 |
| [Windows x86_64](/ko/quick-start/windows-deployment) | 관리 프로그램이 로컬 `127.0.0.1:7991`을 엶 | `7999`, 기본적으로 모든 인터페이스에서 수신 | Windows 서비스와 로컬 트레이 관리 프로그램이 필요한 환경 | 방화벽과 NAT를 별도로 구성해야 함. 직접 연결 접근 허용, 내장 FRP/Cloudflared, Smart Connect, 웹 터미널, SSH 보안 미지원 |

Docker, OpenWrt, Linux, Windows의 관리 엔드포인트에는 별도의 패널 비밀번호를 설정합니다. 이 비밀번호는 관리 패널을 보호하며, 게이트웨이 엔드포인트에서 사용하는 TOTP, 사용자 이름과 비밀번호 또는 패스키와는 별개의 자격 증명입니다.

설치 문서:

- fnOS 네이티브 FPK: [설치 및 처음 접속하기](/ko/quick-start/install-and-first-login)
- Docker: [Docker 배포](/ko/quick-start/docker-deployment)
- OpenWrt: [OpenWrt 배포](/ko/quick-start/openwrt-deployment)
- Linux: [Linux 배포(systemd / OpenRC)](/ko/quick-start/linux-deployment)
- Synology: [Synology DSM 7 배포](/ko/quick-start/synology-deployment)
- Windows: [Windows x86_64 배포](/ko/quick-start/windows-deployment)

### 설치 패키지 출처 및 무결성 확인

[fn-knock 공식 사이트](https://www.fnknock.cn/)에서 해당 플랫폼의 다운로드 페이지로 이동합니다. 공식 릴리스에는 다음 검증 정보가 함께 제공됩니다.

- [`release-manifest.json`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/release-manifest.json): 버전, 프로젝트 소스 커밋, Go 게이트웨이 커밋, 플랫폼, 아키텍처, 파일 크기, SHA-256을 기록합니다.
- [`SHA256SUMS`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/SHA256SUMS): GitHub 릴리스의 설치 패키지를 검증할 때 사용합니다.
- Docker 멀티 아키텍처 이미지의 SBOM과 빌드 출처 정보(provenance).

설치 패키지를 오프라인으로 받거나 다른 저장소를 거쳐 옮겼다면 설치 전에 SHA-256을 다시 계산하여 공식 릴리스 매니페스트와 비교합니다. 체크섬은 파일이 릴리스 목록과 일치한다는 사실만 증명합니다. 플랫폼과 CPU 아키텍처가 맞는지도 별도로 확인합니다.

다음 순서로 검증합니다.

1. 공식 사이트에서 해당 GitHub 릴리스로 이동합니다. 채팅방, 파일 공유 사이트, 검색 결과에 있는 이름만 같은 파일을 사용하지 않습니다.
2. `release-manifest.json`에서 파일명이 완전히 같은 항목을 찾아 릴리스 버전, 플랫폼, 아키텍처, 파일 크기를 확인합니다.
3. 로컬 파일의 SHA-256을 계산합니다.

   ```bash
   # sha256sum을 제공하는 Linux, OpenWrt 또는 기타 시스템
   sha256sum <설치 패키지 파일명>

   # macOS
   shasum -a 256 <설치 패키지 파일명>
   ```

   Windows PowerShell에서는 다음 명령을 사용합니다.

   ```powershell
   (Get-FileHash -LiteralPath '<설치 패키지 파일명>' -Algorithm SHA256).Hash
   ```

4. 계산 결과를 매니페스트 항목의 `sha256` 또는 `SHA256SUMS`의 같은 파일명 항목과 한 글자씩 비교합니다. 일치하지 않으면 설치를 중단하고 다시 다운로드합니다.
5. 빌드 출처까지 감사한다면 설치 패키지의 GitHub 빌드 증명(provenance)이 공식 저장소에서 생성되었는지 확인합니다. Docker는 매니페스트의 멀티 아키텍처 이미지 다이제스트, SBOM 및 빌드 증명도 함께 검증할 수 있습니다. 특정 버전을 고정 배포할 때는 다이제스트를 사용하여 이후 `latest` 변경의 영향을 차단합니다.

`release-manifest.json`에는 관리 서비스 소스 커밋과 Go 게이트웨이 커밋도 기록되어 있어 설치 패키지를 두 코드베이스까지 추적할 수 있습니다. SHA-256 문자열 하나만 따로 확보해서는 배포자의 신원을 증명할 수 없습니다. 매니페스트, 체크섬 파일 및 빌드 출처 역시 공식 릴리스에서 받습니다.

## 네트워크 토폴로지 선택

### 공인 IP 직접 연결

도메인이 홈랩의 공인 IPv4/IPv6 주소를 직접 가리키게 하거나, 라우터에서 공인 포트를 fn-knock 게이트웨이 엔드포인트로 포워딩합니다.

다음 조건이 필요합니다.

- 외부 네트워크에서 홈랩 엔드포인트에 도달할 수 있음
- 사용할 도메인을 준비함
- 라우터, 방화벽, ISP가 필요한 포트를 차단하지 않음

웹 서비스에는 [공인 IP 직접 연결: 서브도메인 라우팅](/ko/quick-start/subdomain-mode)을 사용합니다. 서비스의 원본 포트로 계속 접속해야 할 때만 [원본 포트: 직접 연결 접근 허용](/ko/quick-start/direct-mode)을 사용합니다.

### FRP 또는 Cloudflared 터널

외부 요청이 먼저 FRP 서버나 Cloudflare로 들어간 뒤 터널을 통해 fn-knock 게이트웨이 엔드포인트로 돌아옵니다. 가정 회선에 외부에서 접속 가능한 공인 IP가 없어도 됩니다.

새 웹 서비스를 구성할 때는 다음 값을 기본으로 사용합니다.

- 실행 모드: `리버스 프록시 모드`
- 라우팅 방식: `서브도메인 매핑`

전체 절차는 [NAT 통과: 서브도메인 라우팅](/ko/quick-start/reverse-proxy-mode)을 참고합니다.

### EdgeOne 또는 ESA를 앞단에 배치

EdgeOne, ESA 같은 엣지 플랫폼은 인터넷에서 표준 `80/443` 포트로 요청을 받은 뒤 fn-knock로 오리진 요청을 전달할 수 있습니다. 공인 IP 직접 연결 토폴로지의 앞단 계층이며, fn-knock 내부의 Host 라우팅과 접근 정책을 바꾸지는 않습니다.

연동하기 전에 fn-knock의 로컬 게이트웨이, 인증 서브도메인, 서비스 서브도메인이 먼저 정상 작동하도록 구성합니다.

## 라우팅 방식 선택

| 라우팅 방식 | 외부 주소 예시 | 적합한 서비스 | 설명 |
| --- | --- | --- | --- |
| Host 라우팅 | `https://nas.example.com` | 웹 서비스 | 권장 방식. 서비스마다 별도의 서브도메인을 사용합니다. |
| 경로 라우팅 | `https://example.com/photos` | 서브 경로를 지원하는 웹 서비스 | 기존 구성을 위한 호환 방식. `리버스 프록시 모드 → 경로 모드`에 있으며 현재는 권장하지 않습니다. |
| TCP/UDP 포워딩 | `example.com:3306` | SSH, 데이터베이스, DNS 등의 비 웹 프로토콜 | `프로토콜 매핑`에서 구성합니다. 현재 관리 패널의 서브도메인 모드에서만 제공합니다. |

Host 라우팅은 공인 IP 직접 연결과 FRP/Cloudflared 터널에서 모두 사용할 수 있습니다. 공인 IP가 없어도 서브도메인 라우팅을 사용할 수 있습니다.

경로 라우팅은 다음 상황에서만 유지합니다.

- 기존 경로 매핑을 중단 없이 마이그레이션해야 함
- 업스트림 서비스가 서브 경로를 명시적으로 지원함
- 외부에서 고정된 호스트 이름 하나만 사용할 수 있음

## 접근 정책 선택

현재 관리 패널에서는 Host 매핑의 `로그인 필요` 스위치로 새 서비스의 정책을 설정합니다.

| 정책 | 현재 설정 방법 | 허용 조건 |
| --- | --- | --- |
| 공개 접근 | 해당 Host 매핑의 `로그인 필요`를 끔 | fn-knock 로그인과 허용 목록을 확인하지 않음 |
| 로그인 필요 | `로그인 필요`를 켬 | 수동 IP 접근 허용은 독립적으로 통과할 수 있습니다. 로그인 후 자동 IP 허용은 일반적으로 같은 출발지의 후속 요청을 허용하지만, 브라우저에 이미 있는 서비스 범위 거부보다 우선하지 않습니다. 사용할 수 있는 IP 접근 권한이 없을 때 세션을 확인합니다. |
| 서브도메인 고급 인증 | `로그인 필요`가 켜진 HTTP/HTTPS Host에 고급 인증 규칙 구성 | 출발지 또는 요청 특성이 규칙과 일치하면 현재 Host에서만 유효한 임시 자격 증명을 발급합니다. 일치하지 않으면 일반 로그인 절차를 계속합니다. |
| 엄격한 허용 목록 | 이전 버전의 매핑에만 남아 있을 수 있으며 현재 UI에서는 새로 선택할 수 없음 | `로그인 필요`를 꺼도 공개되지 않을 수 있습니다. 유효한 출발지 허용 기록(수동 또는 로그인 후 자동 생성)만 확인하며 세션 쿠키만으로는 출발지 조건을 대신할 수 없습니다. |

새 서비스 매핑에는 일반적으로 `로그인 필요`를 켭니다. 인증 서비스 자체는 공개 상태로 유지합니다. 그렇지 않으면 로그인하지 않은 사용자가 로그인 페이지에 들어갈 수 없습니다. 업그레이드 후 이전의 엄격한 허용 목록 규칙이 남아 있다면 수동 및 자동 IP 허용 기록을 모두 확인합니다. 이 규칙에서 벗어나려면 전체 매핑 내용을 기록한 뒤 현재 UI에서 다시 만듭니다. `로그인 필요`만 끄는 것으로는 공개되지 않습니다. 엄격한 규칙에서 수동 출발지만 허용하려면 로그인 후 자동 IP 허용을 끄고 남아 있는 자동 기록을 정리합니다.

로그인 자격 증명에는 접근할 수 있는 서브도메인 범위도 지정할 수 있습니다. 서브도메인 고급 인증은 별도의 Host 허용 경로이며 로그인 자격 증명을 더 제한하는 기능이 아닙니다. 구성하기 전에 [서브도메인 고급 인증](/ko/guide/advanced-auth)을 읽습니다. 업스트림 Basic Auth 자격 증명 삽입은 fn-knock가 대상 서비스에 연결할 때만 사용하며, 사용자가 fn-knock에 로그인하는 방식이 아닙니다.

## 요구 사항에 맞는 설정 문서

| 조건 | 선택 |
| --- | --- |
| 인터넷에서 접속 가능한 엔드포인트와 도메인이 있고 주로 웹 서비스 사용 | [공인 IP 직접 연결: 서브도메인 라우팅](/ko/quick-start/subdomain-mode) |
| 공인 IP가 없고 FRP 또는 Cloudflared 사용 | [NAT 통과: 서브도메인 라우팅](/ko/quick-start/reverse-proxy-mode) |
| 기존 경로 매핑을 아직 마이그레이션할 수 없음 | [터널링 문서의 경로 호환 구성](/ko/quick-start/reverse-proxy-mode#경로-모드는-호환용으로만-사용) |
| Web 로그인 후 `5666`, `22` 같은 원본 포트에 접속해야 함 | [원본 포트: 직접 연결 접근 허용](/ko/quick-start/direct-mode) |
| 아직 설치하지 않았거나 관리 및 게이트웨이 엔드포인트를 구분하기 어려움 | [설치 및 처음 접속하기](/ko/quick-start/install-and-first-login) |
| Windows x86_64 호스트에서 배포 및 관리 | [Windows x86_64 배포](/ko/quick-start/windows-deployment) |

외부 게이트웨이 엔드포인트가 있는 배포는 모바일 데이터처럼 실제 외부 경로에서 최종 검증합니다. LAN과 로컬 출발지는 게이트웨이에서 신뢰 대상으로 처리될 수 있으므로 인터넷 인증 테스트를 대신할 수 없습니다. Windows의 `7999`는 기본적으로 모든 인터페이스에서 수신하지만, Windows 방화벽 프로필, 라우터/NAT, IPv6 방화벽, ISP의 인바운드 정책도 함께 검증합니다.
