---
lang: ko-KR
title: "OpenWrt 배포"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 3076fc36bb7bde20f2fdd8c9dc1605cd0b20b836051ae4538814070f74f1b816
---

# OpenWrt 배포

`fn-knock` OpenWrt 패키지에는 LuCI 설정 페이지, 관리 패널, 인증 페이지, Rust 백엔드, Go 게이트웨이가 포함되어 있습니다. 설치 후 `서비스 → Knock`에서 서비스를 관리합니다. 관리 패널의 기본 포트는 `7991`, 게이트웨이 엔드포인트의 기본 포트는 `7999`입니다.

먼저 펌웨어에서 사용하는 패키지 형식과 대상 아키텍처를 구분합니다. 형식이 잘못되면 패키지 관리자로 설치할 수 없고, 아키텍처가 잘못되면 CPU가 비슷해 보여도 실행할 수 없습니다.

## 올바른 패키지 선택

### 패키지 형식은 펌웨어에 따라 결정

| 펌웨어 패키지 관리자 | 패키지 형식 | 일반적인 OpenWrt 버전 | 설치 명령 |
| --- | --- | --- | --- |
| `opkg` | `.ipk` | `24.10` 이하 | `opkg install /tmp/<파일명>.ipk` |
| `apk` | `.apk` | `25.12` 이상 | `apk add --allow-untrusted /tmp/<파일명>.apk` |

OpenWrt `25.12` 이상은 일반적으로 `apk`를 사용하고 `24.10` 이하는 일반적으로 `opkg`를 사용합니다. 파생 펌웨어나 업그레이드 중인 기기는 버전이 아니라 실제 설치된 패키지 관리자를 기준으로 판단합니다. 시스템 버전 번호나 파일 확장자만 보고 추측하지 말고 라우터에서 먼저 확인합니다.

```bash
ubus call system board
if command -v opkg >/dev/null 2>&1; then
  opkg print-architecture
else
  apk --print-arch
fi
```

### 펌웨어 아키텍처별 직접 다운로드

위 명령의 출력에서 정확한 대상 아키텍처를 확인한 다음 아래 표에서 해당 패키지를 바로 다운로드합니다. 각 링크는 공식 웹사이트에서 사용하는 직접 다운로드 URL이며 패키지 형식과 아키텍처가 이미 지정되어 있으므로 URL을 수정할 필요가 없습니다.

| 대상 아키텍처 | 일반적인 기기 | APK(OpenWrt 25.12 이상) | IPK(OpenWrt 24.10 이하) |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64비트 라우터 및 가상 머신 | [APK 다운로드](https://get.fnknock.cn/?type=apk&arch=x86_64) | [IPK 다운로드](https://get.fnknock.cn/?type=ipk&arch=x86_64) |
| `aarch64_cortex-a53` | IPQ60xx, Cortex-A53, ImmortalWrt `qualcommax/ipq60xx` | [APK 다운로드](https://get.fnknock.cn/?type=apk&arch=aarch64_cortex-a53) | [IPK 다운로드](https://get.fnknock.cn/?type=ipk&arch=aarch64_cortex-a53) |
| `aarch64_generic` | 범용 ARM64 라우터 및 개발 보드 | [APK 다운로드](https://get.fnknock.cn/?type=apk&arch=aarch64_generic) | [IPK 다운로드](https://get.fnknock.cn/?type=ipk&arch=aarch64_generic) |
| `arm_cortex-a7_neon-vfpv4` | 해당 타깃을 사용하는 32비트 ARMv7 기기 | [APK 다운로드](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a7_neon-vfpv4) | [IPK 다운로드](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a7_neon-vfpv4) |
| `arm_cortex-a5_vfpv4` | Cortex-A5 / VFPv4 라우터 | [APK 다운로드](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a5_vfpv4) | [IPK 다운로드](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a5_vfpv4) |

릴리스 패키지 파일명 끝에는 다음과 같이 OpenWrt 대상 아키텍처가 포함됩니다.

```text
fn-knock_<version>-<release>_x86_64.ipk
fn-knock_<version>-r<release>_aarch64_cortex-a53.apk
```

`opkg print-architecture` 또는 `apk --print-arch`가 출력하는 대상 이름을 그대로 기준으로 삼습니다. 특히 `aarch64_generic`과 `aarch64_cortex-a53`을 혼용하면 안 됩니다. 현재 패키지가 제공되지 않는 MIPS, ARMv6 또는 기타 대상에는 강제로 설치하지 않습니다.

패키지 마켓용 메타데이터 패키지가 아니라 `fn-knock` 메인 패키지를 다운로드합니다.

## 설치

아키텍처가 맞는 패키지를 라우터의 `/tmp`에 업로드한 뒤 펌웨어 유형에 맞는 명령 하나를 실행합니다.

```bash
# opkg 패키지 설치
opkg install /tmp/fn-knock_*.ipk

# apk 패키지 설치
apk add --allow-untrusted /tmp/fn-knock_*.apk
```

이 와일드카드 명령은 `/tmp`에 설치할 `fn-knock` 메인 패키지가 하나만 있다고 가정합니다. 여러 버전을 보관했다면 전체 파일명을 지정합니다.

`apk --allow-untrusted`는 신뢰할 수 있는 공식 릴리스 페이지에서 받고 출처 또는 체크섬을 확인한 로컬 설치 패키지에만 사용합니다. 패키지 저장소의 서명 검증을 건너뛰므로 출처를 알 수 없는 파일에 사용하면 안 됩니다. 오프라인 설치 전에도 펌웨어 패키지 저장소에서 필요한 의존성을 받을 수 있는지 확인합니다.

설치 스크립트는 서비스를 활성화하고 시작한 다음 LuCI 메뉴 캐시를 새로 고칩니다. LuCI의 로컬 패키지 업로드 메뉴에서도 설치할 수 있지만, 명령줄을 사용하면 실제 패키지 형식과 아키텍처를 더 명확히 확인할 수 있습니다.

## 처음 접속하기 및 포트

`서비스 → Knock`을 열어 서비스 상태가 '실행 중'인지 확인하고 `관리 패널 열기`를 누릅니다. 기본 주소는 다음과 같습니다.

```text
http://<OpenWrt LAN 주소>:7991/
```

처음 접속하면 관리 패널 비밀번호를 설정합니다. OpenWrt의 관리 엔드포인트만 보호하는 비밀번호이며, 사용자가 서비스에 접속할 때 쓰는 TOTP, 사용자 이름과 비밀번호 또는 패스키와는 별개의 자격 증명입니다.

| 포트 | 수신 범위 | 용도 |
| --- | --- | --- |
| `7991` | 설정 가능, 기본 관리 엔드포인트 | 관리 패널 |
| `7999` | 게이트웨이 수신 포트 | 매핑된 서비스의 외부 엔드포인트 |
| `17998` | `127.0.0.1` | Rust 관리 백엔드 내부 API |
| `7997` | `127.0.0.1` | 인증 서비스 |
| `7996` | `127.0.0.1` | 게이트웨이 내부 gRPC |

LuCI 페이지에서 이러한 포트, 데이터 디렉터리, 게이트웨이 설정 디렉터리를 변경할 수 있습니다. 설정을 적용하면 `procd`가 서비스를 다시 불러옵니다. 각 포트에는 서로 다른 값을 지정합니다.

WAN에서 `7991`로 들어오는 포워딩이나 허용 규칙을 만들지 않습니다. 인터넷에서 접속해야 한다면 실행 모드, 인증서, 접근 정책을 명확히 선택한 뒤 게이트웨이 포트 `7999`에만 필요한 방화벽 규칙이나 업스트림 포워딩을 구성합니다. 패키지 자체가 OpenWrt의 WAN 방화벽 정책을 대신하지는 않습니다.

서비스와 로그는 다음 명령으로 확인합니다.

```bash
/etc/init.d/fn-knock status
logread -e fn-knock
```

관리 패널이 열린다는 사실은 로컬 서비스가 시작되었다는 것만 뜻합니다. 매핑을 구성한 뒤에는 모바일 데이터 같은 실제 외부 네트워크에서 `7999`와 도메인을 검증합니다. LAN 테스트 결과로 인터넷 인증 결과를 판단하면 안 됩니다.

## 데이터 및 업그레이드

런타임 설정과 데이터의 기본 경로는 다음과 같습니다.

```text
/etc/config/fn-knock
/etc/fn-knock/gateway
/etc/fn-knock/data
```

`/etc/config/fn-knock`에는 UCI 포트와 디렉터리 설정, `/etc/fn-knock/gateway`에는 게이트웨이 런타임 설정, `/etc/fn-knock/data`에는 SQLite, 인증 키 및 기타 영구 데이터가 저장됩니다. 업그레이드 전에 세 경로를 모두 백업합니다. 민감한 정보가 들어 있으므로 공개 위치에 업로드하면 안 됩니다.

이전 버전에서 업그레이드할 때 UCI가 기본 `/var/lib/fn-knock`를 계속 사용하면 설치 스크립트가 서비스를 중지하고 기존 데이터를 `/etc/fn-knock/data`로 복사한 뒤 `fn-knock.main.data_dir`을 업데이트합니다. 사용자 지정 데이터 디렉터리는 강제로 마이그레이션하지 않습니다. LuCI 데이터 디렉터리, 관리 로그인 및 기존 설정을 확인하기 전에 이전 디렉터리를 삭제하지 않습니다.

유지보수 페이지에서도 `.knock` 설정 백업을 내보냅니다. 디렉터리 백업은 SQLite와 플랫폼 런타임 데이터를 보존하고 `.knock`는 복원 가능한 설정을 다른 환경으로 옮길 때 사용합니다. 내용 범위, 버전 제한, 복원 검증 절차는 [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)를 참고합니다.

OpenWrt에서는 관리 패널에서 FPK 업데이트를 설치할 수 없습니다. 위 직접 다운로드 표에서 같은 형식과 같은 펌웨어 아키텍처의 새 패키지를 받은 뒤 다음 명령을 실행합니다.

```bash
# opkg 패키지 설치: 새 버전 설치 또는 같은 버전 명시적 재설치
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk 패키지 설치
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

`/tmp`에 여러 버전이 남아 있다면 와일드카드 대신 전체 파일명을 사용하여 패키지 관리자에 여러 파일이 한꺼번에 전달되지 않도록 합니다.

업그레이드는 위 런타임 디렉터리를 자동으로 비우지 않습니다. 패키지 관리자가 수정된 `/etc/config/fn-knock` 처리 방법을 묻는다면 이번 업그레이드에서 기본 설정 복원이 명시적으로 필요하지 않은 한 기존 설정을 유지합니다.

OpenWrt 관리 패널 비밀번호를 잊었다면 SSH에서 다음 명령을 실행합니다.

```bash
fn-knock-reset-panel-password
```

그런 다음 LuCI의 관리 패널 엔드포인트로 돌아가 안내에 따라 새 비밀번호를 설정합니다.

## OpenWrt 버전의 기능 제한

| 기능 | OpenWrt 패키지 지원 상태 |
| --- | --- |
| 웹 관리 패널 FPK 업데이트 | 미지원. `opkg` 또는 `apk`로 아키텍처가 맞는 새 패키지를 설치합니다. |
| 직접 연결 모드, 호스트 방화벽 관리 | 미지원. OpenWrt 자체 방화벽, VPN 또는 상위 게이트웨이에서 원본 포트를 관리합니다. |
| Smart Connect | 미지원. OpenWrt의 `dnsmasq`, DHCP 또는 다른 로컬 DNS에서 분할 DNS를 직접 구성합니다. |
| SSH 보안 | 미지원. OpenWrt 자체 SSH 로그, 방화벽 또는 보안 플러그인을 사용합니다. |
| 웹 터미널 | 미지원 |
| 자동 HTTPS | 현재 OpenWrt 패키지에서는 미지원 |

`fn-knock`는 OpenWrt 펌웨어 업데이트, 라우터 설정 백업, 방화벽의 최소 노출 원칙을 대신하지 않습니다.

이어서 읽기:

- [포트, 엔드포인트 및 접근 경로](/ko/quick-start/ports-and-entrypoints)
- [접근 방식 선택](/ko/quick-start/run-modes)
- [백업, 복원 및 데이터 정리](/ko/guide/backup-and-restore)
- [대시보드 및 시스템 업데이트](/ko/guide/dashboard-and-update)
