---
lang: ko-KR
title: "Docker Compose로 배포"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0ee89f785b71a22c2a6313b4e9615a7542f109ac0635b30f7a060844b134f447
---

# Docker Compose로 배포

현재 네트워크에 맞는 이미지 소스를 선택하고 전체 Compose 설정을 사용하여 Linux 호스트 또는 Linux 기반 NAS에서 fn-knock를 실행합니다.

[원본 Docker Hub 페이지 열기](https://hub.docker.com/r/kcilnk/fn-knock)

## 이미지 소스

| 이미지 소스 | 이미지 | 권장 네트워크 |
| --- | --- | --- |
| 공식 미러 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 중국 본토 네트워크. `latest`는 30분마다 동기화 |
| Docker Hub | `kcilnk/fn-knock:latest` | Docker Hub 연결이 안정적인 네트워크 |

아래 예시는 공식 미러를 사용합니다. 소스를 전환하려면 pull 명령과 `.env`의 `FN_KNOCK_IMAGE`를 해당 주소로 바꿉니다. 버전을 고정하려면 `latest`를 게시된 고정 태그로 변경합니다.

## 네트워크 모드

| 네트워크 모드 | 권장 | 설명 |
| --- | --- | --- |
| HOST 네트워크 | 권장 및 기본값 | 호스트 네트워크를 직접 사용하여 실제 인터페이스와 IPv6를 인식합니다 |
| 브리지 네트워크 | 선택 사항 | 격리된 듀얼 스택 bridge와 포트 매핑을 사용하지만 DDNS가 호스트 인터페이스나 IPv6를 찾지 못할 수 있습니다 |

DDNS의 “인터페이스에서 가져오기”를 사용하거나 호스트 IPv6가 필요하면 HOST 네트워크를 사용합니다. 호스트 인터페이스 감지보다 네트워크 격리가 더 중요할 때만 브리지를 선택합니다.

## 한 번에 설치

대상 Linux 호스트의 root 터미널에 아래 전체 스크립트를 붙여넣습니다. 기본적으로 권장 HOST 네트워크를 사용하고 전체 Compose 설정을 작성하여 fn-knock를 시작합니다.

<!--@include: ../../_shared/docker-quick-install.inc-->

설치 디렉터리는 `/opt/fn-knock-docker`입니다. `.env` 또는 `docker-compose.yml`이 이미 있으면 스크립트가 덮어쓰지 않고 중지합니다.

## 전체 설치 단계

### 01 Docker 환경 확인

Linux 호스트, Docker Engine, Docker Compose가 필요합니다.

```bash
docker version
docker compose version
```

아래 단계는 HOST 네트워크를 기본으로 사용합니다. 이 모드는 `ports`나 사용자 지정 bridge를 선언하지 않으며 서비스가 호스트 포트에서 직접 수신합니다.

### 02 디렉터리 준비 및 이미지 가져오기

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 `.env` 만들기

다음 내용을 `/opt/fn-knock-docker/.env`로 저장합니다.

<!--@include: ../../_shared/docker-env.inc-->

주요 설정:

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 기본적으로 `latest` 사용. 필요하면 Docker Hub 이미지 또는 고정 버전 태그로 변경 |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | 관리 패널과 공개 게이트웨이의 호스트 포트 |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | 브리지 모드 전용. 충돌하면 다른 사설 CIDR로 변경 |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | 브리지 모드 전용. Docker bridge IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 비움 | `7991`이 신뢰할 수 있는 리버스 프록시 뒤에 있을 때만 프록시 송신 IP 또는 CIDR 설정 |
| `DOCKER_DISCOVER_LAN_IP` | 비움 | 타사 리버스 프록시가 호스트 LAN 주소를 자동 감지하지 못할 때만 설정 |

### 04 `docker-compose.yml` 만들기

권장 설정은 하나의 `fn-knock` 컨테이너와 HOST 네트워크를 사용하여 호스트의 실제 인터페이스와 IPv6에 직접 접근합니다.

<!--@include: ../../_shared/docker-compose.inc-->

#### 선택 사항: 브리지 네트워크로 전환

브리지에서는 DDNS가 호스트 인터페이스나 IPv6를 찾지 못할 수 있습니다. “인터페이스에서 가져오기”에 의존하지 않는지 확인한 다음 `.env`를 다음으로 교체합니다.

<!--@include: ../../_shared/docker-env-bridge.inc-->

그리고 `docker-compose.yml`을 다음으로 교체합니다.

<!--@include: ../../_shared/docker-compose-bridge.inc-->

### 05 시작 및 상태 확인

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

마지막 명령은 로그를 계속 표시합니다. 종료하려면 `Ctrl+C`를 누릅니다.

## 첫 접속 및 설정

기본 HOST 모드는 호스트 네트워크 네임스페이스를 직접 사용합니다. 관리 패널은 `7991`, 게이트웨이는 `7999`에서 수신하며 나머지 서비스는 내부 또는 호스트 loopback에 유지됩니다.

| 포트 | 서비스 | 공개 범위 | 용도 |
| --- | --- | --- | --- |
| `7991` | 관리 패널 | HOST 네트워크 | 첫 접속 시 Docker 관리 패널 비밀번호 설정 |
| `7999` | 게이트웨이 / 프록시 진입점 | HOST 네트워크 | 외부 클라이언트가 프록시 서비스에 접근할 때 사용 |
| `7998` | Rust 백엔드 | 호스트 loopback / 내부 | 일반적으로 기본값 유지 |
| `7997` | 인증 프런트엔드 | 호스트 loopback / 내부 | 일반적으로 기본값 유지 |
| `7996` | Go 게이트웨이 관리 | 호스트 loopback / 내부 | 일반적으로 기본값 유지 |

1. `http://<호스트IP>:7991`을 열고 Docker 관리 패널 비밀번호를 설정한 뒤 로그인합니다.
2. 관리 패널에서 리버스 프록시, 서브도메인, 인증서, 인증을 설정합니다.
3. 외부 애플리케이션 트래픽을 포트 `7999`의 게이트웨이로 보냅니다.
4. `7991`이 신뢰할 수 있는 리버스 프록시 뒤에 있다면 `.env`에서 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`를 설정합니다.
5. 타사 리버스 프록시가 호스트 LAN 주소를 자동 감지하지 못할 때만 `DOCKER_DISCOVER_LAN_IP`를 설정합니다.

## 최신 이미지로 업데이트

`.env`에서 `latest`를 유지한 다음 이미지를 다시 가져와 컨테이너를 재생성합니다. 영구 볼륨은 삭제되지 않습니다.

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## 관리 패널 비밀번호 재설정

비밀번호를 잊었다면 Docker 호스트에 로그인하여 다음 명령을 실행합니다.

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

다음에 포트 `7991`에 접속하면 최초 비밀번호 설정 화면으로 돌아갑니다. 이 명령은 관리 패널 비밀번호, 로그인 세션, 로그인 실패 후 백오프 상태만 지웁니다. 애플리케이션 설정, 프록시 규칙, 인증서, 허용 목록, 로그 또는 데이터 볼륨은 삭제하지 않습니다.

## 계속 읽기

- [포트, 진입점 및 접근 경로](/ko/quick-start/ports-and-entrypoints)
- [접근 방식 선택](/ko/quick-start/run-modes)
- [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)
- [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)
