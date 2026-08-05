---
lang: zh-TW
title: "內網穿透：子網域路由"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 989de42249c3a4f69bda7bfd0bae96d4cf7447b2fc62bde261cc6ae102db2f90
---

# 內網穿透：子網域路由

本方案適用於沒有公網入站能力、無法設定 Port Forwarding，或希望透過 FRP、Cloudflared 提供公網入口的環境。公網流量會先經由 Tunnel 抵達 fn-knock 閘道，再依存取網域名稱轉送至業務服務。

- 網路拓撲：內網穿透
- 路由方式：依 `Host` 區分服務
- 建議原則：優先登入
- 後台位置：`系統設定 → 模式 → 內網穿透 → 子網域映射`

子網域映射是內網穿透的預設方案。`路徑模式` 只用於相容舊設定，或必須部署在 URL Path Prefix 下的應用程式。

## 開始前

需要準備：

- 一個可管理 DNS 的網域名稱，例如 `example.com`。
- FRP Server，或可用的 Cloudflare Tunnel。
- 至少一種可用的登入方式。
- fn-knock 所在裝置能夠存取業務服務。

fnOS FPK、Docker、OpenWrt、Linux、macOS 與 Synology DSM 7 SPK 都可使用應用程式內建 Tunnel。Windows x86_64 不提供內建 FRP / Cloudflared；若要在同一台 Windows 主機上自行執行 Tunnel Client，建議將 Origin 指向本機 `127.0.0.1:7999`，其安裝與維護不由 fn-knock 管理。Docker 中的 `127.0.0.1` 是 Container 本身；若上游位於主機或區域網路中的其他裝置，請填入 Container 可存取的位址。

## 請求路徑

外部請求會依序經過：

1. `auth.example.com` 或 `nas.example.com` 的公網入口。
2. FRP 或 Cloudflared Tunnel。
3. fn-knock 實際使用的閘道連接埠。fnOS 原生 FPK、Docker Compose、OpenWrt、Linux、macOS、Synology DSM 7 SPK 與 Windows 預設使用 `7999`。Windows 自管 Tunnel 建議優先回源至同一台主機的 Loopback 位址。
4. 身分驗證服務或對應的業務上游。

Tunnel 必須將原始 `Host` 傳給 fn-knock。所有網域名稱都指向同一個本機閘道，後續再由 fn-knock 完成路由。

## 1. 選擇內網穿透與子網域映射

前往 `系統設定 → 模式`：

1. 選擇 `內網穿透`。
2. 路由方式選擇 `子網域映射`。
3. 儲存設定。

儲存後，側邊欄應顯示 `子網域映射` 及內網穿透相關入口。

從其他模式切換時，請檢查既有路由、憑證與身分驗證位址。路徑模式中的映射不能直接當成子網域映射使用。

## 2. 設定根網域與身分驗證服務

前往 `子網域映射`，展開 `子網域模式設定`，在 `網域名稱` 中填入 `example.com` 並儲存。接著按一下 `新增身分驗證服務`，加入 `auth.example.com`。使用託管 Cloudflare Tunnel 時，訪客透過標準 HTTPS `443` 存取，介面不會要求填寫公網 Port，產生的驗證位址也不會附加 `:7999`。

身分驗證服務需要符合以下條件：

- 允許公開存取。
- 舊版映射若仍帶有嚴格允許清單規則，不能直接作為身分驗證服務；請記下原設定後重新建立。
- 作為唯一且目前生效的身分驗證入口。
- 可透過 Tunnel 抵達本機 fn-knock 閘道。

先確認能從外部網路開啟身分驗證位址，再設定業務映射。

## 3. 新增業務映射

前往 `子網域映射`，加入業務服務。例如：

| 設定項目 | 範例 |
| --- | --- |
| 子網域 | `nas` |
| 目標 | `http://192.168.1.20:5666` |
| 要求登入 | 開啟 |

儲存後，公網入口為 `https://nas.example.com`。

若上游需要 HTTP Basic Auth，請在映射的進階設定中啟用 `略過 Basic Auth`，並填入上游憑證。這組憑證供 fn-knock 連線至上游使用，不能取代訪客登入。

## 4. 設定存取原則

編輯 Host 映射時，目前介面會提供 `要求登入` 開關：

| 設定 | 行為 |
| --- | --- |
| 關閉 `要求登入`（目前優先登入映射） | 公開存取，不檢查 fn-knock 登入狀態與 IP 允許清單 |
| 開啟 `要求登入` | 沒有有效的來源授權時，依工作階段與憑證範圍繼續判斷 |
| 舊版嚴格允許清單規則 | 即使關閉 `要求登入` 也不一定公開；只依有效的來源授權記錄判斷（手動加入或登入後自動建立），工作階段 Cookie 本身不能取代來源條件 |

大多數 Tunnel 情境都應開啟 `要求登入`。目前介面不提供嚴格允許清單選項；若要退出舊版嚴格規則，需要透過目前介面重新建立映射，單獨關閉 `要求登入` 並不足以將其公開。請勿將 Cloudflare、FRP 或其他 Proxy 節點的出口 IP 當成訪客固定 IP 加入允許清單，否則所有請求可能會被視為同一個來源。

## 5. 設定 Tunnel

請先在 `系統設定` 中準備 FRP 或 Cloudflared 資源，再前往內網穿透頁面建立並啟動 Tunnel。

### 使用 Cloudflared

1. 在 `系統設定 → Cloudflared` 準備好執行檔資源。
2. 進入 `內網穿透 → Cloudflared`，連接建議的 Cloudflare Account API Token，並授予 Tunnel、Zone Read 與 DNS Edit 權限。
3. 選擇建議的專用 Tunnel，按下 `預檢` 查看即將建立的 Tunnel、`*.example.com` Ingress 與代理 CNAME。
4. 處理衝突後套用計畫。fn-knock 會取得 Tunnel Token 並啟動 Cloudflared。

套用後，`auth.example.com`、`nas.example.com` 等已知 Host 都會透過 Wildcard Tunnel 進入閘道，不必在 Cloudflare Zero Trust 中逐筆設定 Public Hostname。訪客使用 `https://nas.example.com`，不要附加 `:7999`。

進階使用者可使用手動 Tunnel Token；只有手動或外部自管 Cloudflared 才需自行設定 Public Hostname 與實際 Origin Port。完整說明請參閱 [Cloudflared Tunnel 設定](/zh-tw/guide/cloudflared-tunnel)。

### 使用 FRP

FRP Server 需要將外部 HTTP 或 HTTPS 流量轉送至 fn-knock 實際使用的閘道連接埠，並保留原始 Host。身分驗證網域名稱與業務網域名稱可共用同一個閘道入口。

外部連接埠、憑證與 DNS 取決於 FRP Server 的部署方式。請勿將 fn-knock 管理入口暴露為 FRP 的業務回源端點。

## 6. 檢查 HTTPS 與公開身分驗證位址

由 Edge Platform 終止 TLS 時，瀏覽器看到的公開位址應使用 HTTPS，fn-knock 的登入重新導向位址也必須與其一致。若公開位址與本機回源使用不同 Protocol，請勿將本機 HTTP 位址寫入訪客可見的身分驗證 URL。

若由 FRP 直接提供 HTTPS，應在 FRP Server 或 fn-knock 閘道設定涵蓋所有子網域的憑證。相關說明請參閱 [SSL 憑證](/zh-tw/guide/ssl)。

## 7. 從外部網路驗證

請使用手機行動網路依序測試：

1. 開啟 `auth.example.com`，確認登入頁面可存取。
2. 開啟 `nas.example.com`，確認進入身分驗證流程。
3. 登入後，確認系統返回業務頁面。
4. 查看 Tunnel 狀態與 fn-knock `請求記錄`，確認請求命中正確的 Host 與上游。

## 路徑模式僅用於相容

目前介面已將 `內網穿透 → 路徑模式` 標示為不建議使用。只有在以下情況才採用：

- 需要保留既有路徑映射，暫時無法遷移。
- 只有一個公網網域名稱可用。
- 上游應用程式明確支援部署在 Path Prefix 下。

例如將 `https://example.com/nas/` 轉送至 NAS。上游應用程式必須正確處理 Path Prefix、Redirect、Cookie 與 WebSocket；否則容易發生資源 404、登入循環或跳回 Root Path。

新設定應優先為每項服務分配獨立子網域。舊設定的遷移方式請參閱[內網穿透與路徑映射](/zh-tw/guide/reverse-proxy)。

## 常見問題

| 現象 | 優先檢查 |
| --- | --- |
| Tunnel 已連線，但網域名稱連線逾時 | Cloudflare 核對衝突、Wildcard DNS、Ingress、FRP 入口與本機 Host 映射 |
| 所有子網域都進入同一項服務 | Tunnel 或前置 Proxy 未保留 Host |
| 回傳 502 | Tunnel 無法存取閘道，或閘道無法存取業務上游 |
| 登入後不斷重新導向或出現 `:7999` | 確認使用託管 Cloudflared 子網域映射、公開位址為標準 HTTPS，並從原本的業務 Host 重新發起存取 |
| Cloudflared 回報 TLS 錯誤 | 回源 Protocol 或憑證信任設定錯誤 |
| 路徑模式中的資源回傳 404 | 上游不支援 Path Prefix，應優先遷移至子網域映射 |

完整疑難排解請參閱 [FAQ](/zh-tw/faq)。

## 相關文件

- [選擇部署與存取方案](/zh-tw/quick-start/deployment-options)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [服務探索與批次接入](/zh-tw/guide/service-discovery)
- [內網穿透與路徑映射](/zh-tw/guide/reverse-proxy)
- [身分驗證與登入](/zh-tw/guide/auth)
- [請求記錄](/zh-tw/guide/request-logs)
