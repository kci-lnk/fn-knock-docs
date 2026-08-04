---
lang: ko-KR
title: "macOS 배포(Intel / Apple Silicon)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0912ae4a2d36e245cbe4770888063c9d343483a9a8a72e20b7573ef7a8a48ac9
---

# macOS 배포(Intel / Apple Silicon)

macOS 버전은 명령줄 설치 프로그램과 `knock` 관리 명령을 사용하며 `.app`, `.pkg` 또는 메뉴 막대 앱을 제공하지 않습니다. macOS 13 이상을 지원하고 Intel 및 Apple Silicon용 네이티브 패키지를 따로 배포합니다.

관리 패널은 기본적으로 `127.0.0.1:7991`에서만 수신합니다. macOS 런타임은 `iptables`를 호출하거나 macOS 호스트 방화벽을 변경하지 않습니다.

## 설치 요구 사항

- macOS 13 이상.
- `sudo`를 사용할 수 있는 계정.
- `cdn.fnknock.cn` 및 GitHub 릴리스에 대한 HTTPS 연결.
- 기본 포트 `7991`, `7996`, `7997`, `7998`, `7999`가 비어 있어야 합니다. 충돌이 있으면 설치 프로그램에서 변경할 수 있습니다.

설치 프로그램이 아키텍처를 자동으로 선택합니다.

| Mac | 릴리스 아키텍처 | 압축 파일 이름 |
| --- | --- | --- |
| Intel(`x86_64`) | `amd64` | `fn-knock-macos-<버전>-amd64.tar.gz` |
| Apple Silicon(`arm64`) | `arm64` | `fn-knock-macos-<버전>-arm64.tar.gz` |

Apple Silicon의 Rosetta 터미널에서 실행해도 실제 아키텍처를 감지하여 `arm64`를 선택합니다. 서비스 설치 전 패키지의 Mach-O 아키텍처도 검증합니다.

## 한 줄 설치

터미널에서 실행합니다.

```bash
curl -fsSL https://cdn.fnknock.cn/macos/install.sh | sudo bash
```

설치 프로그램은 현재 아키텍처용 안정 버전을 내려받아 크기와 SHA-256을 검증하고 root LaunchDaemon을 설치한 뒤 관리 서비스와 게이트웨이가 준비될 때까지 기다립니다. Homebrew는 필요하지 않습니다.

완료 후 `sudo knock status`를 실행하고 이 Mac의 브라우저에서 `http://127.0.0.1:7991/`을 엽니다. 첫 접속 시 설정하는 패널 비밀번호는 게이트웨이 방문자가 사용하는 TOTP, 사용자 이름과 비밀번호 또는 패스키와 별개입니다.

### 다른 컴퓨터에서 관리

`7991`은 의도적으로 루프백 전용입니다. 임시 원격 관리는 클라이언트에서 SSH 포워딩을 만듭니다.

```bash
ssh -L 7991:127.0.0.1:7991 <macOS-사용자>@<Mac-주소>
```

SSH 세션을 유지하고 클라이언트 브라우저에서 `http://127.0.0.1:7991/`을 엽니다. 상시 엔드포인트가 필요하면 `sudo knock nginx`의 HTTPS 리버스 프록시 예제를 기반으로 접근 제어를 추가합니다.

## 서명되지 않은 릴리스와 Gatekeeper

macOS 압축 파일은 Apple Developer ID로 서명되거나 Apple 공증을 받지 않았습니다. 명령줄 설치 프로그램은 안정 버전 포인터의 크기와 SHA-256을 검증합니다. 수동 다운로드 시 공식 GitHub 릴리스에서 압축 파일과 `SHA256SUMS`를 받아 다음을 실행합니다.

```bash
shasum -a 256 fn-knock-macos-<버전>-<amd64-또는-arm64>.tar.gz
```

결과가 `SHA256SUMS`의 같은 파일명 항목과 완전히 일치해야 합니다. 브라우저가 수동 다운로드 및 압축 해제 파일에 quarantine을 추가했다면 검증 후에만 다음을 실행합니다.

```bash
xattr -dr com.apple.quarantine /path/to/fn-knock
```

설치 프로그램은 quarantine을 자동으로 지우지 않습니다. 검증하지 않은 파일에 `xattr`을 실행하지 않습니다.

## 포트와 네트워크 경계

| 기본 포트 | 수신 범위 | 용도 |
| --- | --- | --- |
| `7991` | `127.0.0.1` | 관리 패널 |
| `7998` | 루프백 | Rust 관리 백엔드 |
| `7997` | 루프백 | 인증 서비스 |
| `7996` | 루프백 | Go 게이트웨이 관리 인터페이스 |
| `7999` | 게이트웨이 설정에 따름. 기본 서비스 엔드포인트 | fn-knock를 통과하는 서비스 트래픽 |

`7996`, `7997`, `7998`은 공개하지 않습니다. LAN 또는 인터넷에서 `7999`에 접근하려면 macOS 방화벽, 라우터/NAT, IPv6 방화벽 및 ISP 인바운드 정책도 허용되어야 하며 fn-knock는 이 규칙을 변경하지 않습니다.

자동 HTTPS와 프로토콜 매핑은 fn-knock 자체의 리스너와 라우팅만 설정합니다. macOS 방화벽, 라우터 포트 또는 클라우드 보안 그룹은 관리자가 수동으로 허용해야 합니다.

## `knock`로 관리

인자 없이 `sudo knock`를 실행하면 대화형 메뉴가 열립니다.

| 명령 | 용도 |
| --- | --- |
| `sudo knock status` | LaunchDaemon, 핵심 프로세스, 포트 및 메모리 확인 |
| `sudo knock start` / `stop` / `restart` | 서비스 제어 |
| `sudo knock config` | 런타임 포트 5개 변경 및 충돌 확인 |
| `sudo knock logs` / `logs --follow` | 로그 보기 또는 계속 추적 |
| `sudo knock update` / `update --yes` | 같은 아키텍처 업데이트를 대화형 또는 비대화형으로 설치 |
| `sudo knock rollback` | 보관된 이전 버전으로 전환하고 서비스 검증 |
| `sudo knock nginx` | 관리 패널 HTTPS 리버스 프록시 예제 출력 |
| `sudo knock reset-panel-password` | 패널 비밀번호를 지워 다시 설정 |
| `sudo knock version` | 설치된 버전 표시 |

업데이트는 다운로드 및 검증 후 `current` 심볼릭 링크를 원자적으로 전환합니다. 상태 확인에 실패하면 버전 링크, 관리 명령, LaunchDaemon 설정 및 이전 실행 상태를 복원합니다. 업데이트 전에 애플리케이션 백업도 내보냅니다.

## 파일 위치

| 내용 | 경로 |
| --- | --- |
| 버전 디렉터리 | `/Library/Application Support/FnKnock/releases/<버전>` |
| 현재 및 이전 버전 | `/Library/Application Support/FnKnock/current`, `previous` |
| 런타임 설정 | `/Library/Application Support/FnKnock/config/fn-knock.env` |
| 애플리케이션 데이터 | `/Library/Application Support/FnKnock/data` |
| 서비스 로그 | `/Library/Logs/FnKnock` |
| 관리 명령 | `/usr/local/bin/knock` |
| LaunchDaemon | `/Library/LaunchDaemons/cn.fnknock.service.plist` |

LaunchDaemon은 root로 실행되고 로그인 전에 시작할 수 있습니다. 시스템 재부팅 후 자동으로 로드되며 핵심 프로세스가 비정상 종료되면 launchd가 전체 서비스 그룹을 다시 시작합니다.

## 플랫폼 기능 범위

macOS는 Host/경로 리버스 프록시, 인증, 인증서와 ACME, WAF, 모니터링, 심층 모니터링 및 내장 FRP/Cloudflared를 지원합니다. 다음 기능은 제공하지 않습니다.

- `iptables` 또는 macOS 호스트 방화벽 관리.
- 직접 연결 모드 접근 허용 및 Smart Connect.
- SSH 보안 관리, 웹 터미널, fnOS 인증서 저장소 동기화, fnOS 전용 네트워크 조정.
- 웹에서 업데이트 설치. `sudo knock update`를 사용합니다.

macOS에서도 화이트리스트는 게이트웨이 접근 정책에 적용되지만 호스트의 원본 포트를 열 수는 없습니다.

## 제거

설정, 데이터 및 로그를 유지하고 프로그램과 서비스만 제거합니다.

```bash
sudo knock uninstall
```

모든 항목을 영구 삭제합니다.

```bash
sudo knock uninstall --purge
```

완전 삭제 시 대화형 터미널에서 `DELETE`를 입력해야 합니다. 먼저 애플리케이션 백업을 내보냅니다.

## 문제 해결

```bash
sudo knock status
sudo launchctl print system/cn.fnknock.service
sudo knock logs
```

- 관리 패널이 열리지 않음: fn-knock가 설치된 Mac에서 `127.0.0.1`을 사용하고 `7991`을 변경했는지 확인합니다.
- 서비스가 준비되지 않음: `/Library/Logs/FnKnock/stdout.log`, `stderr.log` 및 다섯 포트의 충돌을 확인합니다.
- 외부에서 게이트웨이에 접근할 수 없음: `7999` 리스너, macOS 방화벽, 라우터/NAT, IPv6 및 ISP 정책을 확인합니다.
- 업데이트 실패: 자동 복원 결과를 확인하고 `previous`가 있을 때만 `sudo knock rollback`을 실행합니다.
- 아키텍처 불일치: 강제 설치하지 말고 한 줄 설치 프로그램을 다시 실행하여 네이티브 패키지를 선택합니다.

[포트 및 엔드포인트](/ko/quick-start/ports-and-entrypoints), [배포 및 접근 방식 선택](/ko/quick-start/deployment-options), [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)를 계속 읽으세요.
