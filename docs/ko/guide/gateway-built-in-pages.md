---
lang: ko-KR
title: "게이트웨이 내장 페이지"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2a965da8ae338020a10c85ef93b02e978cf6541fa3e850aeb7cfb0458bdf315f
---

# 게이트웨이 내장 페이지

내장 페이지에는 매핑이 필요하지 않습니다. fn-knock 게이트웨이로 해석되고 전달되는 임의의 서브도메인 뒤에 내장 경로를 붙여 열 수 있습니다.

```text
https://nas.example.com/__select__
https://nas.example.com/__wol__
```

경로는 정확히 일치해야 합니다. `/__select__/`와 `/__wol__/`은 내장 페이지가 아닙니다. 서브도메인은 실제로 게이트웨이에 도달해야 하며 인증서, CDN, 리버스 프록시 또는 터널이 도메인과 `Host`를 올바르게 처리해야 합니다.

## 애플리케이션 선택: `/__select__`

`https://게이트웨이에 연결된-임의의-서브도메인/__select__`를 열면 애플리케이션 선택 페이지가 표시됩니다. 로그인하지 않은 경우 먼저 로그인하며, 로그인 후에는 현재 자격 증명으로 접근 가능한 서비스만 표시됩니다.

![애플리케이션 선택 페이지](/images/gateway-built-in-pages/service-selection.webp)

사용자 지정 서비스 범위에서는 `인증 설정 → 권한`에서 내장 선택 페이지를 선택해야 합니다. 이 페이지를 연다고 권한 없는 서비스에 접근할 수 있는 것은 아닙니다.

## Wake-on-LAN: `/__wol__`

`https://게이트웨이에 연결된-임의의-서브도메인/__wol__`를 열면 활성화된 장치를 확인하고 깨우기 요청을 보낼 수 있습니다.

![Wake-on-LAN 페이지](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

다음 조건을 모두 충족해야 합니다.

1. `시스템 설정 → 기능 → Wake-on-LAN`에서 WOL을 켭니다.
2. `시스템 설정 → 게이트웨이 → 포털`에서 Wake-on-LAN 바로가기를 켭니다.
3. 로그인합니다. 사용자 지정 서비스 범위에서는 내장 Wake-on-LAN 페이지도 선택합니다.

바로가기를 끄면 `/__wol__`은 Not Found를 반환하며 업스트림으로 전달되지 않습니다.

## 로그인 대체: `/__auth__/…`

`/__auth__`는 모든 서브도메인에서 자동으로 쓰이는 로그인 입구가 아닙니다.

| 상황 | 로그인 주소 |
| --- | --- |
| 애플리케이션 서브도메인이 설정된 루트 도메인 아래에 있고 Cookie를 공유할 수 있음 | `auth.example.com` 같은 통합 인증 Host |
| 애플리케이션 서브도메인이 루트 도메인 Cookie 범위 밖에 있어 세션을 공유할 수 없음 | 해당 서브도메인 자체의 `/__auth__/login` |

루트 도메인이 `example.com`이고 인증 Host가 `auth.example.com`이면 `nas.example.com`은 통합 로그인을 사용합니다. `nas.other-example.net`은 다음 주소에서 별도로 로그인합니다.

```text
https://nas.other-example.net/__auth__/login
```

이 세션은 현재 서브도메인에만 속하므로 `example.com` 아래 서비스와 공유할 수 없습니다. `/__auth__/…`에는 로그아웃, OIDC 콜백 등의 인증 엔드포인트도 있으므로 공개 API로 사용하지 마십시오.

- [게이트웨이 포털](/ko/guide/gateway-portal)
- [Wake-on-LAN(원격 깨우기)](/ko/guide/wake-on-lan)
- [세션, 출발지 IP 허용 및 IP 변경](/ko/guide/session-management)
