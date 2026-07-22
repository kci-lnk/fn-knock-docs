---
lang: zh-TW
title: "DDNS 管理"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 872f5788286c0aff254e06eb420c0fd5cd752ebe1c2866f1b9a809ab2a7e5cc2
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# DDNS 管理

DDNS 只負責將 DNS Record 更新為目前的公網 IP。它不會開放連接埠、設定 Tunnel、簽發憑證，也不會自動讓服務流量經過閘道。

## 何時需要 DDNS

- 公網 IPv4 或 IPv6 會變動，而且閘道由外部直接存取。
- 子網域模式需要讓身分驗證 Host、服務 Host 或 Wildcard DNS 指向同一個入口。
- 使用 Edge CDN 連回 Origin，但 Origin IP 會變動。

如果使用 Cloudflare Tunnel，DNS 通常由 Tunnel 的 Public Hostname 管理；不要再替同一個網域建立彼此競爭的 DDNS Record。

## 設定一筆 Record

在 `DDNS` 中選擇供應商，並填寫憑據、網域、Record Type 與更新範圍。請特別檢查：

| 項目 | 重點 |
| --- | --- |
| 網域 | 填寫要更新的 Record Name，而不是完整 URL、路徑或連接埠 |
| 更新範圍 | 依實際可用的網路選擇 IPv4、IPv6 或雙協定棧 |
| IP 來源 | 可使用公網偵測、指定網路介面、Static IP，或解析另一個網域；Docker 環境必須確認取得的是 Host IP |
| Outbound 網路介面 | 多網路介面裝置應選擇可連線至供應商 API 的介面 |
| Wildcard DNS | 子網域閘道通常需要 `*.example.com`，身分驗證 Host 也必須能正常解析 |

儲存後，請先執行頁面上的測試或手動更新，再使用 `dig`、`nslookup` 或 DNS Console 確認 Record Value。解析正確只代表 DNS 已更新；仍需從外網驗證連接埠、憑證與閘道路由。

目前的供應商清單包含阿里雲 DNS、Baidu Cloud DNS、Cloudflare、DNSPod、DuckDNS、Dynu、dynv6、騰訊雲 EdgeOne CNAME、騰訊雲 EdgeOne、阿里雲 ESA、GoDaddy、華為雲 DNS、No-IP、Porkbun 與騰訊雲 DNSPod。頁面會依供應商顯示所需欄位；請勿套用其他供應商的 Zone ID、Token 或根網域欄位。

## 主網域與更多網域

`主域配置` 是預設更新目標，狀態卡會顯示目前 IPv4、IPv6、上次檢查時間與上次成功更新時間。`更多域` 可新增彼此獨立的目標，每筆項目都能分別選擇供應商、憑據、IP 來源、更新範圍與啟用狀態。

更多網域不會繼承主網域的網域名稱或供應商設定，但頁面可識別同一供應商在其他模組或目標中儲存的憑據，並只自動填入目前仍為空白的欄位。自動填入後，仍應核對 Zone、根網域與最小必要權限。

單一額外網域可執行立即更新、停用、啟用、編輯或刪除。停用只會暫停該目標；刪除則會一併移除其 Runtime 狀態。清除主網域設定不會刪除更多網域，但主網域在完成重新設定前，無法參與自動更新。

## 網域與 Wildcard DNS 組合

支援雙網域的供應商，可在同一個網域欄位填寫 Wildcard 與對應的 Base Domain，例如：

```text
*.r.example.com, r.example.com
```

兩者必須是一組 Wildcard 與 Base Domain，Base Domain 必須與供應商的 Zone／根網域相同或位於其下。頁面接受半形逗號、全形逗號或空格，離開欄位後會自動格式化。EdgeOne CNAME 等只支援單一位址或單一網域的供應商不接受此組合；請以頁面顯示的功能提示為準。

## 從網路介面選擇 IP

選擇 `從網卡直接取得` 時，必須明確指定一個網路介面。頁面只會顯示經過篩選的候選 IP，排除明顯的內網 IP、仍在進行位址偵測、衝突偵測失敗或已棄用的位址；Temporary／Privacy IPv6 預設也會排除。沒有候選項目時，請更換網路介面，或改用公網偵測、Static IP 或網域解析。

IP 選擇不再依賴網路介面回傳清單中的 Index。手動設定 `優先位址` 後，只要該位址仍符合篩選規則，系統就會優先使用；沒有手動優先位址或該位址已不可用時，才會沿用目前仍可用的位址，最後從其餘候選中穩定選擇。這可確保手動指定優先於系統建議，也能在未指定時避免候選順序改變造成 DNS Record 跳動。舊版本儲存的 IP Index 會在頁面中轉換為穩定選擇規則，儲存後生效；若舊設定沒有選擇規則，或原 Index 已失效，後台也會依自動穩定規則挑選候選，不會只因缺少 Index 就中斷無人值守更新。

切換至另一個網路介面時，頁面會清除原介面的優先 IP、CIDR 與 IPv6 Interface Identifier 等選擇規則，避免舊規則誤套至新介面。切換後請重新檢查預覽結果，並視需求設定規則。

`優先位址` 在自動與自訂模式中都能設定。需要依網段或 IPv6 Interface Identifier 進一步限縮時，請切換至 `自訂比對規則`：

| 設定 | 作用 |
| --- | --- |
| `優先位址` | 候選中存在該 IP 時，優先於目前位址和系統排序使用；IP 失效後仍可選擇其他符合項目 |
| `包含 CIDR` | 只從指定 IPv4 或 IPv6 網段中選擇 |
| `排除 CIDR` | 排除不應寫入 DNS 的網段 |
| `IPv6 介面識別碼（低 64 位元）` | 忽略會變動的 Prefix，沿用相同 Interface Identifier 選擇新的 IPv6 位址 |
| `允許暫時／隱私 IPv6 位址` | 預設關閉，避免 Privacy Address 輪替造成頻繁更新 |

頁面會即時預覽最終選取的 IP。規則同時符合多個候選時，預覽會顯示候選數量，並依穩定性選出其中一個，不會按照網路介面清單中的偶然順序挑選；沒有符合項目時，不能依賴此設定進行更新。若 IPv6 Prefix 會變動，但裝置的 Interface Identifier 維持穩定，可選擇目前的優先 IP，並保留自動擷取的低 64 位元 Interface Identifier；不應使用 Temporary Privacy Address 時，請維持預設關閉。

## 公網 IP 偵測設定

DDNS 的公網 IP 偵測可使用內建 HTTP（預設）或系統 `curl`。選擇 Outbound 網路介面時，內建 HTTP 會 Bind 對應的本機 IP，適合在多介面裝置上明確控制偵測流量從哪個介面送出；系統 `curl` 則依賴 Host 既有的指令與網路環境。

偵測設定也可選擇 Public DNS：不使用、阿里雲、騰訊雲、Cloudflare 或 Google，預設使用阿里雲。這裡的 Public DNS 只用來解析公網 IP 偵測服務，不會變更 DDNS 供應商、待更新的 Record，也不會替你修改服務網域的 DNS。

IPv4 與 IPv6 可分別維護多個偵測來源。來源可以是回傳純 IP 的 HTTP(S) URL，也可以是可解析的網域。修改前請先按下 `測試位址`，逐筆確認 Status Code、Response Preview 與解析出的 IP；`還原預設位址` 只會覆寫對話框中的草稿，仍需儲存才會生效。

## 自動同步與 Log

自動同步間隔可設為 `5` 至 `1440` 分鐘，預設為 `10` 分鐘。儲存新間隔後，會從下一輪同步開始套用。手動執行 `立即重新整理`，或針對單一額外網域執行 `立即更新`，都不必等待下一個週期。

Log 可用來區分四類問題：

| Log 階段 | 常見問題 |
| --- | --- |
| 取得 IP | 偵測站無法連線、網路介面沒有候選、Static IP 或來源網域無效 |
| 供應商身分驗證 | Token、Secret、權限或系統時間錯誤 |
| Zone / Record 查詢 | 根網域、Zone ID、Site Name 或完整網域不相符 |
| 建立／更新 | API Rate Limit、Record Type 衝突、TTL 或 Proxy 狀態不受支援 |

清除 Log 不會清除設定與 Runtime 狀態。疑難排解時，請保留最後一次失敗及其前後的記錄；分享前務必遮蔽 Token、Secret、Zone ID 與公網 IP。

## 子網域情境的最小規劃

以 `example.com` 為例，可以讓 `auth.example.com` 與各服務子網域都連到同一個閘道入口。常見作法是維護身分驗證 Host 與 Wildcard DNS Record；實際使用 A、AAAA 或 CNAME，取決於 DNS 供應商與網路拓樸。

IPv6 不會自動取代 IPv4。若只設定 IPv6，用戶端、路由器與 CDN 都必須具備可用的 IPv6 連線；雙協定棧環境中應分別測試兩種 Record。

## 疑難排解

1. 查看 DDNS Log 中的身分驗證、查詢與更新結果。
2. 確認網路介面選擇器預覽的 IP 可從外部路由，而不是 Docker 或內網 IP。
3. 立即更新後，確認狀態卡的「上次成功更新」有所變化；若只有「上次檢查」變動，代表本輪未成功寫入。
4. 確認 DNS Record Name、Zone／根網域與存取使用的 Host 完全一致。
5. 使用 Authoritative DNS 或供應商 Console 確認 Record Value，避免只查看本機 Cache。
6. 從外網依序測試 DNS、TLS、閘道連接埠與實際應用程式，逐層定位問題。

- [Cloudflare DDNS](/zh-tw/guide/cloudflare-ddns)
- [憑證與 HTTPS](/zh-tw/guide/ssl)
- [選擇存取方案](/zh-tw/quick-start/run-modes)
