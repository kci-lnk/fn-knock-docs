---
lang: zh-TW
title: "Cloudflare Tunnel（cloudflared）設定"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e67dbb1d5b3ddbd00b5e8cb8121d43a27750d4fd67efc97ddb31678eee923b00
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Tunnel（cloudflared）設定

Cloudflared 會從內部網路主動連上 Cloudflare Tunnel，將公網 Request 送至 fn-knock 閘道。建議使用 fn-knock 託管模式：填入 Cloudflare API Token 後，程式會找出 Zone 與 Account、建立或接入 Tunnel、維護 Wildcard DNS 與 Ingress，並取得 Tunnel Token 來啟動 Cloudflared。一般設定不再需要進入 Cloudflare Dashboard 逐一新增 Public Hostname。

新部署請使用 `內網穿透 → 子網域映射`。Cloudflare 會保留原始 Host，再由 fn-knock 將 `auth.example.com`、`nas.example.com` 等 Request 分派至本機服務。路徑模式只用於相容既有的單一網域路徑入口。

## 開始前

1. 在 `系統設定 → Cloudflared` 下載資源，確認狀態為已就緒。
2. 在 `系統設定 → 模式` 選擇 `內網穿透 → 子網域映射`。
3. 在 `子網域映射` 中儲存根網域、驗證服務與至少一筆服務映射。
4. 建立一個限制於目標 Account 與 Zone 的 Cloudflare Account API Token。

### 建議：建立 Account API Token

Account API Token 屬於 Cloudflare Account，而不是個別使用者。建立者離開 Account 時不會因此自動失效，更適合 fn-knock 這類長期執行的服務。建立此 Token 需要該 Account 的 Super Administrator 權限；沒有此權限時再使用個人 API Token。

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 前往 `Manage Account → Account API Tokens`，選擇持有 Zone 的 Account。
3. 點選 `Create Token`，建立自訂 Token，名稱可填 `fn-knock Cloudflare Tunnel`。
4. 加入下方列出的 Account 與 Zone 權限。
5. 在 `Account Resources` 中只選目前 Account；在 `Zone Resources` 中只選 fn-knock 根網域所在的 Zone。
6. 可依維運政策設定到期時間。只有裝置具備固定公網出口 IP 時才設定 Client IP 限制，否則網路變更可能讓 Token 突然失效。
7. 點選 `Continue to summary`，確認沒有多餘權限與資源，再點選 `Create Token`。
8. Secret 只顯示一次。立即複製到 fn-knock 的 `API 連線` 欄位並連接，不要存入文件、截圖或聊天記錄。

目前 Dashboard 路徑請參考 Cloudflare 的 [Account API Token 官方文件](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/)。若使用個人 API Token，請從 `My Profile → API Tokens` 建立；它會跟隨個人帳號生命週期，較適合臨時測試而非長期部署。

基本託管需要：

- `Account / Cloudflare Tunnel / Edit`
- `Zone / Zone / Read`
- `Zone / DNS / Edit`

啟用「優選 Beta」時還需要：

- `Zone / SSL and Certificates / Edit`

Token 必須能讀取根網域所在的有效 Zone。根網域可以是 Zone 本身，也可以是其下級網域；例如填入 `tu.example.com` 時，程式會繼續尋找上層 `example.com` Zone。API Token 與 Account API Token 都可以使用。不要把 Global API Key 或 Token 放入截圖、Issue 或公開 Log；Token 外洩後應立即輪換。

## 託管模式設定

進入 `內網穿透 → Cloudflared`。頁面每個區域都可摺疊；執行狀態與 Log 位於最前方並預設展開。

### 1. 連接 Cloudflare

展開 `API 連線`，貼上 API Token 並連接。連接成功後會顯示識別到的 Zone；後續讀取 API 不會傳回 Token 明文。

若連線失敗，請檢查 Zone 狀態與 Token 資源範圍。只能讀取 Zone、但沒有 DNS 編輯權限的 Token，可能連接成功，卻在預檢或套用時失敗。

### 2. 選擇 Tunnel

展開 `Tunnel 與網域同步`：

- `專用 Tunnel`：建議使用。fn-knock 會建立帶有 Instance 識別碼的 Tunnel，並只管理自己的設定。
- `既有 Tunnel`：重複使用 Cloudflare 中由遠端管理的 Cloudflared Tunnel。fn-knock 會保留其他 Ingress 及其順序，並將自己的 Wildcard 規則放在終止規則之前。

按下 `預檢` 後，頁面會列出即將建立、更新或保留的 Tunnel、Ingress、DNS 與優選資源。預檢計畫有效期為 10 分鐘；套用前若遠端設定已變更，必須重新預檢。遇到同名但不屬於 fn-knock 的資源時，頁面會回報衝突，只有逐項確認接管後才會修改。

預檢指紋會忽略 Cloudflare 回傳順序、更新時間與驗證狀態等正常變化，但會保留 DNS 內容、Proxy 狀態、資源歸屬與 Ingress 等安全相關欄位。套用前這些欄位若發生變更，舊計畫會失效並要求重新預檢，不會沿用過時的接管確認。Custom Hostname 所需的所有權或憑證驗證 TXT 會依「名稱 + 內容」分別維護；同名但內容不同的第三方 TXT 不會只因名稱相同而被覆寫。一個名稱下存在多筆無法安全判斷歸屬的 CNAME / A / AAAA 時，應先在 Cloudflare 手動整理，再重新預檢。

套用計畫會建立背景核對工作，頁面會顯示執行進度。若重新整理頁面，或 Tunnel 重新設定時套用 Response 中斷，重新進入頁面即可繼續追蹤同一工作；不要再次點擊套用。服務端同一時間只會執行一個核對工作，並在實際修改前再次驗證遠端指紋與接管確認。以相同確認重複提交同一計畫會回傳原工作，不同確認則會被拒絕。工作失敗時請先閱讀錯誤並重新預檢，不要假設所有部分完成的遠端變更都會自動回復。

基本託管會自動維護：

```text
*.example.com  -> <tunnel-id>.cfargotunnel.com（代理 CNAME）
*.example.com  -> fn-knock 專用的本機 Tunnel 入口（Ingress）
最後一條       -> HTTP 404
```

套用成功後，fn-knock 會透過 Cloudflare 官方 API 取得 Tunnel Token，並使用權限為 `0600` 的 Token 檔案啟動 Cloudflared。Token 不會出現在 Process 參數中。

### 3. 驗證公網存取

託管 Cloudflare Tunnel 對訪客提供標準 HTTPS 位址：

```text
https://auth.example.com/
https://nas.example.com/
```

不要在位址後加上 `:7999`。即使舊設定仍保留公網 HTTPS Port，Cloudflare Tunnel 模式下的子網域清單、驗證位址與登入重新導向也會省略該 Port。Cloudflare 負責外部 `443`，fn-knock 自動管理本機 Tunnel 入口。

儲存新的服務 Host 後，Wildcard Tunnel 可立即接收 Request，不必再到 Cloudflare Dashboard 新增 Public Hostname。啟用優選時，精確網域資源會在背景繼續核對；完成前仍由 Wildcard Tunnel 正常提供服務。

## 優選 Beta

優選會測試目前裝置到 Cloudflare Anycast IPv4 的實際品質，再透過 Cloudflare for SaaS Custom Hostname 對已設定的精確服務網域疊加優選入口。標準 Wildcard Tunnel 始終保留作為回退。

### 啟用順序

1. 在 `Tunnel 與網域同步` 開啟 `優選 Beta`。
2. 執行 `預檢`，檢查方案能力、權限、資源變更與衝突。
3. 套用預檢計畫。看到「請先在 Cloudflare 核對計畫中啟用優選」時，表示尚未完成此步驟。
4. 展開 `優選 Beta` 並執行測速。
5. 套用建議 IP，或選擇另一個已通過驗證的候選。

程式會先用隔離子網域探測目前 Zone 是否支援 Custom Hostname、憑證簽發和 SNI 直連。能力不支援時只停用優選，不影響基本 Tunnel。

### 候選來源

候選可來自：

- Cloudflare 官方 IPv4 網段的確定性抽樣。
- 內建公共網域：瑞典政府 `www.gov.se`、美國國會圖書館 `www.loc.gov`、ICANN `www.icann.org` 與 Visa `www.visa.com`。
- 使用者新增的公共候選網域，最多 16 個。
- 使用者填寫的 `自訂優選 IP`，只接受 Cloudflare 官方 IPv4 網段內的位址。

這些公共網域只用於找出可能的 Cloudflare IPv4。fn-knock 不會把服務 CNAME 指向它們，也不會以它們的 Host 或 SNI 傳送業務流量。解析不使用本機 DNS，而是並行查詢 Cloudflare、Google、騰訊 DNSPod 與 AliDNS 的加密 DoH；結果只保留 Cloudflare 官方 IPv4 網段內的位址，並優先排列由多個解析器共同回傳的候選。單一解析器失敗不會中止掃描，頁面會保留最近一次掃描的解析器狀態、成功／失敗次數與回退路徑。

自訂優選 IP 會強制進入測速 Shortlist，但不會略過 Cloudflare 網段、延遲、下載、業務網域 TLS、SNI 與 Ray ID 驗證；全部通過後才會成為本輪建議候選。若自訂位址失敗，頁面會保留拒絕原因，仍可從其他已驗證候選中手動選擇。

若所有 DoH 都無法使用，啟用「Cloudflare 官方 IPv4 網段」時會自動改用官方網段的確定性抽樣；關閉官方網段時，會驗證現有的自訂優選 IP 與目前已發布候選，兩者都不存在時本次掃描不可用。候選仍需通過後續業務網域 TLS、SNI、Cloudflare 錯誤頁與 Ray ID 驗證，因此 DNS 剛傳播、單一解析器異常或本機 Fake IP 不會直接決定發布結果。

IP 註冊機構或 GeoIP 顯示「美國」，不代表 Request 落地在美國。Cloudflare IPv4 是 Anycast，同一個 IP 會從多個邊緣機房公告。結果中的 `Cloudflare 機房` 來自實際探測回應的 `CF-Ray` 後綴，例如 `SIN`、`HKG`，比 IP 歸屬地更能代表此次連線的落點。

### 測速與切換

單次測速最多使用 128 個候選，並行不超過 32。每個候選進行 3 次 TLS／延遲探測，延遲較好的 8 個候選再進行兩次 1 MiB 下載，總下載量不超過 20 MiB。分數越低越好：

```text
延遲中位數 + 2 × 抖動 + 1500 × 遺失率 + 800 / max(下載 Mbps, 1)
```

候選還必須針對實際服務 Host 通過 TLS、SNI 與 Cloudflare 錯誤頁檢查，不能只依 ping 或 IP 歸屬地套用。自動策略每 7 天重新測速，每 15 分鐘檢查目前 IP；新候選至少改善 15%，並在相隔 10 分鐘的兩輪確認中保持領先後才會切換。

目前 IP 連續失敗時，程式會優先切換至已驗證候選；沒有可用候選時，會移除 fn-knock 管理的精確 CNAME，讓網域重新匹配 Wildcard Tunnel。也可隨時點選 `回退標準 Tunnel`。

### 方案與安全邊界

優選依賴 Cloudflare for SaaS Custom Hostname。可用數量以目前 Zone 的實際方案與配額為準；超出配額的服務網域會使用標準 Tunnel。Custom Hostname 與憑證未同時啟用前，程式不會發布精確 CNAME。

不要手動將代理狀態的服務 A Record 直接指向 Cloudflare 邊緣 IP，這可能觸發 Cloudflare Error 1000。fn-knock 使用 Custom Hostname、專用 Origin 網域與 DNS-only 優選入口，能力探測失敗時則保留 Wildcard Tunnel。

## Client IP 與登入重新導向

託管模式使用只監聽 Loopback 的專用 Tunnel 入口。閘道只在這條受控路徑信任 Cloudflare 的 `CF-Connecting-IP`，不會把訪客自行傳送的 `X-Forwarded-For` 當成可信來源。EdgeOne / ESA 的真實 IP 開關不適用於 Cloudflared，在目前模式不可用時介面會隱藏。

若 Cloudflare 的 `Pseudo IPv4` 設為 `Overwrite Headers`，IPv6 訪客的 `CF-Connecting-IP` 會變成 `240.0.0.0/4` 的 Class E 位址。託管專用入口會嚴格驗證單值 Header，並從 `CF-Connecting-IPv6` 還原有效的公網 IPv6，用於 Session、可見性、WAF 與 Request Log；Header 缺少、重複、屬於私有位址或格式異常時會保留 Pseudo IPv4，不會信任其他轉送 Header。此還原只適用 fn-knock 託管入口；手動 Cloudflare Origin 建議將 Pseudo IPv4 設為 `Off` 或 `Add Header`。

從行動網路開啟一個要求登入的服務 Host，並在 Request Log 確認：

- 登入重新導向為 `https://auth.example.com/...`，沒有 `:7999`。
- `redirect_uri` 仍是原服務 Host，也沒有 `:7999`。
- Client IP 是訪客公網位址，而不是 `127.0.0.1`、Container 位址或自訂 `X-Forwarded-For`。

## 手動 Tunnel Token 模式

進階使用者仍可展開 `手動 Tunnel Token`，貼上從 Cloudflare 取得的 Tunnel Token 並選擇傳輸 Protocol。`自動`會先嘗試 QUIC，失敗時回退 HTTP/2；只有 UDP `7844` 明確遭封鎖時才固定 HTTP/2。

手動模式不會自動建立 Tunnel、DNS 或 Ingress，需要自行在 Cloudflare 設定 Public Hostname 與 Origin Service。自管 Process 或 Windows 版本也屬於此類；可以回源實際閘道 Port，但其安裝、Token、Log 與生命週期不由託管流程負責。

## 中斷連線與清理

刪除 API Token 只會停止後續遠端管理，不會刪除 Cloudflare 資源。需要移除時，使用 `移除託管資源` 產生清理預檢並確認：

- 既有 Tunnel 永遠不會自動刪除。
- fn-knock 建立的專用 Tunnel 也只會在明確確認後刪除。
- 清理優選資源會先讓精確服務網域回到 Wildcard Tunnel。

## 疑難排解

| 症狀 | 優先檢查 |
| --- | --- |
| 找不到 Zone 或 Zone 未啟用 | 根網域是否屬於 Token 可存取的有效 Zone；Token 是否限制到錯誤 Account／Zone |
| 提示需要 DNS Edit | Token 是否對目標 Zone 具備 `Zone / DNS / Edit` |
| DNS tag 配額為 0 | 更新至支援只使用 comment 標記的版本後重新預檢；不要手動建立重複 Record |
| 預檢後套用回傳 409 | 遠端狀態或本機根網域已變更，重新執行預檢 |
| 套用時頁面重新整理或連線中斷 | 重新開啟 Cloudflared 頁面並繼續追蹤背景核對工作；不要用另一組確認重複提交相同計畫 |
| Tunnel 已上線但網域無法使用 | 核對衝突、Wildcard DNS、Ingress、Cloudflared Log 與本機 Host 映射 |
| 重新導向仍包含 `:7999` | 確認使用 `內網穿透 → 子網域映射`、預設 Tunnel 為 Cloudflared，並更新至支援標準 Port 重新導向的版本 |
| 無法啟用優選 | SSL 權限、Cloudflare for SaaS 可用性、Custom Hostname 配額與能力探測結果 |
| 所有候選網域都解析失敗 | 展開最近一次解析器診斷；允許官方網段時確認是否已自動回退，否則啟用官方網段後重新測速 |
| 自訂優選 IP 未被採用 | 確認位於 Cloudflare 官方 IPv4 網段內，並查看延遲、下載、業務網域 TLS、SNI 與 Ray ID 驗證結果 |
| IP 歸屬地顯示美國 | 查看測速中的 Cloudflare 機房代碼；Anycast 註冊地不是連線落點 |
| Log 中的 IPv6 變成 `240.0.0.0/4` | 託管模式升級至支援 Pseudo IPv4 還原的版本；手動 Origin 將 Cloudflare Pseudo IPv4 改為 `Off` 或 `Add Header` |
| 所有存取都像本機來源 | 查看 Request Log 的 Client IP，並使用託管專用入口而非錯誤的手動 Origin |

整體執行狀態請參閱[內網穿透](/zh-tw/guide/tunnel)，Host 設定請參閱[子網域映射](/zh-tw/guide/subdomain-proxy)。
