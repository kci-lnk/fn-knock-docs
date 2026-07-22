---
lang: zh-TW
title: "服務探索與批次串接"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c599fa8c78c7b722203f033458303a28c195a4f5c0fe0abc2aa78e75e5ac0e7d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 服務探索與批次串接

`一鍵探索` 可在 fn-knock 能連線的本機 IPv4 網段中尋找 HTTP 服務，並將識別結果轉換為待確認的子網域映射或路徑映射。它不會掃描公網，也不會在找到開放連接埠後自動發布服務。

## 入口與使用條件

服務探索不是獨立選單，入口位於：

- `子網域映射 → 一鍵探索`：請先儲存根網域，掃描結果會產生服務 Host；
- `路徑映射 → 一鍵探索`：只會在 `內網穿透 → 路徑模式` 中顯示，掃描結果會產生路徑規則。

在子網域映射中，根網域尚未儲存，或頁面仍有未儲存變更時，無法開始探索。掃描只會驗證 fn-knock 的 Runtime 環境能否連上 Target；Docker 內看到的網路與 Host 不同，因此 Host Service 必須能從 Container Network 連線。

## 掃描目標

開啟一鍵探索後，可展開掃描目標設定。預設目標來自目前的 Runtime 環境：

| 來源 | 說明 |
| --- | --- |
| Loopback | 非 Docker 部署使用 `127.0.0.1/32` |
| Docker Host | Docker 部署會依管理入口識別可連線的 Host 網段 |
| 網路介面 | 目前環境中允許掃描的本機 IPv4 介面網段 |
| 既有映射 | 從現有子網域或路徑映射的 Target 推導 |
| 自訂 | 由管理員手動新增並儲存的 CIDR |
| 已儲存 | 先前儲存且目前仍列為掃描範圍的 CIDR |

只接受完整落在下列範圍內的 IPv4 CIDR：

- Loopback `127.0.0.0/8`；
- RFC 1918 私有網路 `10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`；
- CGNAT `100.64.0.0/10`；
- Link-local `169.254.0.0/16`。

單次最多可選擇 `16` 個 CIDR，移除重複項目後合計最多 `1024` 台主機。輸入較大的網段時，應改成範圍更小的 CIDR，而不是依賴系統截斷掃描結果。

「恢復自動選擇」會重新跟隨目前的自動目標。手動勾選、取消或新增 CIDR 後必須儲存；直接開始掃描時，頁面也會先嘗試儲存目前範圍。至少要保留一個目標。

## 掃描範圍與強度

每台目標主機都會探測 `80–60000` 連接埠，但會略過 fn-knock 自身與已知內部服務連接埠；掃描本機時，也會額外避開容易造成 Self-scan 的連接埠。找到開放的 TCP Port 後，系統才會送出 HTTP Request 來識別服務；只有開放、但不提供 HTTP 的 Port 不會產生候選映射。

掃描強度可依裝置建議，也可以手動選擇：

| 等級 | 目標 Concurrency |
| --- | ---: |
| 低 | 32 |
| 中 | 115 |
| 高 | 256 |
| 極高 | 512 |

實際 Concurrency 不會固定達到表中的數值。系統還會依 CPU Core、可用記憶體、File Descriptor 上限與 Container Resource Limit 計算安全上限，並取兩者中的較小值。自動模式預設啟用，會在裝置能力變化後重新建議等級。

等級只會影響耗時與裝置負載，不會改變 CIDR、連接埠範圍或識別規則。NAS、路由器與低記憶體裝置建議維持自動或低強度；提高 Concurrency 後仍然很慢，通常代表掃描範圍過大，而不是等級設定失效。

## 識別結果

掃描視窗會持續顯示主機、連接埠、進度與已識別的服務。系統會依 HTTP Status、Response Header 與頁面特徵識別常見應用程式；無法精確識別時，會以頁面標題或 `HTTP + 連接埠` 產生通用候選。

候選值只供參考：

- 子網域模式會建議子網域名稱，並預設建立要求登入、啟用 WAF、保留上游 Host 的映射；
- 路徑模式會建議路徑、是否 Rewrite HTML、是否使用根目錄模式，以及是否設為預設路由；
- 偵測到上游 Basic Auth 時只會提示風險，不會自動儲存其使用者名稱與密碼；
- 已存在相同 Target、Host、路徑或重複候選時，頁面會篩除，或拒絕批次儲存。

儲存前請逐項檢查候選名稱與 Target。通用識別無法得知應用程式真正的 Base Path、Callback URL、WebSocket、Cookie 或 Trusted Proxy 要求；批次新增成功也不代表已能從公網存取。

停止掃描或關閉視窗會取消目前工作；已顯示的候選只有在按下批次儲存後，才會寫入設定。

## 建議操作順序

1. 先從 fn-knock 所在環境確認目標 IP 與連接埠可連線。
2. 儲存根網域，或切換至正確的路徑模式。
3. 開啟一鍵探索，展開設定並將 CIDR 限縮至實際裝置網段。
4. 裝置資源有限時維持自動或低強度，再開始掃描。
5. 取消不需要公開的候選，並修改有衝突或語意不清的子網域名稱與路徑。
6. 批次儲存後，逐筆檢查身分驗證、WAF、Target 與路由選項。
7. 先從區域網路驗證上游，再透過行動網路驗證公網 DNS、Tunnel、憑證與登入。
8. 在請求記錄中確認 Host、來源 IP、路由與上游狀態。

## 常見問題

### 掃描不到 Host Service

Docker 中的 `127.0.0.1` 代表 Container 本身。確認服務不是只 Listen 在 Host Loopback IP，並改用 Container 可連線的 Host IP；同時檢查 Docker Network、防火牆與服務 Listen 範圍。

非 Docker 部署還要確認目標位於允許的本機 IPv4 範圍內。IPv6、網域與公網 IP 無法作為探索 CIDR，但探索完成後仍可手動建立合法 Target。

### 找到開放連接埠，但沒有候選

服務探索只會產生可透過 HTTP 分析的候選。TCP、UDP、TLS-only 或需要特殊 Handshake 的服務，可能只有 Port 開放而沒有結果。若 HTTP 服務強制將明文請求導向只支援 HTTPS 的 Port，也可能遭到略過；此情況應手動新增映射並驗證通訊協定。

### 掃描耗時過長或裝置負載過高

先縮小 CIDR 與主機數量，再降低強度。掃描最多可能涵蓋 `1024 × 59921` 次 Port Probe，目標範圍比 Concurrency 等級更能決定總工作量。關閉視窗可取消工作，但已送出的少量網路探測可能仍要等到逾時才會結束。

### 候選服務重複或連接埠不如預期

同一個應用程式可能在多個連接埠回傳相似頁面；系統會依識別 Key 合併部分結果，但無法替管理員判斷真正入口。請保留上游正式 Listen 的連接埠，並刪除 Health Check、Redirect Port，或已由其他映射接管的候選。

- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [路徑映射](/zh-tw/guide/reverse-proxy)
- [請求記錄](/zh-tw/guide/request-logs)
- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
