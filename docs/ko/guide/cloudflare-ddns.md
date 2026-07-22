---
lang: ko-KR
title: "Cloudflare DDNS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 8cd64a630840b5b0f7efad9c106a1050b28fdd690c812b9d13d53ec3967cce27
---

# Cloudflare DDNS

Cloudflare DDNS는 API 토큰을 사용하여 지정한 Zone의 DNS 레코드를 업데이트합니다. 토큰에는 레코드를 수정할 권한이 있으므로 대상 Zone에 필요한 최소 DNS 권한만 부여하고 비밀번호처럼 안전하게 보관합니다.

## 토큰 만들기

1. Cloudflare의 API 토큰 페이지에서 토큰을 만들고 “Edit zone DNS” 템플릿을 선택하거나 이를 기반으로 설정합니다.
2. 권한 범위를 대상 Zone으로 제한하고 Global API Key는 사용하지 않습니다.
3. 필요하다면 Cloudflare에서 제공하는 토큰 검증 명령으로 토큰 상태를 확인합니다.
4. 토큰은 fn-knock의 DDNS 자격 증명에만 입력하고 스크린샷, 로그 또는 공개 설정 파일에 넣지 않습니다.

Cloudflare의 토큰 페이지와 권한 이름은 변경될 수 있으므로 [공식 토큰 문서](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)를 기준으로 확인합니다.

## fn-knock에 입력

`DDNS`에서 Cloudflare를 선택하고 다음 항목을 입력합니다.

| 필드 | 설명 |
| --- | --- |
| `API 토큰` | 대상 Zone의 DNS를 편집할 수 있는 토큰 |
| `Zone ID` | Cloudflare Zone 개요에 표시되는 ID이며 Zone 이름이 아님 |
| `도메인` | 관리할 전체 DNS 이름. 단일 이름 또는 루트 도메인과 와일드카드 도메인 쌍 지원 |
| `Proxied` | `DNS only` 또는 `Orange cloud` |

도메인에는 `auth.example.com`과 같은 DNS 이름만 입력하고 `https://`, 경로 또는 포트를 붙이지 않습니다. 루트 도메인과 와일드카드 도메인 쌍(예: `example.com`, `*.example.com`)을 설정하면 fn-knock가 두 레코드를 각각 업데이트합니다. 이때 먼저 Cloudflare API를 통해 루트 도메인이 입력한 Zone ID에 속하는지도 확인합니다.

실제 네트워크 환경에 따라 IPv4, IPv6 또는 듀얼 스택을 선택합니다. 저장한 뒤 페이지에서 먼저 테스트를 실행하고 Cloudflare DNS 목록에서 레코드 유형, 이름 및 주소를 확인합니다.

업데이트할 때 fn-knock는 도메인 이름과 레코드 유형으로 기존 레코드를 찾습니다.

- IPv4는 `A` 레코드에 해당합니다.
- IPv6는 `AAAA` 레코드에 해당합니다.
- 레코드가 있으면 업데이트하고 없으면 새로 만듭니다.
- TTL은 Cloudflare 자동 값을 사용합니다.
- 듀얼 스택에서는 A와 AAAA를 각각 처리하며 어느 하나라도 실패하면 로그에 기록됩니다.

Zone ID, 토큰 또는 도메인이 서로 맞지 않으면 실제 레코드를 수정하기 전에 테스트에서 오류가 발생합니다. 같은 Zone ID로 다른 루트 도메인을 업데이트하면 안 됩니다.

## 프록시 상태

Cloudflare의 ‘프록시됨’ 상태는 접속 경로를 바꿉니다. 게이트웨이가 비표준 포트를 사용하거나 오리진에 직접 연결해야 한다면 먼저 DNS 전용 모드를 사용하는 것이 일반적입니다. 프록시 사용 가능 여부는 Cloudflare가 지원하는 포트, SSL 모드 및 현재 서비스 유형에 따라 달라집니다. ‘오렌지 클라우드’를 DDNS의 필수 설정으로 생각하면 안 됩니다.

오렌지 클라우드를 선택하면 외부 DNS 조회에서 가정의 공인 IP가 아니라 Cloudflare 엣지 주소가 반환되며 이는 정상입니다. 이 경우 실제 클라이언트 IP, Cloudflare SSL 모드, 오리진 포트 및 캐시 규칙을 각각 별도로 설정합니다. Cloudflare로 동적 DNS만 관리하려면 `DNS only`를 선택하는 편이 문제 해결에 유리합니다.

## 테스트 실패

| 오류 유형 | 확인할 항목 |
| --- | --- |
| Zone 조회 실패 | 토큰이 유효한지, Zone ID가 올바른지, 서버에서 Cloudflare API에 접속할 수 있는지 확인 |
| Zone 불일치 | 도메인 루트가 실제로 해당 Zone에 속하는지, 다른 계정이나 Zone의 ID를 잘못 입력하지 않았는지 확인 |
| 레코드 검색 실패 | 토큰에 Zone DNS Read/Edit 권한이 있는지, Cloudflare API의 속도 제한이 적용되었는지 확인 |
| 생성 또는 업데이트 실패 | 레코드 유형 충돌, 같은 이름의 CNAME, 프록시 상태 제한 및 API 응답 세부 정보 확인 |

DDNS 업데이트에 성공해도 도메인이 해석되는지, 외부 네트워크에서 엔드포인트에 도달하는지, TLS 인증서가 일치하는지, 요청이 최종적으로 fn-knock에서 처리되는지를 확인합니다. Cloudflare의 [동적 DNS 참고 문서](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/)도 참고합니다.

- [DDNS 관리](/ko/guide/ddns)
- [인증서 및 HTTPS](/ko/guide/ssl)
