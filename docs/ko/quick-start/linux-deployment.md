---
lang: ko-KR
title: "Linux 배포(systemd / OpenRC)"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e90b21ae59103a44858cf77355da8ae1c08bd5d08c064f9dd16d6518234919d4
---

# Linux 배포(systemd / OpenRC)

이 문서는 일반 Linux 호스트를 대상으로 합니다. 설치 패키지는 `amd64`, `arm64`, `armv7`을 지원하며 systemd 기반 배포판과 Alpine Linux의 OpenRC에서 실행할 수 있습니다. 호스트에는 root 권한과 정상적으로 시작된 systemd 또는 OpenRC가 필요합니다. init 시스템이 없는 경량 컨테이너에는 이 호스트 설치 프로그램을 사용할 수 없으므로 [Docker 배포](/ko/quick-start/docker-deployment)를 사용합니다.

설치 프로그램은 필요에 따라 `curl`, `openssl`, `tar`, `unzip`, `gzip`, 포트 확인 도구를 설치합니다. Alpine에서는 `apk`를 통해 실행에 필요한 Bash와 의존성도 설치합니다.

Linux 버전은 `7991`에서 관리 패널을, `7999`에서 Go 게이트웨이 엔드포인트를 제공합니다. 관리 패널은 LAN, VPN 또는 접근이 통제된 HTTPS 리버스 프록시를 통해서만 열고 인터넷에 직접 매핑하지 않습니다.

## 설치

### systemd 배포판

터미널에서 실행합니다.

```bash
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo bash
```

### Alpine Linux(OpenRC)

처음 설치하기 전에는 Bash가 없을 수 있으므로 `sh`로 설치 프로그램을 시작합니다.

```sh
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo sh
```

설치 프로그램은 OpenRC가 실행 중인지 확인한 다음 `fn-knock`를 `default` 런레벨에 등록하고 바로 시작합니다. `rc-service` 명령은 있지만 `/run/openrc`가 없다면 정상적으로 부팅된 OpenRC 호스트가 아닙니다. 이 경우 설치를 중단하며 불완전한 서비스 설정을 남기지 않습니다.

어느 서비스 관리자를 사용하든 설치 프로그램은 기존 fn-knock 설치를 먼저 확인합니다.

- 처음 설치하는 경우 설치를 계속하거나 종료할 수 있습니다.
- 이미 설치되어 있으면 최신 버전 설치, 관리 메뉴 열기, 서비스 상태 확인, 제거 중에서 선택할 수 있습니다.
- 릴리스 패키지를 다운로드하기 전에 필요한 TCP 포트를 검사합니다. 사용 중인 포트가 있으면 리스너 정보를 표시하고 포트 설정 메뉴로 이동하며, 값을 변경한 뒤 설치를 계속합니다.

설치된 프로그램은 감지되지 않지만 이전 `/etc/fn-knock/fn-knock.env`가 남아 있다면 설치 프로그램이 '남은 포트 설정'으로 명확히 표시하고 기존 값을 유지하거나 수정하거나 지우는 옵션을 제공합니다. '이전 포트 설정 지우기'는 해당 환경 파일만 삭제하고 기본 포트로 되돌립니다. `/var/lib/fn-knock`의 데이터나 게이트웨이 설정은 삭제하지 않습니다.

설치 후 브라우저에서 다음 주소를 엽니다.

```text
http://<서버 주소>:7991/
```

페이지 안내에 따라 관리 패널 비밀번호를 설정합니다. 이 비밀번호는 관리 패널만 보호하며 서비스에 접속할 때 사용하는 TOTP, 사용자 이름과 비밀번호 또는 패스키와는 별개의 자격 증명입니다.

## 기본 포트

`7999`는 설정한 매핑의 서비스 트래픽을 받는 Go 게이트웨이 엔드포인트입니다. Linux 포트 설정 메뉴의 첫 번째 항목으로 표시됩니다.

| 포트 | 용도 | 기본 수신 범위 |
| --- | --- | --- |
| `7999` | Go 게이트웨이 엔드포인트 | 모든 네트워크 인터페이스 |
| `7991` | 관리 패널 | 모든 네트워크 인터페이스 |
| `7998` | Rust 관리 백엔드 | 로컬 호스트만 |
| `7997` | 인증 서비스 | 로컬 호스트만 |
| `7996` | Go 관리 인터페이스 | 로컬 호스트만 |

처음 설치하거나 기존 설치를 업데이트할 때 해당 번호를 입력하여 각 포트를 변경할 수 있습니다. 중복된 포트나 다른 서비스가 사용 중인 포트는 저장할 수 없습니다.

## 관리 명령

설치 후 `sudo knock`를 실행하여 관리 메뉴를 엽니다. 자주 사용하는 비대화형 명령은 다음과 같습니다.

```bash
sudo knock status
sudo knock restart
sudo knock config
sudo knock update
sudo knock logs
sudo knock reset-panel-password
```

`sudo knock status`는 서비스의 활성화 및 실행 여부, 외부 수신 포트, 핵심 프로세스인 `server-admin-rs`와 `go-reauth-proxy`의 PID, RSS 메모리와 합계 메모리를 표시합니다.

명령은 현재 시스템의 서비스 관리자를 자동으로 사용합니다. systemd에서는 `systemctl`, OpenRC에서는 `rc-service`를 사용합니다. 두 환경 모두 서비스 상태, 외부 리스너, 핵심 프로세스 메모리를 표시하고, systemd에서는 주 PID, 최근 종료 코드, 시작 시간도 추가로 표시합니다.

로그는 다음 명령으로 확인합니다.

```bash
sudo knock logs
sudo knock logs --follow
```

systemd에서는 두 명령 모두 `journalctl`을 읽고 OpenRC에서는 `/var/log/fn-knock.log`를 읽거나 실시간으로 따라갑니다. 로그 파일이 아직 생성되지 않았다면 `knock logs`는 이를 서비스 장애로 처리하지 않고 안내 메시지를 표시합니다.

`sudo knock config`는 번호가 붙은 포트 표를 표시합니다. `1`부터 `5`까지 입력하여 해당 포트를 변경하고, `S`를 입력하여 검증 후 저장하거나 `R`을 입력하여 기본 포트로 되돌릴 수 있습니다. 서비스가 실행 중일 때 현재 사용 중인 자체 리스닝 포트는 충돌로 잘못 판단하지 않습니다.

`sudo knock reset-panel-password`는 확인 후 실행됩니다. 관리 패널 비밀번호, 모든 패널 로그인 세션, 로그인 실패 백오프 기록을 지웁니다. 다음에 `7991`의 실제 관리 주소를 열면 비밀번호를 처음 설정하는 절차가 다시 표시됩니다.

## 업데이트 및 롤백

`sudo knock update`를 실행하면 로컬 버전과 온라인 버전을 함께 표시합니다. 업데이트 프로그램은 현재 아키텍처의 최신 버전 manifest를 고정 주소에서 읽습니다. 릴리스 과정에서 해당 주소의 CDN 캐시를 갱신하고 다시 읽어 검증하므로, 명령은 확인할 때마다 임의의 쿼리 매개변수를 붙이지 않습니다.

로컬 버전과 온라인 버전이 같아도 해당 버전을 다시 다운로드하여 배포할 수 있습니다. 새 버전을 시작한 뒤 관리 패널 헬스 체크를 실행합니다. 시작에 실패하면 이전 버전, 관리 명령, 해당 systemd 유닛 또는 OpenRC 서비스 스크립트와 서비스 활성화·실행 상태를 복원합니다.

이전 버전이 남아 있다면 다음 명령을 실행할 수 있습니다.

```bash
sudo knock rollback
```

## 데이터 및 백업

기본 설치의 주요 경로는 다음과 같습니다.

| 경로 | 내용 |
| --- | --- |
| `/opt/fn-knock` | 버전별 프로그램, 현재 버전 링크, 보관된 롤백 버전 |
| `/etc/fn-knock` | 포트 환경 파일과 게이트웨이 설정 |
| `/var/lib/fn-knock` | SQLite, 인증서, 키, 다운로드 리소스와 기타 fn-knock 데이터 |
| `/var/log/fn-knock.log` | OpenRC 서비스 로그. systemd에서는 journal 사용 |

업데이트하거나 마이그레이션하기 전에 유지보수 페이지에서 `.knock` 파일을 내보낸 뒤 `/etc/fn-knock`와 `/var/lib/fn-knock`를 백업합니다. `.knock` 설정 아카이브는 복원 가능한 설정을 다른 환경으로 옮길 때 사용하고, 디렉터리 백업은 SQLite와 플랫폼 런타임 데이터를 보존할 때 사용합니다. 어느 한쪽도 다른 쪽을 대신할 수 없습니다. 자세한 범위와 복원 절차는 [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)를 참고합니다.

이 디렉터리에는 인증 자격 증명과 개인 키가 들어 있습니다. 백업을 암호화하고 root 또는 실제 유지보수 담당자만 읽을 수 있도록 제한합니다. 디렉터리 전체를 일반 로그 첨부 파일로 업로드하지 않습니다.

## 리버스 프록시와 보안 경계

인터넷에서 관리해야 한다면 HTTPS 리버스 프록시를 통해 엔드포인트를 제공하는 방식을 우선 사용합니다. 설치 후 다음 명령을 실행하면 Nginx 예시를 출력합니다.

```bash
sudo knock nginx
```

리버스 프록시에서 TLS를 활성화하고 신뢰할 수 있는 출발지 IP, VPN 대역 또는 추가 인증으로 접근을 제한합니다. Linux 실행 모드는 호스트 방화벽을 변경하지 않습니다. 서비스에 실제로 필요한 포트만 엽니다. 관리 및 서비스 게이트웨이 엔드포인트의 차이는 [포트 및 엔드포인트](/ko/quick-start/ports-and-entrypoints)를 참고합니다.

### 기존 업무 도메인의 하위 경로에 연결

클라우드 서버의 Nginx가 이미 `https://www.example.com`을 제공하고 있다면 도메인이나 공용 포트를 추가하지 않고 fn-knock 관리 패널을 하위 경로에 연결할 수 있습니다. 다음 예시는 `/fn-knock/`를 권장 경로로 사용하지만 기존 서비스가 사용하지 않는 다른 경로로 바꿀 수 있습니다. `www.example.com`에 해당하는 HTTPS `server {}` 블록에 설정을 추가합니다.

```nginx
# 경로를 변경할 때는 다음 줄의 /fn-knock만 수정
location ~ ^(?<panel_prefix>/fn-knock)(?<panel_uri>/.*)?$ {
    if ($panel_uri = "") {
        return 308 $panel_prefix/$is_args$args;
    }

    include /etc/nginx/snippets/migrated-proxy-headers.conf;

    proxy_http_version 1.1;

    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix $panel_prefix;

    proxy_redirect ~^(/.*)$ $panel_prefix$1;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    rewrite ^ $panel_uri break;
    proxy_pass http://127.0.0.1:7991;
}
```

이 예시는 관리 패널이 기본 포트 `7991`을 계속 사용한다고 가정합니다. 설치할 때 포트를 변경했다면 `proxy_pass`도 함께 수정합니다. `/etc/nginx/snippets/migrated-proxy-headers.conf` 파일이 이미 존재하고 현재 사이트의 공통 프록시 요청 헤더를 제공해야 합니다. 기존 사이트가 다른 공통 프록시 설정을 사용한다면 `include` 경로를 실제 파일로 변경합니다.

Nginx `location`은 `set`으로 정의한 변수를 직접 참조할 수 없습니다. 이 예시는 대신 정규식 이름 지정 캡처를 사용합니다. `/fn-knock`는 한 번만 나타나고 `$panel_prefix`에 저장되므로 경로를 `/knock-admin` 등으로 변경할 때 `location` 줄만 수정하면 됩니다. `$panel_uri`는 접두사 뒤의 요청 경로를 저장하여 프록시하기 전에 외부 접두사를 제거하는 데 사용합니다. 같은 `server`에 다른 정규식 `location`이 있다면 동일한 요청과 충돌할 수 있는 규칙보다 이 블록을 앞에 배치합니다.

- 끝에 슬래시가 없는 접두사는 기존 쿼리 문자열을 보존한 채 상태 코드 `308`로 `/`가 붙은 URL에 리디렉션됩니다.
- `rewrite`는 `$panel_uri`를 사용하여 관리 패널에 요청을 전달하기 전에 외부 접두사를 제거합니다. `X-Forwarded-Prefix`는 관리 패널에 외부 경로를 알리고, `proxy_redirect`는 업스트림이 반환한 루트 상대 리디렉션을 같은 접두사 아래 경로로 다시 작성합니다.
- `X-Forwarded-Host`와 `X-Forwarded-Port`는 방문자가 실제 사용한 도메인과 포트를 보존합니다.

설정을 저장한 후 구문을 검사하고 호스트에서 사용하는 서비스 관리자로 Nginx를 다시 로드합니다.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Alpine Linux에서는 다음 명령을 사용합니다.

```sh
sudo rc-service nginx reload
```

다시 로드한 후 이 예시에서는 `https://www.example.com/fn-knock/`에서 관리 패널에 접근할 수 있습니다. 권장 경로를 변경했다면 URL에도 같은 새 접두사를 사용합니다. 끝에 슬래시가 없는 URL은 자동으로 리디렉션됩니다. 이 경로는 `7991` 관리 엔드포인트만 프록시하며 `7999` 서비스 게이트웨이 엔드포인트를 대체하지 않습니다. 공용 인터넷에서 접근할 수 있다면 출발지 IP 제한, VPN 또는 추가 인증으로 계속 보호합니다.

## 제거

```bash
sudo knock uninstall
```

기본 제거는 프로그램과 현재 서비스 관리자의 등록 항목(systemd 유닛 또는 OpenRC 서비스 스크립트)만 삭제하고 `/etc/fn-knock` 설정과 `/var/lib/fn-knock` 데이터는 보존합니다. `--purge`를 명시적으로 사용하고 대화형 터미널에서 `DELETE`를 입력해야만 설정과 데이터가 영구적으로 삭제됩니다.

이어서 읽기:

- [배포 및 접근 방식 선택](/ko/quick-start/deployment-options)
- [포트 및 엔드포인트](/ko/quick-start/ports-and-entrypoints)
- [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)
- [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)
