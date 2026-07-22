---
lang: zh-TW
title: "資安邊界與基準"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: d230c595c28eab13387328c443de0dfca85aedb802ec7a708f3063f57d1521b6
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 資安邊界與基準

安全性設定應先釐清兩個問題：請求是否一定會經過 fn-knock，以及閘道取得的是否為真實用戶端 IP。只要其中一項不成立，身分驗證、允許清單與地區規則的行為就可能不如預期。

## 先確認安全邊界

fn-knock 只能控管經過閘道入口的流量。下列情況必須在閘道之外處理：

- 路由器、Cloud Security Group 或 Docker 已發布服務的原始連接埠；
- CDN、反向 Proxy 或 Tunnel 直接連回服務 Origin；
- 前置 Proxy 將自身的內網 IP 誤傳為用戶端 IP；
- 管理介面、資料庫或 SSH 對外單獨暴露。

閘道會將 Loopback、私有網路、Link-local 與 CGNAT IP 視為本地來源，並在身分驗證預檢時直接放行。此規則優先於工作階段與 IP 授權。因此，驗證受保護服務時請使用行動網路或其他真實公網連線；不要只在家用 Wi-Fi 中測試。

## 建議的安全基準

1. 只對外開放閘道必要的連接埠；管理入口僅放在區域網路、VPN 或可信任的反向 Proxy 後方。
2. 替閘道準備正式的 HTTPS 憑證，並為每個公開 Host 設定正確的 DNS。
3. 建立至少兩組可復原的登入憑據；常用裝置再綁定 Passkey。
4. 新服務預設開啟「要求登入」，只有明確需要時才設為公開。
5. 啟用請求記錄與事件通知，觀察正常流量後，再逐步收緊 WAF、閘道 Rate Limit、掃描器或封鎖清單規則。
6. 定期更新 Host、fn-knock 與上游服務，並在更新前匯出受妥善保護的備份。

## 各層防護的作用

| 層級 | 解決的問題 | 主要入口 |
| --- | --- | --- |
| 閘道可見性 | 限制哪些地區或 CIDR 能觸及閘道 | `系統設定 → 閘道` |
| 映射存取原則 | 決定 Host 為公開或要求登入 | `子網域映射` |
| 子網域進階驗證 | 依來源或請求特徵簽發目前 Host 的臨時憑據 | `子網域映射 → 進階驗證設定` |
| 身分驗證與工作階段 | 確認身分、工作階段有效時間、Cookie 共用與憑據範圍 | `驗證設定`、`工作階段管理` |
| IP 允許清單 | 授權固定 IP／CIDR 或登入後的 IP | `IP 允許清單` |
| 登入退避 | 延遲同一來源持續失敗的登入嘗試 | `工作階段管理 → 登入退避` |
| 閘道 Rate Limit 與 Bot 攔截 | 限制高頻反向 Proxy 流量，並拒絕已識別的 Bot | `系統設定 → 閘道` |
| 掃描器攔截 | 依非一般路徑命中維護獨立封鎖清單 | `系統設定 → 攔截` |
| 全域封鎖清單 | 立即拒絕已確認的單一來源 IP | `工作階段管理 → 全域封鎖清單` |
| WAF | 偵測或攔截經過閘道的 HTTP Request | `系統設定 → WAF` |
| SSH 防火牆 | 依來源與登入失敗保護 Host SSH | `SSH 安全性`，僅適用具備 Host 管理能力的部署 |
| Host 或上游防火牆 | 限縮服務原始連接埠與管理連接埠 | Host、路由器或 Cloud Security Group |

這些防護彼此互補，不能互相取代。例如，WAF 不會關閉已暴露的資料庫連接埠；允許清單也不會修補上游應用程式漏洞。子網域進階驗證命中後會放行整個目前 Host，不應當成持續的 Path-level 限制。

## 真實用戶端 IP

來自 CDN、反向 Proxy 或 Tunnel 的請求能否被正確識別，取決於上游傳入的真實 IP Header。fn-knock 會依序處理常見的 `X-Forwarded-For`、`X-Real-IP`、`EO-Connecting-IP` 與 `Ali-Real-Client-IP` 資訊。

目前設定頁面沒有 Inbound Trusted Proxy CIDR 清單；前置 Proxy 必須移除或改寫外部用戶端可偽造的真實 IP Header。若它錯誤傳遞 `127.0.0.1`、`192.168.x.x` 等 IP，公網請求可能被誤判為本地豁免。接入 EdgeOne、ESA、Cloudflare 或自架反向 Proxy 後，應分別從外網檢查請求記錄中的「用戶端 IP」與「連線來源 IP」。

## 隔離管理介面

管理介面具備修改身分驗證、憑證、Proxy、封鎖清單與 Terminal 的權限，應採用比一般服務入口更嚴格的安全邊界：

1. 在驗證設定中單獨設定管理介面的可存取範圍；
2. 優先限制在區域網路、VPN 或固定可信任 CIDR；
3. 不要與公開服務共用弱密碼憑據；
4. 支援 Terminal 的平台，還必須考量服務處理程序在 Host 上的權限；
5. 保留第二組管理員憑據與本機 Console 復原方式；
6. 定期檢查有效工作階段、IP 漂移記錄與登入退避。

隱藏管理介面或修改路徑並不等於存取控制。入口仍需要身分驗證、網路限制與正式 HTTPS。

## 限縮上游連接埠

只有在用戶端無法繞過反向 Proxy 時，它才能形成安全邊界：

- 上游服務優先 Listen 在 `127.0.0.1`，或只有 fn-knock 能連線的 Container Network；
- 必須 Listen 在區域網路 IP 時，使用 Host 防火牆只允許閘道來源；
- 檢查 Docker `ports`、路由器 Port Forwarding、Cloud Security Group、FRP 與 CDN Origin；
- 通訊協定映射暴露的是 TCP／UDP 流量，不會經過 HTTP 身分驗證與 WAF，必須另外限制。

請從公網掃描公開 IP，確認服務原始連接埠沒有意外暴露。只在同一個區域網路中測試，無法證明公網安全邊界正確。

## 發生異常時

1. 先在請求記錄中確認請求是否到達閘道。
2. 檢查 Host、路徑、上游 Target 與路由類型是否符合預期。
3. 確認用戶端 IP 是否為真實公網 IP，而不是 Proxy IP。
4. 查看工作階段、允許清單、登入退避、掃描器封鎖清單、全域封鎖清單與 WAF Log。
5. 對照事件中心，確認設定變更、登入、封鎖或更新發生的時間。
6. 懷疑原始連接埠暴露時，回到路由器、Cloud Security Group、Container Port 與 Host 防火牆逐項檢查。

恢復服務時，只暫時放寬發生問題的單層原則，並記錄原始值。確認原因後請恢復安全性設定，避免同時停用身分驗證、WAF 與封鎖清單而失去定位依據。

- [閘道可見性](/zh-tw/guide/gateway-visibility)
- [反向代理標頭](/zh-tw/guide/gateway-proxy-headers)
- [IP 允許清單](/zh-tw/guide/whitelist)
- [全域封鎖清單](/zh-tw/guide/general-blacklist)
- [掃描攔截](/zh-tw/guide/scanner-interception)
- [WAF](/zh-tw/guide/waf)
- [請求記錄](/zh-tw/guide/request-logs)
- [SSH 安全性](/zh-tw/guide/ssh-security)
