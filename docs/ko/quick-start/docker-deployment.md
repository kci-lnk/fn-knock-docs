---
lang: ko-KR
title: "Docker Compose로 배포"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c9f1a8811555a1470459c0ede1e0ead8a5b0df8137c9feb468e557d30d02435e
---

# Docker Compose로 배포

이 문서는 fn-knock 공식 이미지 미러와 저장소의 `deploy/docker/compose.remote.yaml`을 사용합니다. 이 파일에는 로컬 빌드 설정이 없어 서버 배포에 적합합니다. 로컬에 이미지가 없으면 `docker compose up -d`가 자동으로 이미지를 가져옵니다.

fnOS 네이티브 FPK를 사용하려면 [fnOS 네이티브 FPK 설치 및 초기 설정](/ko/quick-start/install-and-first-login)을 참고합니다.

## 사전 요구 사항과 적용 범위

- Linux 호스트에 Docker Engine, Docker Compose v2, `curl`이 설치되어 있어야 합니다.
- 호스트에서 IPv6가 활성화되어 있고 `/proc/net/if_inet6`에 하나 이상의 IPv6 인터페이스가 있어야 합니다. 배포용 Compose는 이 파일만 컨테이너에 읽기 전용으로 마운트합니다.
- 호스트의 `7991`, `7999` 포트가 비어 있거나 대체 포트를 준비해야 합니다.
- 관리 엔드포인트는 LAN, VPN 또는 신뢰할 수 있는 리버스 프록시에서만 접근하고 인터넷으로 직접 포트 포워딩하지 않습니다.

배포는 격리된 Docker bridge를 유지하며 `network_mode: host`를 사용하지 않습니다. Compose는 bridge에서 IPv6를 활성화하고 호스트 IPv6 인터페이스 테이블만 마운트하므로 DDNS의 “인터페이스에서 가져오기”에서 실제 호스트 IPv6 인터페이스를 선택할 수 있습니다.

| 호스트 포트 | 컨테이너 서비스 | 용도 |
| --- | --- | --- |
| `7991` | 관리 패널 | 첫 접속 시 Docker 관리 패널 비밀번호 설정 |
| `7999` | 게이트웨이 엔드포인트 | 매핑된 서비스에 접근하는 진입점 |
| 공개하지 않음 | `7998`, `7997`, `7996` | 관리 백엔드, 인증 서비스, 내부 gRPC |

Docker 관리 패널 비밀번호와 사용자용 TOTP, 사용자 이름과 비밀번호, Passkey는 서로 다른 자격 증명입니다.

## 이미지 소스 선택

| 이미지 소스 | `FN_KNOCK_IMAGE` | 권장 네트워크 |
| --- | --- | --- |
| 공식 미러 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 중국 본토 네트워크. `latest`는 30분마다 동기화 |
| Docker Hub | `kcilnk/fn-knock:latest` | Docker Hub 연결이 안정적인 네트워크 |

아래 예시는 공식 미러를 사용합니다. 버전을 고정하려면 `latest`를 게시된 고정 태그로 변경합니다.

## 한 번에 설치

대상 호스트의 root 터미널에 아래 전체 스크립트를 붙여넣습니다. Docker와 IPv6를 확인하고 `/opt/fn-knock-docker`를 만든 뒤 설정과 이미지를 준비하여 서비스를 시작합니다. `.env` 또는 `docker-compose.yml`이 이미 있으면 덮어쓰지 않고 중지합니다.

```bash
sh <<'FN_KNOCK_INSTALL'
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this installer in a root terminal." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose is not available." >&2; exit 1; }
[ -s /proc/net/if_inet6 ] || { echo "IPv6 is not enabled or /proc/net/if_inet6 is empty." >&2; exit 1; }

install_dir=/opt/fn-knock-docker
mkdir -p "$install_dir"
cd "$install_dir"

if [ -e .env ] || [ -e docker-compose.yml ]; then
  echo "Existing .env or docker-compose.yml found; installation stopped." >&2
  exit 1
fi

cat > .env <<'FN_KNOCK_ENV'
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
FN_KNOCK_ENV

curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml

docker compose pull
docker compose up -d
docker compose ps
FN_KNOCK_INSTALL
```

설치 후 [시작 및 확인](#시작-및-확인)에 따라 로그, 상태, 첫 접속을 확인합니다. 설정을 개별적으로 바꾸려면 아래 수동 절차를 사용합니다.

## 배포용 Compose 받기

```bash
install -d -m 0750 /opt/fn-knock-docker
cd /opt/fn-knock-docker
curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

같은 디렉터리에 `.env`를 만듭니다.

```dotenv
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
```

일반적으로 이미지, 공개 포트, 시간대만 변경하면 됩니다. 내부 포트는 기본값을 유지합니다. IPv4 `172.30.0.0/16` 또는 IPv6 `fd42:fb33:7f7a:100::/64`가 기존 네트워크와 겹칠 때만 사용하지 않는 사설 대역으로 바꿉니다. 현재 배포 이미지는 SQLite를 사용하므로 Redis를 추가하지 않습니다.

다운로드한 Compose의 다음 설정은 삭제하지 마세요. 전체 호스트 네트워크를 공유하지 않고 IPv6 인터페이스 테이블만 읽기 전용으로 제공합니다.

```yaml
services:
  fn-knock:
    environment:
      DDNS_HOST_IF_INET6_PATH: /host/proc/net/if_inet6
    volumes:
      - type: bind
        source: /proc/net/if_inet6
        target: /host/proc/net/if_inet6
        read_only: true
    networks:
      - fn_knock_net

networks:
  fn_knock_net:
    enable_ipv6: true
```

`/proc/net/if_inet6`가 없거나 비어 있다면 마운트를 삭제하지 말고 먼저 호스트에서 IPv6를 활성화합니다. `test -s /proc/net/if_inet6 && cat /proc/net/if_inet6`로 확인할 수 있습니다.

관리 엔드포인트를 공개 리버스 프록시 뒤에 둘 경우 해당 프록시의 출발지 IP 또는 CIDR만 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`에 설정합니다. `0.0.0.0/0`은 사용하지 않습니다. `DOCKER_DISCOVER_LAN_IP`는 자동 감지가 실패할 때만 사용합니다.

## 시작 및 확인

```bash
cd /opt/fn-knock-docker
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

관리 서비스 상태를 확인합니다.

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

LAN에서 `http://<호스트-LAN-주소>:<ADMIN_VIEW_PORT>/`를 열고 Docker 관리 패널 비밀번호, 실행 모드, 인증, 매핑을 설정합니다. 외부 트래픽은 `GO_REPROXY_PORT`(기본값 `7999`)로 전달합니다. 설정 후에는 모바일 데이터 같은 실제 외부 네트워크에서 검증합니다.

## 데이터, 백업 및 복구

Compose는 `fn_knock_gateway`(게이트웨이 설정과 SQLite)와 `fn_knock_data`(시크릿, 백업, FRP / Cloudflared 리소스) 영구 볼륨을 만듭니다. 컨테이너를 다시 만들어도 유지되지만 볼륨을 삭제하면 데이터도 사라집니다. 자세한 내용은 [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)를 참고합니다.

Docker 관리 패널 비밀번호를 잊었다면 다음 명령을 실행합니다.

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

이 명령은 관리 패널 비밀번호, 로그인 세션, 로그인 실패 백오프 상태만 지웁니다. 서비스 설정, 프록시 규칙, 인증서, 허용 목록, 로그 또는 데이터 볼륨은 삭제하지 않습니다.

### 이전 Redis 구성에서 마이그레이션

이전 Compose의 Redis 데이터를 유지해야 할 때만 백업 후 실행합니다.

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

성공하면 Redis의 `fn_knock:*` 키가 삭제되므로 사전 백업은 필수입니다. 기존 SQLite를 의도적으로 덮어쓸 때만 `--force`를 추가합니다.

## Docker 버전의 기능 제한

앱 내 FPK 업데이트, 호스트 방화벽 관리, Web 터미널, SSH 보안은 사용할 수 없습니다. 자동 HTTPS가 필요하면 앞단 리버스 프록시와 인증서를 사용하거나 필요한 포트를 직접 설계합니다.

## 배포 이미지 업데이트

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

업데이트 후 관리 패널, 게이트웨이 엔드포인트, 인증서, 터널을 확인하고 공개 경로는 실제 외부 네트워크에서 테스트합니다.

이어서 읽기:

- [포트, 엔드포인트 및 접근 경로](/ko/quick-start/ports-and-entrypoints)
- [접근 방식 선택](/ko/quick-start/run-modes)
- [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)
- [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)
