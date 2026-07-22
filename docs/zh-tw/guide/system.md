---
lang: zh-TW
title: "系統設定與維護"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 8abcc85fd2a43427a0d3a999b56ba2313f5b2a05a558abde08ef58541424b1dc
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 系統設定與維護

`系統設定` 彙整了執行模式、Tunnel 資源、憑證工具、閘道、工作階段、功能開關及維護操作。各分頁會依執行模式與部署能力動態顯示；找不到某個分頁時，應先確認目前平台與執行模式，而不是反覆重新整理頁面。

## 各部署方式的能力差異

| 能力 | 原生飛牛 FPK | Docker | OpenWrt | Linux 服務 | Synology DSM 7 SPK | Windows x86_64 |
| --- | --- | --- | --- | --- | --- | --- |
| 直連模式與 Host 防火牆 | 支援，Process 必須具備主機權限 | 不支援 | 支援，Process 必須具備 root 權限 | 不支援 | 不支援 | 不支援 |
| 智慧連線 | 支援 | 不支援 | 支援；依賴現有的 `dnsmasq`，且 `/etc/dnsmasq.d/` 必須已納入設定；頁面內的 `apt-get` 自動安裝不適用 | 不支援 | 不支援 | 不支援 |
| Web 終端機 | 支援 | 不支援 | 不支援 | 支援，依賴 `tmux` | 不支援 | 不支援 |
| 內建 FRP / Cloudflared | 支援 | 支援 | 支援 | 支援 | 支援 | 不支援 |
| SSH 安全性 | 支援 | 不支援 | 不支援 | 不支援 | 不支援 | 不支援 |
| 自動 HTTPS | 支援 | 不支援 | 不支援 | 支援，必須可使用 `80` 連接埠 | 不支援 | 支援，但仍須打通 Windows Inbound 流量 |
| ACME DNS-01 | 支援 | 支援 | 支援 | 支援 | 支援 | 支援，使用內建 Client |
| 系統時間同步 | 支援 | 不支援 | 支援 | 不支援 | 不支援 | 不支援 |
| 飛牛 SSL 憑證庫同步 | 支援 | 不支援 | 不支援 | 不支援 | 不支援 | 不支援 |
| 安裝更新 | 透過 Web UI 更新 | Pull 新 Image | 安裝 IPK | 依安裝方式手動更新 | 從 DSM 套件中心安裝 SPK | Windows 管理程式 |
| 獨立管理面板密碼 | 使用 fnOS/CGI 入口 | 支援 | 支援 | 支援 | 使用 DSM 桌面 CGI 入口 | 支援；管理入口僅限本機 `127.0.0.1` |

上表以後端回報的 Runtime 能力為準。部分功能入口會顯示為無法使用並附上原因，另一些則會直接隱藏。Windows 不提供直連、內建 FRP / Cloudflared、智慧連線、Web 終端機或 SSH 安全性；其閘道預設在所有 Interface 上監聽 `7999`，但外網是否能連入仍取決於防火牆規則、NAT 與網路政策。Synology DSM 7 SPK 同樣不提供直連、Host 防火牆、智慧連線、Web 終端機或 SSH 安全性。

## 設定導覽

| 分頁或區域 | 顯示條件與管理內容 | 詳細說明 |
| --- | --- | --- |
| `模式` | 永遠顯示；選擇直連、內網穿透或子網域模式及其路由方式 | [執行模式參考](/zh-tw/quick-start/run-modes) |
| `FRP`、`Cloudflared` | 使用內網穿透模式，且平台具備對應能力時顯示；下載並安裝 Tunnel 執行檔 | [內網穿透](/zh-tw/guide/tunnel) |
| `ACME` | 平台支援且不是 Windows 時顯示；管理 `acme.sh` 資源與預設 CA | [TLS 憑證](/zh-tw/guide/ssl) |
| `屬地` | 設定 IP 地理位置資料庫與 CIDR 位址庫 | [IP 地理位置](/zh-tw/guide/ip-location) |
| `fnOS` | 管理飛牛分享直通、連接埠圖示接管及可用的網路最佳化 | [飛牛分享直通](/zh-tw/guide/fnos-share-bypass) |
| `攔截` | Scanner 防火牆、觸發時間窗、門檻及豁免 | [Scanner 攔截](/zh-tw/guide/scanner-interception) |
| `功能` | 首頁入口狀態、Passkey 綁定提示、自動 HTTPS、SSH 安全性、協定映射及智慧連線入口 | 請參考各功能文件 |
| `閘道` | 驗證快取、反代節流、Crawler 攔截、Portal、可見性及 Host 層級轉送選項 | 請參考本頁後續章節 |
| `WAF`、`Log` | HTTP 規則防護及結構化 Request Log | [WAF](/zh-tw/guide/waf)、[Request Log](/zh-tw/guide/request-logs) |
| `終端機` | 平台具備 Web 終端機能力，且不是 Synology 時顯示 | [Web 終端機](/zh-tw/guide/web-terminal) |
| `工作階段` | 一般工作階段、記住我、登入後 IP 授權及 IP 漂移 | [工作階段與 IP 軌跡](/zh-tw/guide/session-management) |
| `面板` | Docker、OpenWrt、Linux 與 Windows 顯示；修改或重設獨立管理面板密碼 | 請參考本頁後續章節 |
| `Challenge` | 登入前使用 PoW 或 Cloudflare Turnstile | [Challenge](/zh-tw/guide/captcha) |
| `維護` | 匯出、匯入及清空資料 | 請參考本頁後續章節 |

## 閘道基本設定

`系統設定 → 閘道` 頂端的設定會直接同步到 Go 閘道。Host 層級編輯器僅能在採用 Host 路由的子網域模式中使用；驗證服務 Host 不會出現在可編輯清單中。

| 設定 | 行為與注意事項 |
| --- | --- |
| `成功鑑權快取時長` | 快取同一 Client 與同一驗證 Target 的成功結果；`0` 代表每次 Request 都即時驗證 |
| `失敗鑑權快取時長` | 快取未通過驗證的結果；`0` 代表不重複使用拒絕結果。排查剛修改的權限時，須留意舊的失敗結果是否尚未過期 |
| `啟用網關反代節流` | 依 Client IP 使用每秒 Request 數及 Burst Token 控制流量；超過限制後，會在設定時間內直接中斷連線 |
| `攔截爬蟲請求` | 攔截閘道辨識到的 Crawler 存取；這無法取代 WAF，也不會阻擋繞過閘道的 Request |
| `傳送門設定` | 控制登入後的應用程式切換入口 |
| `可見性` | 依地區或 CIDR 限制哪些來源能連到閘道 |
| `協議頭` | 控制閘道是否向指定 Target 傳送 `X-Forwarded-*` |
| `Host 回應` | 控制閘道是否向指定 Target 保留訪客 Request 的 `Host` |
| `路徑回應` | 為服務 Host 加入 Path-based Reverse Proxy 或固定回應 |

反代節流的初始設定為每個 Client IP 每秒 `100` 個 Request、`200` 個 Burst Token，超過限制後封鎖 `30` 秒。遭節流機制直接中斷的 Request 不會寫入 Request Log；若看到 Client 斷線，卻找不到對應記錄，也要檢查這一層。頁面上的 Host 層級開關最終會依 Target 編譯：多個 Host 指向完全相同的 Target 時，會共用協議頭與 Host 保留行為。

## 修改設定後的驗證順序

1. 先在區域網路內保留一個可用的管理入口。
2. 修改執行模式、Host、憑證或閘道設定後，等待頁面提示 Runtime 同步完成。
3. 以無痕視窗驗證登入流程，再從真實外網測試服務 Host。
4. 在 Request Log 中核對 Client IP、路由類型、驗證結果及 Upstream Target。
5. 到事件中心檢查同步、憑證、Tunnel 或通知錯誤。

針對閘道節流、WAF 與 Scanner 攔截，建議先以觀察模式和較寬鬆的設定起步。這些功能可能影響 Health Check、第三方 Callback、應用程式更新或 Client 長連線。

## 備份與還原

從維護頁匯出的 `.knock` 封裝檔包含設定、憑證私鑰、TOTP seed 及多種服務憑據，應視為明文密鑰備份。匯入並不是 Merge：它會取代目前 fn-knock 的應用程式資料，再同步閘道、WAF、SSL 等 Runtime 狀態；若出現同步警告，系統不會自動整體 Rollback。

封裝檔安全性、版本與 `128 MiB` 限制、各平台入口、完整還原驗收及失敗處理方式，請參考[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。應用程式備份不等同於檔案系統或 Container Volume 備份，也不包含外部 DNS、Host 防火牆及 Upstream 應用程式資料。

## 清空所有資料

`系統設定 → 維護 → 清理 → 清空所有資料` 用於將目前 Instance 徹底初始化。操作前必須輸入 `清空所有資料` 確認；系統會清除後端設定、帳號、工作階段、Log 及其他應用程式儲存資料，並清空目前瀏覽器的本機資料後重新載入頁面。

資料庫結構及已匯出的備份檔不會自動替你還原內容。此操作無法復原：只有在確認備份可用，且確定要重新初始化 Instance 時才可執行。

## 管理面板密碼

Docker、OpenWrt、Linux 與 Windows 的管理面板密碼，都與訪客的閘道登入憑據分開。忘記面板密碼時，請使用對應部署文件中的重設指令或管理程式；重設只會清除面板密碼、面板工作階段及登入退避狀態，不會刪除服務映射或憑證設定。

- [控制台與更新](/zh-tw/guide/dashboard-and-update)
- [驗證、工作階段與服務範圍](/zh-tw/guide/auth)
- [安全邊界與基準設定](/zh-tw/guide/security)
- [Synology DSM 7 部署](/zh-tw/quick-start/synology-deployment)
- [Windows x86_64 部署](/zh-tw/quick-start/windows-deployment)
