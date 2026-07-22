---
lang: zh-TW
title: "路徑回應"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 7a3dd9fcebcc2f25c1b353c79143910804695115e4ab1463f74404a067c7bd21
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 路徑回應

`系統設定 → 閘道 → 路徑回應` 可替特定服務 Host 加上少量 Path-level 規則。它只可在採用 Host 路由的子網域模式中編輯，包括公網直達的 `子網域模式` 與 `內網穿透 → 子網域映射`；路徑模式和直連模式不提供此功能。Host 仍是主要路由；請求未命中路徑規則時，會回到該 Host 映射的預設 Target。

此功能適合 Health Check、固定狀態回應，或將同一 Host 下的一小段 API 轉送至另一個上游。若需要用大量路徑區分不同應用程式，請使用相容用途的[路徑映射](/zh-tw/guide/reverse-proxy)，不要在 Host 路由上重新打造一套 Path Gateway。

## 比對順序

```text
api.example.com/healthz -> 固定回應 200 ok
api.example.com/v2/*    -> http://127.0.0.1:8080
api.example.com/其他路徑 -> Host 預設 Target
```

請先選擇既有的服務 Host。身分驗證服務 Host 不會出現在可選清單中。

路徑必須以 `/` 開頭，但不可為根路徑 `/`。下列路徑保留給身分驗證、分享或內部功能使用，無法設定：

- 以 `/__` 開頭的路徑
- `/s`
- `/s/`

每個 Host 下，相同比對方式與相同路徑只能有一條規則。

## 規則欄位

| 欄位 | 可用值 | 行為 |
| --- | --- | --- |
| `比對方式` | 完全符合／Prefix | 只比對完整路徑，或比對該 Prefix 及其子路徑 |
| `動作` | 反向 Proxy／固定回應 | 轉送至另一個上游，或直接由閘道回應 |
| `Target URL` | HTTP / HTTPS URL | 只供反向 Proxy 動作使用 |
| `移除比對路徑` | 開／關 | 將 `/api/users` 以 `/users` 送出，或保留原始路徑 |
| `Rewrite HTML 路徑` | 開／關 | 替頁面資源補上 Path Prefix；純 API 通常不需要 |

固定回應可設定 `100` 至 `599` 的 Status Code、`Content-Type`、Response Body 與自訂 Response Header。`Connection`、`Content-Length`、`Content-Type`、`Transfer-Encoding`、`Upgrade` 等 Transport-level Header 無法在自訂 Header 中覆寫；Content Type 請使用專用欄位設定。

## 繼承 Host 的存取原則

路徑回應會繼承目前 Host 的 `要求登入` 與既有嚴格允許清單規則，並不是繞過存取控制的入口。

反向 Proxy 動作會將 Host 的 `略過 Basic Auth` 憑據注入送往實際 Target 的請求，用來通過 Target Service 本身的 Basic Auth；這不是 fn-knock 的訪客登入憑據。Proxy Header 與 Host 保留會依該實際 Target 共用的 Runtime 規則決定，可能與 Host 預設 Target 的設定不同。固定回應沒有上游，因此不會傳送 Basic Auth、Proxy Header 或與 Host 保留相關的 Request Header。

來源為 Loopback、私有網路或 Link-local IP 時，身分驗證服務會回傳 `local_exempt`。因此，從區域網路存取時可能不會觸發登入流程或嚴格允許清單拒絕；公網原則必須從真實外部網路驗證。

## 範例

Health Check：

```text
路徑         /healthz
比對         完全符合
動作         固定回應
Status Code  200
Content-Type text/plain; charset=utf-8
Body         ok
```

API 獨立轉送至上游：

```text
路徑        /api
比對        Prefix
動作        反向 Proxy
Target      http://127.0.0.1:8080
移除路徑    開
```

## 平台限制

路徑回應可用於飛牛 FPK、Docker、OpenWrt、Linux、群暉 DSM 7 SPK 與 Windows 採用 Host 路由的子網域模式，包括 `內網穿透 → 子網域映射`。它不會開放防火牆連接埠、建立 DNS Record 或發布 Docker Port，也無法讓原本無法連線的 Target 變成可達。

## 疑難排解

1. 確認目前使用 Host 路由，且已選取正確的服務 Host。
2. 檢查路徑格式、保留路徑，以及完全符合／Prefix 的比對方式。
3. 先判斷請求是否遭 Host 的登入或允許清單原則攔截。
4. 從 fn-knock 的 Runtime 環境存取反向 Proxy Target。
5. 在[請求記錄](/zh-tw/guide/request-logs)中核對 Host、路徑、路由類型、Status Code 與上游 Target。

Host 主要路由請參閱[子網域映射](/zh-tw/guide/subdomain-proxy)，相關全域選項請參閱[系統設定](/zh-tw/guide/system)。
