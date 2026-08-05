---
lang: ko-KR
title: "cloudflared 기반 Cloudflare Tunnel"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff0db45d864b571554efb273368b024d0a2ba556678b1503ed9a5a32cc1ac9f
---

# cloudflared 기반 Cloudflare Tunnel

cloudflared는 내부 네트워크에서 Cloudflare Tunnel로 연결하고 외부 요청을 fn-knock 게이트웨이에 전달합니다. fn-knock 관리 모드를 권장합니다. Cloudflare API Token을 입력하면 Zone과 Account 검색, Tunnel 생성 또는 연결, 와일드카드 DNS와 Ingress 관리, Tunnel Token 가져오기 및 cloudflared 시작을 자동으로 처리합니다. 일반 구성에서는 Cloudflare 대시보드에 Public Hostname을 하나씩 추가할 필요가 없습니다.

새 배포에서는 `터널 → 서브도메인 매핑`을 사용합니다. Cloudflare가 원래 Host를 유지하면 fn-knock가 `auth.example.com`, `nas.example.com` 등의 요청을 로컬 서비스로 분배합니다. 경로 모드는 기존 단일 도메인 경로 엔드포인트를 유지할 때만 사용합니다.

## 시작 전 준비

1. `시스템 설정 → Cloudflared`에서 리소스를 다운로드하고 준비 완료 상태를 확인합니다.
2. `시스템 설정 → 모드`에서 `터널 → 서브도메인 매핑`을 선택합니다.
3. 루트 도메인, 인증 서비스 및 하나 이상의 서비스 매핑을 저장합니다.
4. 대상 Account와 Zone으로 제한한 Cloudflare Account API Token을 만듭니다.

### 권장: Account API Token 만들기

Account API Token은 개인 사용자가 아니라 Cloudflare Account에 속합니다. 만든 사용자가 Account에서 나가더라도 그 이유만으로 비활성화되지 않으므로 fn-knock처럼 장기간 실행되는 서비스에 적합합니다. 만들려면 해당 Account의 Super Administrator 권한이 필요합니다. 이 권한이 없을 때만 사용자 API Token을 사용합니다.

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인합니다.
2. `Manage Account → Account API Tokens`를 열고 Zone을 소유한 Account를 선택합니다.
3. `Create Token`을 선택해 사용자 지정 Token을 만들고 이름을 `fn-knock Cloudflare Tunnel` 등으로 지정합니다.
4. 아래의 Account 및 Zone 권한을 추가합니다.
5. `Account Resources`에서는 현재 Account만 선택하고 `Zone Resources`에서는 fn-knock 루트 도메인이 속한 Zone만 선택합니다.
6. 필요하면 만료 날짜를 설정합니다. 기기의 공인 출구 IP가 고정일 때만 Client IP 제한을 사용합니다. 그렇지 않으면 네트워크 변경으로 Token이 갑자기 작동하지 않을 수 있습니다.
7. `Continue to summary`를 선택해 불필요한 권한과 리소스가 없는지 확인한 다음 `Create Token`을 선택합니다.
8. Secret은 한 번만 표시됩니다. fn-knock의 `API 연결` 입력란에 바로 복사해 연결하고 문서, 스크린샷 또는 채팅에 저장하지 않습니다.

현재 대시보드 경로는 Cloudflare의 [Account API Token 공식 문서](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)를 참고합니다. 사용자 API Token은 `My Profile → API Tokens`에서 만들 수 있지만 개인 계정 수명 주기를 따르므로 장기 배포보다 임시 테스트에 적합합니다.

기본 관리 구성에는 다음 권한이 필요합니다.

- `Account / Cloudflare Tunnel / Edit`
- `Zone / Zone / Read`
- `Zone / DNS / Edit`

최적화 Beta에는 다음 권한도 필요합니다.

- `Zone / SSL and Certificates / Edit`

Token은 루트 도메인이 속한 활성 Zone을 읽을 수 있어야 합니다. 루트는 Zone 자체 또는 하위 도메인일 수 있습니다. 예를 들어 `tu.example.com`을 입력하면 상위 `example.com` Zone까지 검색합니다. API Token과 Account API Token을 모두 지원합니다. Global API Key 또는 Token을 스크린샷, Issue, 공개 로그에 넣지 않습니다. 노출된 Token은 즉시 교체합니다.

## 관리 모드 설정

`터널 → Cloudflared`를 엽니다. 모든 영역을 접을 수 있으며 실행 상태와 로그가 맨 위에서 기본으로 펼쳐집니다.

### 1. Cloudflare 연결

`API 연결`을 펼치고 API Token을 붙여넣은 뒤 연결합니다. 성공하면 검색한 Zone이 표시됩니다. 이후 읽기 API에서는 평문 Token을 반환하지 않습니다.

연결에 실패하면 Zone 상태와 Token의 리소스 범위를 확인합니다. Zone 읽기만 가능하고 DNS 편집 권한이 없는 Token은 연결에 성공하더라도 미리 보기 또는 적용 단계에서 실패할 수 있습니다.

### 2. Tunnel 선택

`Tunnel 및 도메인 동기화`를 펼칩니다.

- `전용 Tunnel`: 권장 옵션입니다. fn-knock가 인스턴스 식별자가 있는 Tunnel을 만들고 자체 구성만 관리합니다.
- `기존 Tunnel`: Cloudflare에서 원격 관리 중인 Cloudflared Tunnel을 재사용합니다. 다른 Ingress와 순서를 유지하고 fn-knock 와일드카드 규칙을 종료 규칙 앞에 배치합니다.

`미리 보기`를 실행하면 생성, 업데이트 또는 유지할 Tunnel, Ingress, DNS 및 최적화 리소스를 확인할 수 있습니다. 계획은 10분 동안 유효합니다. 적용 전에 원격 상태가 변경되면 다시 미리 봅니다. 이름이 같지만 fn-knock 소유가 아닌 리소스는 충돌로 표시되고, 항목별 인계를 명시적으로 승인한 경우에만 변경합니다.

기본 관리 구성은 다음 상태를 자동으로 유지합니다.

```text
*.example.com  -> <tunnel-id>.cfargotunnel.com (프록시 CNAME)
*.example.com  -> fn-knock 전용 로컬 Tunnel 진입점 (Ingress)
마지막 규칙    -> HTTP 404
```

적용 후 fn-knock는 Cloudflare 공식 API로 Tunnel Token을 가져오고 권한이 `0600`인 Token 파일을 사용해 cloudflared를 시작합니다. 프로세스 인자에 Token이 나타나지 않습니다.

### 3. 외부 접속 확인

관리 Cloudflare Tunnel은 표준 HTTPS 주소를 제공합니다.

```text
https://auth.example.com/
https://nas.example.com/
```

주소 뒤에 `:7999`를 붙이지 않습니다. 이전 공개 HTTPS 포트 설정이 남아 있어도 Cloudflare Tunnel 모드에서는 서브도메인 목록, 인증 주소 및 로그인 리디렉션에서 해당 포트를 제외합니다. 외부 `443`은 Cloudflare가 처리하고 로컬 Tunnel 진입점은 fn-knock가 자동으로 관리합니다.

새 서비스 Host를 저장하면 와일드카드 Tunnel을 통해 즉시 동작하므로 대시보드에 Public Hostname을 추가할 필요가 없습니다. 최적화를 사용하면 정확한 도메인 리소스를 백그라운드에서 동기화하며, 준비 전까지 와일드카드 Tunnel이 계속 서비스합니다.

## 최적화 Beta

최적화는 현재 기기에서 Cloudflare Anycast IPv4까지 실제 품질을 측정하고 Cloudflare for SaaS Custom Hostname으로 정확한 서비스 도메인에 우선 경로를 추가합니다. 표준 와일드카드 Tunnel은 항상 대체 경로로 유지됩니다.

### 활성화 순서

1. `Tunnel 및 도메인 동기화`에서 `최적화 Beta`를 켭니다.
2. `미리 보기`를 실행하여 요금제 기능, 권한, 리소스 변경 및 충돌을 확인합니다.
3. 계획을 적용합니다. “Cloudflare 조정 계획에서 먼저 최적화를 활성화”하라는 메시지는 이 단계가 완료되지 않았다는 뜻입니다.
4. `최적화 Beta`를 펼치고 속도 테스트를 실행합니다.
5. 추천 IP 또는 검증된 다른 후보를 적용합니다.

fn-knock는 격리된 호스트 이름으로 현재 Zone의 Custom Hostname, 인증서 발급 및 SNI 직접 연결 지원을 먼저 확인합니다. 지원되지 않으면 최적화만 비활성화하고 기본 Tunnel에는 영향을 주지 않습니다.

### 후보 출처

후보는 다음 출처에서 가져옵니다.

- Cloudflare 공식 IPv4 범위의 결정적 샘플.
- 기본 공개 호스트 이름: 스웨덴 정부 `www.gov.se`, 미국 의회도서관 `www.loc.gov`, ICANN `www.icann.org`, Visa `www.visa.com`.
- 사용자가 추가한 공개 후보 호스트 이름(최대 16개).

공개 호스트 이름은 가능한 Cloudflare IPv4를 찾는 용도로만 사용합니다. 서비스 CNAME을 해당 호스트로 지정하거나 해당 Host/SNI로 서비스 트래픽을 보내지 않습니다. 유효하지 않은 주소, 사설 주소 및 일반적인 Fake IP는 제외합니다. 로컬 DNS가 Fake IP 모드라면 실제 해석 결과를 제공할 다른 출처를 추가합니다.

IP 등록 기관 또는 GeoIP에 “미국”이라고 표시되어도 요청이 미국에 도착한다는 뜻은 아닙니다. Cloudflare IPv4는 Anycast이므로 같은 주소를 여러 엣지 위치에서 알립니다. 결과의 `Cloudflare colo`는 실제 프로브의 `CF-Ray` 접미사(예: `SIN`, `HKG`)에서 가져오며 해당 연결의 도착 위치를 더 잘 나타냅니다.

### 측정 및 전환

한 번의 테스트는 최대 128개 후보와 32개 동시 프로브를 사용합니다. 후보마다 TLS/지연 시간 프로브를 3회 실행하고 상위 8개 후보는 1 MiB 다운로드를 두 번 수행합니다. 총 다운로드는 20 MiB 이하입니다. 점수가 낮을수록 좋습니다.

```text
중앙 지연 시간 + 2 × 지터 + 1500 × 손실률 + 800 / max(다운로드 Mbps, 1)
```

실제 서비스 Host에 대한 TLS, SNI 및 Cloudflare 오류 페이지 검사도 통과해야 합니다. ping 또는 IP 위치만으로 후보를 적용할 수 없습니다. 자동 정책은 7일마다 다시 측정하고 현재 IP를 15분마다 확인합니다. 새 후보가 15% 이상 좋아야 하며 10분 간격의 두 확인에서 우위를 유지한 후에만 전환합니다.

현재 IP가 연속으로 실패하면 검증된 후보를 우선 사용합니다. 사용 가능한 후보가 없으면 fn-knock가 관리하는 정확한 CNAME을 제거해 도메인을 와일드카드 Tunnel로 되돌립니다. 언제든 `표준 Tunnel로 되돌리기`를 선택할 수 있습니다.

### 요금제 및 안전 경계

최적화는 Cloudflare for SaaS Custom Hostname을 사용합니다. 사용 가능 여부와 수량은 Zone의 실제 요금제와 할당량을 따릅니다. 할당량을 초과한 서비스 도메인은 표준 Tunnel을 사용합니다. Custom Hostname과 인증서가 모두 활성 상태가 되기 전에는 정확한 CNAME을 게시하지 않습니다.

프록시 상태의 서비스 A 레코드를 Cloudflare 엣지 IP로 직접 지정하지 않습니다. Cloudflare Error 1000이 발생할 수 있습니다. fn-knock는 Custom Hostname, 전용 오리진 호스트 이름 및 DNS-only 최적화 진입점을 조합하며, 기능 프로브가 실패하면 와일드카드 Tunnel을 유지합니다.

## 클라이언트 IP와 로그인 리디렉션

관리 모드는 루프백에서만 수신하는 전용 Tunnel 진입점을 사용합니다. 게이트웨이는 이 제어된 경로에서만 Cloudflare의 `CF-Connecting-IP`를 신뢰하고 방문자가 직접 보낸 `X-Forwarded-For`는 신뢰하지 않습니다. EdgeOne/ESA 실제 IP 옵션은 Cloudflared에 적용되지 않으며 현재 모드에서 사용할 수 없으면 숨겨집니다.

모바일 네트워크에서 로그인이 필요한 서비스 Host를 열고 요청 로그에서 다음을 확인합니다.

- 리디렉션이 `https://auth.example.com/...`이고 `:7999`가 없습니다.
- `redirect_uri`가 원래 서비스 Host이며 `:7999`가 없습니다.
- 클라이언트 IP가 방문자의 공인 IP이며 `127.0.0.1`, 컨테이너 주소 또는 임의의 `X-Forwarded-For`가 아닙니다.

## 수동 Tunnel Token 모드

고급 사용자는 `수동 Tunnel Token`을 펼쳐 Cloudflare에서 받은 Tunnel Token과 전송 프로토콜을 설정할 수 있습니다. `자동`은 QUIC를 먼저 시도하고 실패하면 HTTP/2로 전환합니다. UDP `7844`가 확실히 차단된 경우에만 HTTP/2로 고정합니다.

수동 모드는 Tunnel, DNS 또는 Ingress를 만들지 않습니다. Cloudflare에서 Public Hostname과 오리진 Service를 직접 설정합니다. 직접 관리하는 프로세스 또는 Windows 설치도 수동 구성입니다. 실제 게이트웨이 포트를 오리진으로 사용할 수 있지만 설치, Token, 로그 및 수명 주기는 관리 모드의 대상이 아닙니다.

## 연결 해제 및 정리

API Token을 삭제하면 이후 원격 관리만 중지되며 Cloudflare 리소스는 삭제되지 않습니다. `관리 리소스 제거`에서 정리 계획을 미리 보고 확인합니다.

- 기존 Tunnel은 자동으로 삭제하지 않습니다.
- fn-knock가 만든 전용 Tunnel도 명시적으로 확인한 후에만 삭제합니다.
- 최적화 리소스를 정리할 때 정확한 서비스 도메인을 먼저 와일드카드 Tunnel로 되돌립니다.

## 문제 해결

| 증상 | 우선 확인 항목 |
| --- | --- |
| Zone을 찾지 못했거나 비활성 상태 | 루트가 Token의 Account/Zone 범위에 있는 활성 Zone에 속하는지 확인 |
| DNS Edit 권한이 필요함 | 대상 Zone에 `Zone / DNS / Edit`가 있는지 확인 |
| DNS tag 할당량이 0 | comment-only 소유 표시를 지원하는 버전으로 업데이트하고 다시 미리 보기. 중복 레코드를 직접 만들지 않음 |
| 미리 보기 후 적용이 409 | 원격 상태 또는 로컬 루트가 변경되었으므로 다시 미리 보기 |
| Tunnel은 온라인이지만 도메인이 동작하지 않음 | 동기화 충돌, 와일드카드 DNS, Ingress, Cloudflared 로그 및 Host 매핑 |
| 리디렉션에 `:7999`가 남음 | `터널 → 서브도메인 매핑`, 기본 Tunnel이 Cloudflared인지, 표준 포트 리디렉션 지원 버전인지 확인 |
| 최적화를 활성화할 수 없음 | SSL 권한, Cloudflare for SaaS, Custom Hostname 할당량 및 기능 프로브 |
| IP 위치가 미국으로 표시됨 | 스캔의 Cloudflare colo 코드를 확인. Anycast 등록 위치는 연결 도착지가 아님 |
| 모든 요청이 로컬처럼 보임 | 요청 로그의 클라이언트 IP와 잘못된 수동 오리진 대신 전용 관리 진입점을 사용하는지 확인 |

전체 실행 상태는 [터널](/ko/guide/tunnel), Host 설정은 [서브도메인 매핑](/ko/guide/subdomain-proxy)을 참고합니다.
