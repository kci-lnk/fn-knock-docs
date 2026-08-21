---
lang: zh-TW
title: "WAF"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 4202983724ef87f7ee2166c4a67a1e5e99963cd32b52e4937182ed6becd88b21
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# WAF

WAF 會檢查所有經過 fn-knock 的 HTTP Request，並依已啟用的規則記錄或阻擋可疑內容。它適合用來補強閘道驗證與應用程式安全性，但無法保護繞過閘道的連接埠、TCP/UDP 流量或 Host 上的服務。

fn-knock 使用 Coraza 載入系統規則與自訂規則。全域開關、防護強度、規則啟停及規則更新，都會同步至 Go 閘道。

## 啟用前檢查

1. 確認[真實 Client IP](/zh-tw/guide/gateway-proxy-headers) 是否正確。若前方有 CDN 或上層 Reverse Proxy，但閘道看到的始終是 Proxy Node 位址，WAF Log、封鎖清單及來源判斷也會使用錯誤的位址。
2. 確認 Target 服務只能經由 fn-knock 存取。WAF 不會檢查繞過閘道、直接連到 Upstream Port 的 Request。
3. 保留一個不依賴服務入口的管理方式，發生誤攔時才有辦法調整規則。
4. 先記錄 Health Check、Webhook、Upload Endpoint 及應用程式 API 的正常 Request 特徵，啟用後應優先觀察這些 Path。

## 全域設定

在 `系統設定 → WAF` 中設定下列項目：

| 設定 | 預設狀態或範圍 | 生效方式 |
| --- | --- | --- |
| 啟用 WAF | 預設關閉 | 啟用時會先檢查並同步系統規則，再依目前強度載入閘道；關閉後會立即略過 WAF 檢查 |
| 規則自動更新 | 預設啟用 | 後端會自動維護系統規則；更新失敗時，會在後續週期繼續嘗試 |
| 常用地豁免 | 預設關閉 | 來自最近登入常用地區的 Request 會略過 WAF 檢查 |
| 防護強度 | 1～4 級，預設 1 級 | 修改後會立即重新套用至閘道 |

防護強度分為：

- `1 級 · 日常防護`：一般使用情境的建議值；
- `2 級 · 加強防護`：比對更敏感，須特別觀察服務 API；
- `3 級 · 嚴格防護`：誤攔機率會進一步提高；
- `4 級 · 最高防護`：主要用於短時間排查，不建議在未驗證的情況下長期使用。

較高等級不能取代漏洞修補。它會啟用更嚴格的偵測範圍，也更容易把合法 Request 判定為異常。

### 常用地豁免的邊界

常用地取自近期的登入位置。啟用豁免後，符合這些地區的 Request 會完全略過 WAF，而不是只降低部分規則分數。行動網路、VPN、企業 NAT 出口及 IP 地理位置資料庫誤差，都可能擴大豁免範圍；因此仍應限制 Upstream Port，並保留驗證、封鎖清單及 Request Log。

Scanner 攔截也有獨立的常用地豁免開關；變更 WAF 開關不會連動 Scanner 設定。

### 區域網路豁免的邊界

預設關閉的區域網路豁免會讓私有、迴環、鏈路本地與電信級 NAT 客戶端位址略過全部 WAF 檢查。只有這些網路可信時才開啟，並先在請求記錄確認真實客戶端 IP；若前置代理把公網訪客錯認為私網，就會繞過 WAF。此設定獨立於登入本地豁免、常用地豁免與單一 Host WAF 開關。

## 系統規則

系統規則區會顯示 Remote Manifest 時間、本機同步時間及是否有更新，並支援：

- 手動更新規則；
- 個別啟用、停用、檢視及下載；
- 批次啟用或停用所選規則；
- 全部啟用或全部停用；
- 還原為「僅開啟推薦」。

啟用全域 WAF 時，系統會先嘗試更新系統規則，並略過專案預設的高頻誤報規則檔。手動啟用所有規則可能再次引入大量誤報，應先在可 Rollback 的環境中驗證。

「僅開啟推薦」會將系統規則還原為程式建議的啟用狀態，不會修改自訂規則，也不會自動開啟全域 WAF。若 WAF 已啟用，規則變更會直接載入閘道；若 WAF 已關閉，設定會保留到下次啟用時套用。

## 自訂規則

自訂規則區支援一次上傳一個或多個 `.conf` 檔，並可針對每個檔案執行啟停、預覽、下載及刪除。WAF 已啟用時，上傳、啟停或刪除都會立即重新載入閘道規則。

自訂規則由管理員自行維護：

1. 上傳前先檢查規則語法、Phase、Action 及 Rule ID，避免與現有規則衝突。
2. 先用記錄或 Detection-only 模式觀察，再啟用 Blocking Action。
3. 保存原始 `.conf` 檔及變更紀錄。備份還原不能取代規則的獨立版本管理。
4. 刪除自訂規則後，閘道將不再載入該檔案；刪除前可先下載留存。

## 依 Host 略過 WAF

子網域映射進階設定中的服務 Host，預設會啟用 WAF。需要隔離誤攔或相容性問題時，可以只關閉單一 Host 的 WAF；該 Host 會略過全域 WAF，其他 Host 則繼續受到保護。

單一 Host 開關不是獨立的 WAF Instance：全域 WAF 關閉時，Host 開關不會產生任何防護效果。排查完成後，應依 Log 調整規則並恢復該 Host 的防護，不要將關閉 WAF 當成長期相容方案。

## FN Connect 流量接入 WAF

標準版 fnOS FPK 可在 `系統設定 → fnOS → FN Connect 流量接入 WAF` 中，將飛牛遠端存取服務 FN Connect 傳送至本機 fnOS HTTP Port 的流量接入同一套 WAF。此開關只處理 FN Connect Service Process 經 Loopback 位址送出的 IPv4 / IPv6 Request，不會重新導向其他本機 Process 或一般區域網路直連流量；Request Log 與 WAF Log 的路由類型會標記為 `FN Connect`。

啟用接入不等同於已阻斷攻擊：全域 WAF 與對應規則也必須啟用。狀態區會區分已保護、僅偵測、WAF 未啟用或降級，並顯示實際 fnOS Port、入口狀態與最近同步錯誤。系統約每 `5` 秒核對一次規則，並會跟隨 fnOS HTTP Port 變更。

fnOS 已開啟 `強制 HTTPS` 時，程式不接管明文 FN Connect 連線路徑；偵測到該設定時不會啟用重新導向。若 Port 無法連線、規則寫入失敗或本機 WAF 入口異常，系統採用 Fail-open：清理重新導向並停止對應入口，優先避免 FN Connect 整體中斷。此時應依狀態錯誤修復環境，不可將「遠端仍可存取」誤認為 WAF 仍在生效。

此能力只在官網標準版 FPK 提供，且需要 Host Network 權限；`敲門 knock Lite`、Docker、OpenWrt、一般 Linux、Synology 與 Windows 均不顯示。切換前請保留 fnOS 桌面或區域網路管理入口，再透過 FN Connect 發出一筆可辨識的 Request，並在 Request Log 與 WAF Log 中確認路由類型和規則動作。

## 檢視 WAF Log

`WAF 日誌` 頁面會依日期讀取已持久化的 Event。即使目前已關閉 WAF，仍可檢視歷史 Event。頁面支援：

- 選擇有 Log 的日期；
- 搜尋 Trace ID、Host、Path 或 IP；
- 依 Trace ID 檢視同一條 Request Chain；
- 每頁顯示 20、50、100 或 200 筆，並以 Cursor 翻頁；
- 選取一個或多個來源 IP，加入通用封鎖清單，或從通用封鎖清單解除；
- 刪除所選日期的所有 WAF Event。

刪除某一天的 Log 後，無法從管理頁面還原。需要保留稽核證據時，應先匯出或複製詳細資料。

閘道會以 Lease 交付待寫入的 WAF Event；後端會在同一個 SQLite Transaction 中儲存 Event、日期索引與統計，全部成功後才確認移除 Queue 中的副本。若持久化失敗，Lease 會釋放並在之後重新整理時重試；重複交付相同 Trace ID 不會重複累加 Event 統計。因此短暫的磁碟忙碌或寫入錯誤可能讓 Log 延後出現，但不應因一次失敗而直接遺失或重複計數。

從 Request Log 依 Trace ID 跳轉到一筆尚未落盤的 WAF Event 時，頁面會每 `5` 秒自動重試，最多約 `1` 分鐘。仍沒有結果時，請再確認 Request 是否實際進入 WAF、目標 Host 是否啟用 WAF，以及伺服器 Log 中是否有持久化錯誤。

### Log 詳細欄位

詳細資料包含時間、Trace ID、Transaction ID、Action、Mode、HTTP Status Code、Client IP、Remote Address、IP 地理位置、Request Method、Protocol、Host、Path、Query、完整 Request URL、User-Agent、Referer、路由類型、Route Key、Upstream Target、Rule Bundle、Rule ID、規則檔案與行號、Blocking 訊息及錯誤。

Action 通常分為：

- `記錄`：命中規則並寫入 Event，但未因此中斷 Request；
- `阻斷`：規則中斷 Request，並記錄 Rule ID、Action 及回傳 Status Code；
- `放行`：Event 進入 WAF 流程後繼續通過。

同一個 Event 可能命中多條規則。清單會顯示主要規則，詳細資料則會保留其餘規則；排查時不要只看第一條規則名稱。

## 誤攔排查

1. 在 [Request Log](/zh-tw/guide/request-logs) 中確認 Request 已到達閘道，並記下時間、Host、Path、Client IP 及 Trace ID。
2. 在 WAF Log 中搜尋 Trace ID；沒有結果時，再依 Host、Path 或 IP 搜尋。
3. 檢視 Action、Mode、Blocking Status Code、主要規則及規則檔案位置。
4. 預覽對應的規則檔，確認它是系統規則或自訂規則。
5. 優先暫時停用單條規則或降低防護強度，再重現 Request；不建議直接關閉全域 WAF。
6. 確認正常 Request 恢復，且異常 Sample 仍會被記錄或阻擋後，再將調整正式套用。

WAF Log 中沒有 Event 時，還要檢查 Request 是否已被閘道節流、通用封鎖清單、可見性、Scanner 攔截或驗證流程提前處理，以及 Target Host 是否已關閉 WAF。

## 無法保護的範圍

- 未經 fn-knock 的原始連接埠；
- DNS、Router、Cloud Security Group 及設定錯誤的 CDN Origin；
- 服務應用程式的權限設計、資料備份及漏洞修補；
- 非 HTTP 的協定映射流量。

- [Request Log](/zh-tw/guide/request-logs)
- [通用封鎖清單](/zh-tw/guide/general-blacklist)
- [Scanner 攔截](/zh-tw/guide/scanner-interception)
- [安全邊界與基準設定](/zh-tw/guide/security)
