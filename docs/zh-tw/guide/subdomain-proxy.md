---
lang: zh-TW
title: "子網域路由"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 224501413d2eac62c7bf5f3a1fa0728f464c00c7e32fa15ba66e6e735e00a215
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 子網域路由

`子網域映射` 會依 HTTP `Host` 將多個網域分流至本機 Web 服務，是新部署的預設路由方式。它可用於兩種網路拓樸：

- `子網域模式`：網域直接解析至可連線的公網入口。
- `內網穿透 → 子網域映射`：FRP 或 Cloudflared 將各子網域請求送進閘道。

兩者都使用 `auth.example.com` 作為登入入口，並讓 `nas.example.com`、`alist.example.com` 等服務 Host 共用同一個閘道。路徑映射是舊部署的相容方案，不是子網域映射的先決條件。

## 請求流程

```text
瀏覽器 -> 公網直連或 Tunnel -> fn-knock 閘道 -> 依 Host 比對 -> 本機 Target
                                  |
                                  +-> 公開 / 要求登入 / 進階驗證臨時憑據
```

公網直達且保留預設連接埠時，通常透過 `https://nas.example.com:7999` 存取。前方接入 EdgeOne、ESA 或 Cloudflared 後，訪客通常會使用標準的 `https://nas.example.com`，但 Origin 仍會連回實際閘道連接埠。

## 設定順序

1. 在 `系統設定 → 模式` 中選擇 `子網域模式`，或選擇 `內網穿透 → 子網域映射`。
2. 在 `子網域映射` 中儲存根網域，例如 `example.com`。
3. 按下 `新增身分驗證服務`，建立 `auth.example.com`。
4. 設定公網 DNS、路由器轉送或 Tunnel Public Hostname，讓相關 Host 都進入同一個閘道。
5. 新增服務 Host，並決定每筆映射是否啟用 `要求登入`。
6. 需要依來源或請求特徵放行時，從映射右側選單進入 `進階驗證設定`。
7. 使用行動網路驗證登入重新導向、返回 URL，以及請求記錄中的用戶端 IP。

公網直連的完整流程請參閱[子網域模式快速上手](/zh-tw/quick-start/subdomain-mode)與[直連存取教學](/zh-tw/tutorials/subdomain-direct-with-fknock)。

## 子網域模式設定

| 欄位 | 作用 | 建議 |
| --- | --- | --- |
| `網域` | 產生服務 Host 的父網域，例如 `example.com` | 先儲存，再新增身分驗證服務與服務映射 |
| `目前身分驗證服務` | 尚未登入時的統一登入入口 | 使用 `auth.example.com`；只能有一筆 |
| `身分驗證服務公網 HTTPS 連接埠` | 產生登入 Redirect URL 時使用的訪客端 HTTPS 連接埠 | 公網直連或 FRP 依實際 Port 填寫；託管 Cloudflare Tunnel 隱藏此項並使用標準 HTTPS |
| `Edge Network 真實 IP 識別` | 在公網直連子網域模式中讀取 EdgeOne／ESA 的訪客 IP | 只有對應平台回源時才顯示；託管 Cloudflare Tunnel 會隱藏此項 |

身分驗證服務公網 HTTPS 連接埠只會影響外部 URL，不會修改程式 Listen Port，也不會替路由器、Container 或 Edge 平台開放連接埠或建立 NAT Forwarding。

使用託管 Cloudflare Tunnel 時，子網域清單、驗證位址、登入 Redirect 與 `redirect_uri` 都使用 `https://host.example.com`，不會附加舊設定中殘留的 `:7999`。Cloudflare 外部 Port 與 fn-knock 本機 Tunnel 入口由託管流程處理。

根網域與 Host 映射都不能包含 `*`。根網域應填寫 `example.com`，服務映射填寫 `nas` 或 `nas.example.com`；DNS 是否另外設定 `*.example.com` Wildcard Record 是不同層級的設定，請勿將 Wildcard 寫入 fn-knock 的根網域或 Host。

### EdgeOne / ESA

公網直連子網域模式可啟用騰訊雲 EdgeOne／阿里雲 ESA 支援。啟用後，公開 URL 可省略 `:7999`，子網域清單、映射 URL 與身分驗證服務也只顯示公開 Host，不再附加舊設定中殘留的閘道連接埠。這只影響訪客端顯示；Edge Origin 仍需指向 fn-knock 的實際 Listen Port。閘道也會依平台 Header 讀取真實用戶端 IP：

| 平台 | 用戶端 IP Header |
| --- | --- |
| 騰訊雲 EdgeOne | `EO-Connecting-IP` |
| 阿里雲 ESA | `Ali-Real-Client-IP` |

ESA 還必須在站台的 Managed Transform 中啟用「新增真實用戶端 IP 標頭」。此開關只涵蓋 EdgeOne／ESA，不是可套用至任意 CDN 的通用信任開關；Cloudflared 應使用 `內網穿透 → 子網域映射` 的專用連線路徑。

Edge 平台負責外部 `80 / 443` 時，Origin 仍應指向 fn-knock 的實際閘道連接埠，並停用會快取登入回應的規則、允許 WebSocket。憑證與 DNS 解析請分別參閱 [SSL 憑證](/zh-tw/guide/ssl)與 [DDNS 管理](/zh-tw/guide/ddns)。

## Host 映射

一筆映射至少包含 Host 與 Target：

```text
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
photos.example.com -> http://127.0.0.1:5666/photos/
```

| 欄位 | 行為 |
| --- | --- |
| `Host／子網域名稱` | 比對請求的 Host；已儲存根網域時可只填 `nas` |
| `Target` | HTTP、HTTPS、WS 或 WSS 上游 URL，可包含 Base Path，且必須能從 fn-knock 所在環境連線 |
| `目標路徑用法` | Target 含非根路徑時選擇 `僅作為入口` 或 `固定前綴`；驗證服務固定使用入口模式 |
| `要求登入` | 尚未登入時導向身分驗證 Host，完成後返回原始 URL |
| `停用`／`排程啟用或停用` | 手動下線，或依伺服器本機時間每天控制開放時段 |
| `群組` | 將服務 Host 放入現有群組；身分驗證服務不能分組 |
| `顯示傳送門` | 控制登入後頁面中的應用程式切換與登出入口 |
| `顯示標題` | 覆寫清單、傳送門與書籤中的顯示名稱 |
| `應用程式圖示` | 使用自動擷取圖示，或上傳目前服務 Host 的自訂圖示 |
| `略過 Basic Auth` | 向上游請求注入 Basic Auth 使用者名稱與密碼 |
| `閘道可見性` | 繼承全域規則、使用目前 Host 規則覆寫，或只關閉目前 Host 的可見性限制 |
| `啟用 WAF` | 服務 Host 預設啟用；關閉後，目前 Host 會略過全域 WAF |

直接編輯已儲存映射的 Host／子網域會視為重新命名，並保留該映射的登入策略、可見性、進階驗證與 Basic Auth 憑據注入。不要用新增相同 Target 的別名來取代重新命名；別名是獨立映射，不會繼承原 Host 的受保護設定。

服務應盡量只 Listen 在 Loopback 或內網 IP，避免繞過閘道。在 Docker 中，`127.0.0.1` 代表 Container 本身；反向 Proxy 至 Host Service 時，應使用 Container 可連線的 Host IP。Docker 部署的 Target 欄位會提示偵測到且可連線的區域網路 IP 候選，但提示不會修改 Container Network、Port Publishing 或上游 Listen 範圍。

Target 含非根路徑時，編輯器會顯示 `目標路徑用法`：

- `僅作為入口（相容模式）`：預設值。只有訪客存取網域根路徑時才使用 Target 內的路徑，其他 Request Path 保持不變。例如 Target 路徑為 `/login` 時，`/` 會進入上游 `/login`，但 `/assets/app.js` 仍進入上游 `/assets/app.js`。適合入口頁位於子路徑、但靜態資源或登入 Callback 仍位於上游根目錄的應用程式。
- `固定前綴（目錄掛載）`：將 Target 路徑加到每個上游 Request 前。例如 Target 路徑為 `/webdav` 時，訪客 `/floccus/a` 會轉送到上游 `/webdav/floccus/a`。適合 WebDAV 或明確支援目錄掛載的服務。

既有映射若缺少此欄位，會依 `僅作為入口` 處理。無論選擇哪一種模式，都應實際驗證首頁、靜態資源、Redirect、Cookie 與 WebSocket；此選項只決定上游 Request Path 的組合方式，無法替上游改寫 HTML、Cookie Path 或絕對 URL。標題與圖示擷取會使用完整 Target，並保留明確連接埠。

身分驗證服務是一筆特殊的 Host 映射：它必須公開，不能再啟用要求登入或 Basic Auth 注入，否則登入入口會形成 Redirect Loop 或被自身攔截。

### 群組檢視

開啟清單上方的 `群組檢視` 後，可在 `管理群組` 中建立、重新命名、排序或刪除群組，並透過單筆編輯、批次移動或拖曳將服務 Host 放入群組。最多可建立 `32` 個群組；名稱必須為 `1`～`40` 個字元，且忽略大小寫後不得重複。刪除仍有映射的群組不會刪除 Host，而是將它們移至「未分組」。

群組順序與 Host 順序會同步到登入後的傳送門及內建 `/__select__` 選擇頁；匯出瀏覽器書籤時也會建立對應的群組資料夾。切回清單檢視後，群組歸屬仍會保留，但傳送門、選擇頁及新匯出的書籤會使用扁平順序。搜尋時只顯示命中的群組與 Host，並暫時展開結果；收合狀態只儲存在目前瀏覽器。

群組只會改變導覽與管理順序，不會修改驗證、可見性、WAF 或 Target。身分驗證服務永遠位於群組之外，憑據的 Host 服務範圍仍依實際存取權限判斷。

### Basic Auth 是上游憑據注入

`略過 Basic Auth` 儲存的是 Target Service 本身的 Basic Auth 憑據。閘道在轉送請求、擷取頁面標題與 Favicon 時，會將憑據傳給上游，避免瀏覽器再次跳出 Basic Auth 對話框。

它不會建立 fn-knock 帳號、不能取代 `auth.example.com` 登入，也不會變更 `要求登入` 或既有 `strict_whitelist` 規則。憑據應視為敏感設定處理；只有確實需要時才儲存。

使用者名稱與密碼必須同時填寫，且使用者名稱不可包含半形冒號。儲存不完整或無效的設定時，系統會停用該項目並清除憑據，不會保留只設定一半的狀態。

### 應用程式圖示

編輯一般服務 Host 時，開啟 `應用程式圖示` 可預覽目前來源、重新擷取上游圖示，或上傳自訂圖片。支援 PNG、JPG、WebP、AVIF、SVG 與 ICO，原始檔案不可超過 5 MB；瀏覽器會移除 SVG 中的外部內容，伺服器也會拒絕包含不安全 `DOCTYPE` 或 Entity Declaration 的 SVG，再將圖片完整縮放到方形畫布並轉換為不超過 128 KiB 的內嵌圖示。

自訂圖示會優先顯示在子網域清單與傳送門中，匯出瀏覽器書籤時也會一併寫入。按一下 `還原自動擷取` 會清除自訂覆寫並重新讀取 Target；若 Target 未回傳圖示，頁面會顯示尚未擷取。身分驗證服務不支援自訂圖示。圖示會包含在設定與 `.knock` 備份中；請勿將敏感的內部圖形當作一般疑難排解附件分享。

### 單一 Host 的可見性與 WAF

啟用全域閘道可見性後，服務 Host 的進階設定可選擇「繼承全域」「自訂」或「關閉」。自訂規則會取代全域規則；關閉只會讓目前 Host 略過可見性檢查；身分驗證 Host 必須繼承全域規則。設定方式與回復建議請參閱[閘道可見性](/zh-tw/guide/gateway-visibility)。

服務 Host 預設啟用 WAF，可個別關閉以略過全域 WAF。全域 WAF 本身關閉時，此開關不會產生任何防護；身分驗證 Host 無法透過 Host 設定繞過 WAF。詳細原則請參閱 [WAF](/zh-tw/guide/waf)。

### 進階驗證

啟用 `要求登入` 的 HTTP／HTTPS 服務 Host，會在右側選單顯示 `進階驗證設定`。它可依來源 IP、地區、URL Path、Request Header、Query Parameter 或 HTTP Method，簽發僅限目前 Host 的臨時憑據；未命中規則的請求會繼續使用一般登入流程。

規則命中後放行的是整個目前 Host，而不是只有觸發規則的路徑或請求。它也不等同於系統登入，不會建立傳送門或授權其他 Host。設定前請先閱讀[子網域進階驗證](/zh-tw/guide/advanced-auth)。

## 存取原則與 `local_exempt`

| 目前介面設定 | 未獲授權的公網請求 |
| --- | --- |
| 關閉 `要求登入`（目前為登入優先映射） | 直接進入上游 |
| 啟用 `要求登入` | 沒有有效來源 IP 授權或工作階段時，導向身分驗證 Host |
| 啟用 `要求登入` 與進階驗證 | 規則命中時簽發目前 Host 的臨時憑據；未命中時繼續檢查來源授權與登入 |

後端仍相容舊設定中的 `strict_whitelist` 規則：即使關閉 `要求登入`，它也不一定公開，仍會依有效的來源授權記錄判斷（手動建立或登入後自動建立），瀏覽器工作階段 Cookie 本身無法取代來源條件。目前的 Host 編輯介面沒有新增或切換嚴格允許清單規則的控制項；需要退出此模式時，請先記錄完整映射，再透過目前介面重新建立。新映射中，手動來源授權可獨立放行；自動 IP 授權通常允許同一來源繼續存取，但不會覆蓋已攜帶的服務範圍拒絕。`IP 允許清單` 不是嚴格來源限制開關。需要在請求到達映射前先限縮來源時，請使用[閘道可見性](/zh-tw/guide/gateway-visibility)或外部網路層規則。

登入憑據可限制允許存取的 Host 範圍。使用某組憑據成功登入，不代表它自動擁有所有服務子網域的權限。

身分驗證服務會先判斷閘道識別到的來源 IP。Loopback、私有網路、Link-local 等來源會回傳 `local_exempt`，略過一般登入與嚴格允許清單檢查。這代表區域網路屬於預設信任邊界：

- 既有嚴格允許清單規則也不會要求區域網路來源必須登入。
- 憑據的 Host 服務範圍不會用來限制本地豁免來源；這是網路信任邊界，不適合用來驗證憑據範圍。
- 區域網路測試無法證明公網原則有效。
- FRP、Cloudflared、EdgeOne 或 ESA 位於前方時，應從請求記錄確認真實公網 IP 已傳至閘道；若 Proxy 的私有 IP 被誤認為訪客來源，會改變授權結果。

來源網路設定請參閱 [IP 允許清單](/zh-tw/guide/whitelist)與[閘道可見性](/zh-tw/guide/gateway-visibility)。

## 批次匯入與維護

`一鍵探索` 會掃描允許的本機 IPv4 網段，並產生候選 Host。掃描最多接受 `16` 個 CIDR，合計 `1024` 台主機；只會掃描 Loopback、網路介面、Docker Host、既有映射與手動儲存的本機範圍，不會用來探測公網。

掃描視窗可選擇「依裝置建議」（預設）或低、中、高、極高強度。等級只會改變 Concurrency、速度與裝置負載，不會改變掃描範圍或探索結果；預設會綜合 CPU、可用記憶體與 File Descriptor 預算，選擇較安全的等級。NAS、路由器等資源較有限的裝置，建議維持自動或低強度。

掃描連接埠、CIDR 允許範圍、Docker 網路視角與批次儲存規則，請參閱[服務探索與批次串接](/zh-tw/guide/service-discovery)。

清單操作包括：

- `多選`：進入選擇模式後，可選取目前搜尋結果、單一群組或任意服務 Host，批次移動群組、啟用、停用、套用相同每日開放時間窗或刪除；驗證服務不參與批次選擇。搜尋條件或檢視變更會清除目前選擇，批次刪除無法復原。
- `重新整理圖示與標題`：重新擷取 Upstream Metadata。
- `清理過期服務`：先以 `HEAD`、失敗後改用 `GET` 檢查 HTTP / HTTPS Upstream，由管理員確認後刪除無法連線的映射。
- `匯出為書籤`：匯出服務 Host，不包含驗證服務。
- `清空所有設定`：經過兩次確認後刪除驗證服務及所有 Host 映射，保留 Root Domain 等模式設定。

單一 Host 的流量詳細資料可查看即時流量與有效 IP，並將異常來源加入[通用封鎖清單](/zh-tw/guide/general-blacklist)。

### 深度監控

一般 Request Log 無法解釋 HTTP 或 WebSocket 問題時，可從單一服務 Host 的 `更多 → 深度監控` 啟動限時擷取。監控只接受已設定的精確 Host，預設持續 `30` 分鐘，最長 `2` 小時；頁面會顯示即時摘要，並可下載包含 Request、Response、Upstream 與 WebSocket Payload 資訊的 ZIP。

深度監控會將 Cookie、`Authorization`、Request Body、Response Body 與 WebSocket 原始 Frame 以未遮蔽形式寫入閘道磁碟。只在重現問題所需的短時間內啟用，完成後立即停止並清除；未手動刪除的資料會在工作階段停止 `24` 小時後自動移除。匯出的壓縮檔應視同憑據檔案，不要直接上傳至公開 Issue 或群組聊天。

即時文字區只保留最近 `1000` 行摘要；若看到捨棄計數、Quota 用盡、寫入過載或儲存錯誤，請以下載包與工作階段停止原因為準。深度監控用於短期故障取證，不能取代常時啟用的[Request Log](/zh-tw/guide/request-logs)、[WAF](/zh-tw/guide/waf)或 Upstream 應用程式 Log。

## Host 路由的延伸能力

- [Path 回應](/zh-tw/guide/gateway-path-response)只為某個 Host 加入少量特殊 Path；未命中時仍會返回該 Host 的預設 Target。
- [協定映射](/zh-tw/guide/stream-mappings)為公網直連子網域模式補充 TCP / UDP 連接埠，不適用於內網穿透的子網域映射。
- [飛牛分享直通](/zh-tw/guide/fnos-share-bypass)只會 Bypass 合法的飛牛 `/s/...` 分享路徑，不會公開整個網站。

這些能力都不會改變 Host 是 Web 主要路由的基本架構。

## 平台限制

- Host 路由可在飛牛 FPK、Docker、OpenWrt、Linux、macOS、Synology DSM 7 SPK 及 Windows 上使用；實際能否從公網連線，仍取決於各平台的 Port Publishing 與網路路徑。
- 自動寫入 Host 防火牆及智慧連線，只由具備對應 Runtime 能力的飛牛標準 FPK 提供；Docker、OpenWrt、Linux、macOS、Synology 與 Windows 均不提供。
- 協定映射只會顯示在公網直連子網域模式中。即使 Docker 額外 Publish Port，也不會由 fn-knock 管理 Host 防火牆。
- OpenWrt 的連接埠放行與區域網路 DNS 分流由 OpenWrt 自行管理；fn-knock 不提供直連、Host 防火牆管理或智慧連線，也不提供 SSH 安全性、Web 終端機或應用程式內 FPK 更新。
- fn-knock 不會自動關閉 Upstream Service 原有的公網監聽，也無法取代 Upstream 更新、備份及最小權限設定。

## 驗證與疑難排解

請依請求流程檢查：

1. DNS 或 Tunnel 是否將目前 Host 送到正確閘道；託管 Cloudflared 請先檢查核對狀態、Wildcard DNS 與 Ingress。
2. 請求記錄中的 Host 與用戶端 IP 是否正確。
3. 身分驗證服務是否存在，且未啟用要求登入或 Basic Auth。
4. 服務映射是否啟用，目前時間是否位於開放時段內。
5. Target 是否能從 fn-knock Runtime 環境連線。
6. 登入憑據是否允許目前 Host；若啟用進階驗證，再確認規則組、條件與臨時憑據狀態。
7. 若存在舊版嚴格允許清單規則，檢查目前公網來源是否已獲准放行。
8. HTTPS 憑證是否涵蓋目前 Host，前置平台是否允許 WebSocket，且未快取身分驗證回應。

請先接入一至兩個服務並完成外網驗證，再進行批次探索與收緊存取原則。
