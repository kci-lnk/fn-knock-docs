---
lang: ko-KR
title: "Docker Compose로 배포"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: efd17576c9922af7b163e51a729df52d857eb01e58e179275383dbb565311a9e
---

# Docker Compose로 배포

이 문서는 배포된 `kcilnk/fn-knock` 이미지와 저장소의 `deploy/docker/compose.remote.yaml`을 사용합니다. 이 파일에는 로컬 빌드 설정이 없어 서버에 배포하기 좋습니다. 로컬에 이미지가 없으면 `docker compose up -d`가 자동으로 이미지를 가져옵니다.

fnOS 네이티브 FPK를 설치하려면 [fnOS 네이티브 FPK 설치 및 초기 설정](/ko/quick-start/install-and-first-login)을 참고합니다.

## 사전 요구 사항과 적용 범위

- Docker Engine과 Docker Compose v2 설치가 필요합니다.
- 호스트의 `7991`, `7999` 포트를 다른 서비스가 사용 중인지 확인합니다. 사용 중이라면 대체 포트를 준비합니다.
- 관리 엔드포인트는 LAN, VPN 또는 신뢰할 수 있는 리버스 프록시에서만 접근합니다. 인터넷으로 직접 포트 포워딩하지 않습니다.

표준 Compose 구성은 관리 엔드포인트와 게이트웨이 엔드포인트만 호스트에 공개합니다. 컨테이너 내부의 백엔드, 인증 서비스, 게이트웨이 내부 gRPC 포트는 호스트에 노출하지 않습니다.

| 호스트 포트 | 컨테이너 서비스 | 용도 |
| --- | --- | --- |
| `7991` | 관리 패널 | 처음 접속할 때 Docker 관리 패널 비밀번호 설정 |
| `7999` | 게이트웨이 엔드포인트 | 사용자가 매핑된 서비스에 접속할 때 거치는 엔드포인트 |
| 공개하지 않음 | `7998`, `7997`, `7996` | 관리 백엔드, 인증 서비스, 내부 gRPC |

Docker 관리 패널 비밀번호와 `fn-knock`에서 사용자용으로 구성하는 TOTP, 사용자 이름과 비밀번호 또는 패스키는 서로 다른 자격 증명입니다.

## 배포용 Compose 파일 받기

root 권한으로 작업하거나 각 명령 앞에 `sudo`를 붙여 전용 실행 디렉터리를 만들고, 배포용 Compose 파일을 기본 파일명으로 저장합니다.

```bash
install -d -m 0750 /opt/fn-knock
cd /opt/fn-knock
curl -fsSLo compose.yaml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

같은 디렉터리에 `.env`를 만듭니다. 다음은 기본 프로덕션 설정입니다. `compose.remote.yaml`은 이 파일에서 이미지, 포트, 네트워크 대역을 읽습니다.

```dotenv
FN_KNOCK_IMAGE=kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
GO_REPROXY_PORT=7999
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
```

일반적으로 `ADMIN_VIEW_PORT`, `GO_REPROXY_PORT`, 시간대만 변경하면 됩니다. Compose는 기본적으로 IPv4 `172.30.0.0/16`과 IPv6 `fd42:fb33:7f7a:100::/64`를 사용합니다. 기존 Docker 네트워크, VPN 또는 호스트 라우팅과 겹칠 때만 `.env`에 `FN_KNOCK_DOCKER_IPV4_SUBNET`, `FN_KNOCK_DOCKER_IPV6_SUBNET`을 추가하고 사용하지 않는 사설 대역으로 바꿉니다. 현재 배포 이미지는 SQLite를 사용하므로 Redis 컨테이너나 `REDIS_*` 환경 변수를 추가할 필요가 없습니다.

관리 엔드포인트를 인터넷의 리버스 프록시를 통해 제공해야 한다면 프록시 노드의 출발지 IP 또는 CIDR을 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`에 등록하고, 프록시가 `X-Forwarded-For` 또는 `X-Real-IP`를 전달하도록 구성합니다. 신뢰할 수 있는 프록시 목록에 `0.0.0.0/0`을 등록하지 않습니다.

## 시작 및 확인

```bash
cd /opt/fn-knock
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

`docker compose config`에서 완성된 설정을 확인하고, `docker compose ps`에서 `fn-knock`가 실행 중인지 확인합니다. 호스트에서는 다음 명령으로 관리 서비스의 헬스 체크를 실행할 수 있습니다.

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

그다음 LAN에서 다음 주소를 엽니다.

```text
http://<호스트 LAN 주소>:<ADMIN_VIEW_PORT>/
```

`<ADMIN_VIEW_PORT>`는 `.env`에 설정한 실제 관리 포트이며 기본값은 `7991`입니다. 페이지 안내에 따라 Docker 관리 패널 비밀번호를 설정한 뒤 `fn-knock` 관리 패널에서 실행 모드, 인증, 매핑을 구성합니다. 외부 서비스 트래픽은 `.env`의 `GO_REPROXY_PORT`로 지정한 게이트웨이 포트로 전달하며 기본값은 `7999`입니다. 매핑을 마친 뒤에는 호스트의 `127.0.0.1`에서만 확인하지 말고 모바일 데이터 같은 실제 외부 네트워크에서 검증합니다.

## 데이터, 백업 및 복구 경로

Compose는 영구 볼륨 두 개를 만듭니다.

| 논리 볼륨 | 내용 |
| --- | --- |
| `fn_knock_gateway` | 게이트웨이 설정과 SQLite 데이터베이스 |
| `fn_knock_data` | 시크릿, 백업, FRP/Cloudflared 등의 리소스와 런타임 데이터 |

컨테이너를 다시 만들어도 두 볼륨은 지워지지 않지만, 볼륨 자체를 삭제하면 데이터도 사라집니다. 업데이트하거나 마이그레이션하기 전에 fn-knock 설정 백업을 내보내고 두 볼륨을 호스트 백업에 포함합니다. 자격 증명과 키가 들어 있을 수 있으므로 백업 파일을 외부에서 읽을 수 있는 디렉터리에 두어서는 안 됩니다.

`.knock` 아카이브와 볼륨 백업은 용도가 다릅니다. 아카이브는 다른 환경으로 옮길 수 있는 fn-knock 설정을 복원하고, 볼륨 백업은 SQLite, 다운로드한 리소스, 컨테이너 런타임 데이터를 보존합니다. 아카이브 내용, 버전 제한, 복원 검증 절차는 [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)를 참고합니다.

사용자 로그인 자격 증명이 아니라 Docker 관리 패널 비밀번호를 잊었다면 실행 디렉터리에서 다음 명령을 실행합니다.

```bash
docker compose exec fn-knock \
  fn-knock-reset-panel-password
```

### 이전 Redis 구성에서 마이그레이션

이 절차는 이전 Compose 구성에 Redis가 남아 있고 기존 데이터를 유지해야 하는 업그레이드에만 적용됩니다. 새로 설치할 때는 Redis를 추가하거나 마이그레이션을 실행하지 않습니다.

먼저 기존 Redis와 영구 볼륨 두 개를 백업합니다. 기존 Redis 서비스와 현재 `fn-knock` 컨테이너가 여전히 같은 Compose 네트워크에 연결되어 있는지 확인한 다음 실행합니다.

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

명령이 성공하면 이전 데이터를 다시 읽지 않도록 Redis의 `fn_knock:*` 키를 삭제합니다. 따라서 반드시 먼저 백업하고, Redis를 제거하거나 현재 Compose 구성으로 전환하기 전에 관리 패널과 SQLite 데이터가 모두 정상인지 확인합니다. 기존 SQLite 데이터를 덮어쓸 의도가 분명할 때만 `--force`를 추가합니다.

## Docker 버전의 기능 제한

| 기능 | Docker Compose에서의 처리 방식 |
| --- | --- |
| 웹 관리 패널 FPK 업데이트 | 지원하지 않음. Compose로 새 이미지를 가져온 뒤 컨테이너를 다시 만듭니다. |
| 직접 연결 모드, 호스트 방화벽 관리, Smart Connect | 사용할 수 없음. 컨테이너가 호스트의 네트워크 정책을 안전하게 대신 관리할 수 없습니다. |
| 웹 터미널, SSH 보안 | 사용할 수 없음. 호스트 터미널이나 SSH 로그가 필요합니다. |
| 자동 HTTPS | 표준 Compose는 호스트의 `80` 포트를 공개하지 않습니다. 앞단 리버스 프록시/인증서 구성을 사용하거나 포트와 인증서를 직접 설계합니다. |

이러한 제한이 서브도메인 모드나 리버스 프록시 모드에서 게이트웨이를 사용하는 것을 막지는 않습니다. Docker 배포에서는 호스트 방화벽의 동적 허용 규칙에 의존하지 않는 방식을 우선 선택합니다.

## 배포 이미지 업데이트

`latest`를 사용한다면 다음 명령을 실행합니다.

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

`.env`에 특정 버전 태그를 고정했다면 먼저 `FN_KNOCK_IMAGE`를 대상 버전으로 바꾼 뒤 같은 명령을 실행합니다. 업데이트 후 관리 패널, 게이트웨이 엔드포인트, 인증서, 사용 중인 터널을 확인합니다. 인터넷 공개 경로는 반드시 외부 네트워크에서 검증합니다.

이어서 읽기:

- [포트, 엔드포인트 및 접근 경로](/ko/quick-start/ports-and-entrypoints)
- [접근 방식 선택](/ko/quick-start/run-modes)
- [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)
- [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)
