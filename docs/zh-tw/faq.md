---
lang: zh-TW
title: "常見問題"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 4e8c4b6f884ac5c3246201b7daf66b0bc04ca3b13b0136966ce914d78756a494
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 常見問題

請依症狀定位問題。先確認目前的部署方式、執行模式，以及你存取的是管理入口或閘道入口。

## 無法開啟管理入口或登入

### 該開啟桌面圖示，還是閘道入口

| 目的 | 入口 |
| --- | --- |
| 修改設定、檢視 Log、切換模式 | 飛牛桌面的 `敲門 knock`；Synology 請從 DSM 主選單開啟 `敲門 knock`；OpenWrt 使用 `服務 → 敲門 Knock`；Windows 使用 `fn-knock Windows 管理程式` 開啟本機管理頁 |
| 驗證公網、網域、Tunnel 或服務映射 | 實際 Gateway Port 或對應的外部網域；通常為 `7999` |

OpenWrt 的預設 Management Port 為 `7991`，Gateway Port 仍是 `7999`。Windows 管理頁嚴格限制在 `127.0.0.1:7991`，無法從其他裝置開啟。其他部署方式的連接埠請參考[連接埠與入口](/zh-tw/quick-start/ports-and-entrypoints)。

### 無法開啟 Windows 管理頁

先開啟 `fn-knock Windows 管理程式`，確認 `FnKnock` Service 狀態已就緒，再點選「開啟管理後台」。首次安裝的預設位址為 `http://127.0.0.1:7991/`，只能從安裝該程式的 Windows 主機存取。

若 Service 無法就緒，請優先檢查五個預設連接埠是否遭占用。透過管理程式修改連接埠並儲存，不要直接編輯 `%ProgramData%\FnKnock\config\runtime.json`。完整步驟請參考 [Windows x86_64 部署](/zh-tw/quick-start/windows-deployment)。

### Synology 顯示無法讀取 DSM 工作階段

關閉目前的 fn-knock 頁面，確認 DSM 登入仍有效，再從 DSM 主選單重新開啟 `敲門 knock`。Synology 管理入口需要從 DSM 桌面視窗讀取工作階段；直接收藏或開啟 `launch.html`、`index.cgi`，或將內部位址複製到新分頁，都可能缺少必要的 DSM Context。

只有 administrators 群組成員能進入管理介面。若仍然失敗，請先到套件中心確認 fn-knock 已啟動，再重新登入 DSM。不要改成公開 `7998`；完整入口與連接埠說明請參考 [Synology DSM 7 部署](/zh-tw/quick-start/synology-deployment)。

### 後台顯示儲存錯誤

目前版本使用 SQLite，新安裝不需要 Redis。

- 新安裝：檢查 Data Directory 權限、連接埠衝突及 Service Log。
- 從早期 Redis 版本升級：保留舊 Redis Data Volume，依 [Docker 部署](/zh-tw/quick-start/docker-deployment)中的遷移步驟處理。
- OpenWrt：確認 `/etc/fn-knock/gateway` 與 `/var/lib/fn-knock` 仍然存在。

不要為新安裝另外建立空的 Redis。舊資料遷移完成且確認後台正常後，再移除舊 Redis Service 與 Data Volume。

### 忘記管理密碼

管理密碼與訪客驗證憑據不是同一項。請依部署方式進入本機 Console 或 Container 執行重設，不要刪除 Data Directory：

- Docker：請參考 [Docker 部署](/zh-tw/quick-start/docker-deployment)的管理密碼復原說明。
- OpenWrt：請參考 [OpenWrt 部署](/zh-tw/quick-start/openwrt-deployment)。
- 飛牛 fnOS FPK：優先從飛牛桌面重新進入 `敲門 knock`。
- Windows：優先在 `fn-knock Windows 管理程式` 中點選「清除管理密碼」。若無法開啟管理程式，請在應用程式安裝目錄中，以系統管理員 PowerShell 執行 `.\fn-knock-service.exe reset-panel-password`。

## 管理功能正常，但外網無法存取

### 後台可以開啟，但外部網域仍然 Timeout

後台正常只代表 Management Service 正在執行。請依序檢查：

1. 目前的網路拓撲是否選對：公網直連或內網穿透。
2. 外部流量是否送到實際 Gateway Port，而不是 Management Port。通常為 `7999`。
3. DNS 是否指向目前的 Public IP 或 Tunnel 入口。
4. 使用公網直連時，Router 的 Port Forwarding 與 Host 防火牆是否放行。
5. 使用內網穿透時，Tunnel 是否 Online 且指向正確的本機閘道。
6. `Request Log` 中是否看得到該筆 Request。

若無法設定公網 Inbound，請使用[內網穿透：子網域路由](/zh-tw/quick-start/reverse-proxy-mode)。

### 從 LAN 或公網連不到 Windows 的 `7999`

目前 Windows 版的 `7999` 預設監聽所有 IPv4 / IPv6 Interface；無法連線通常代表 Inbound Path 尚未打通，而不是閘道只監聽 Loopback。安裝程式建立的 `FnKnock Gateway` Inbound Program Rule，只涵蓋 Windows 的「網域」及「私人」網路設定檔，不涵蓋「公用」網路。

請沿著流量路徑檢查：Windows 目前的網路設定檔與第三方資安軟體、Router 或 NAT Forwarding、IPv6 防火牆，以及 ISP 是否允許 Inbound。管理後台 `7991` 仍嚴格限制在本機，不能作為公網 Origin。Windows 不支援依登入狀態動態管理防火牆或直連授權。

若自行在同一台 Windows 主機上執行 Tunnel 或 Reverse Proxy，建議將 Origin 指向 `127.0.0.1:7999`；但該 Process 不由 fn-knock 管理，而且必須保留 Host 與真實 Client IP。

### 飛牛原生 FPK 的 `7999` 被重新導向其他連接埠

飛牛系統的 `強制 HTTPS 連線` 可能會在 Request 到達 fn-knock 前先執行 Redirect。

進入 `飛牛系統設定 → 安全性 → 連接埠設定 → 設定`，關閉 `強制 HTTPS 連線`，再測試 `7999`。

![飛牛連接埠設定頁面](/settings-port.webp)

### 自動 HTTPS 啟動失敗

只有目前部署方式顯示此功能，且 Host 確實具備 Inbound Path 與可用的 `80` 連接埠時，才能使用自動 HTTPS。Docker、OpenWrt 及 Synology DSM 7 SPK 不提供此開關。請檢查：

- `80` 是否遭其他 Service 占用。
- 目前權限是否允許監聽 Low Port。
- 飛牛系統的 Port Redirect 或其他 Frontend Entry 是否衝突。
- 是否已設定 TLS 憑證。

自動 HTTPS 不會取代憑證申請。Windows 的 `7999` 雖然預設監聽所有 Interface，啟用此功能也不會自動打通防火牆、Router/NAT 或 ISP 的 Inbound 限制。Docker、OpenWrt 與 Synology 應在 Front Proxy、Edge Platform 或閘道外部終止 TLS。請參考 [TLS 憑證](/zh-tw/guide/ssl)。

### 未登入也能直接存取服務連接埠

表示仍存在繞過 fn-knock 的入口。請檢查 Router Port Forwarding、Host 防火牆、IPv6 防火牆及 Front Proxy，關閉直接指向服務的公網規則。

直連授權應只公開驗證閘道，登入後才暫時放行目前的公網出口 IP。Docker 與 Windows 不支援由 fn-knock 管理 Host 防火牆。

## 網域、子網域或 Tunnel 無法運作

### 該選擇哪一種方案

| 條件 | 方案 |
| --- | --- |
| 有公網 Inbound，主要存取 Web 服務 | [公網直連：子網域路由](/zh-tw/quick-start/subdomain-mode) |
| 沒有公網 Inbound | [內網穿透：子網域路由](/zh-tw/quick-start/reverse-proxy-mode) |
| 需要保護 SSH、Remote Desktop 等原始連接埠 | [原始連接埠存取：直連授權](/zh-tw/quick-start/direct-mode) |
| 必須保留舊的 Path Prefix | 內網穿透的 Path 模式，僅供相容用途 |

先依網路拓撲選擇入口，再依 Host、Path 或 TCP/UDP 選擇路由，最後為服務設定存取政策。

### Tunnel 模式需要 DDNS 嗎

通常不需要：

- FRP 使用 Server 位址及 External Port。
- Cloudflared 使用 Cloudflare Tunnel 綁定的網域。

只有 Tunnel 入口本身依賴動態 Public IP 時，才需要為該入口設定 DDNS。

### FRP 與 Cloudflared 該怎麼選

- 已有 FRP Server，希望自行控制公網連接埠與流量：使用 FRP。
- 已使用 Cloudflare，希望減少公網 Server 的維護工作：使用 Cloudflared。

兩者都應將驗證網域與服務網域轉送到 fn-knock 閘道，並保留原始 Host。請參考[內網穿透](/zh-tw/guide/tunnel)。

### Cloudflared Origin 該填 HTTP 還是 HTTPS

- fn-knock 本機閘道沒有設定憑證：使用 `http://...:<實際 Gateway Port>`。
- 本機閘道已設定有效憑證，且 Cloudflared 信任該憑證：使用 `https://...:<實際 Gateway Port>`。

Cloudflared 與 fn-knock 位於不同 Container 時，`localhost` 會指向錯誤的 Container，應改用彼此可連線的 Container Name 或 LAN 位址。請參考 [Cloudflared Tunnel](/zh-tw/guide/cloudflared-tunnel)。

### 子網域開啟了錯誤的服務

請檢查：

1. Front Proxy 或 Tunnel 是否保留原始 Host。
2. Root Domain 與子網域映射是否相符。
3. 是否有重複映射或 Fallback 映射提前命中。
4. 公網 Origin 是否指向實際 Gateway Port。

管理入口不能作為服務 Origin。

### Path 映射出現資源 404 或登入迴圈

Upstream 應用程式沒有正確處理 Path Prefix、Redirect、Cookie 或 WebSocket。新設定應改用獨立子網域；只有 Upstream 明確支援 Prefix 部署時，才繼續使用 Path 模式。

### 一鍵探索掃描不到服務

先確認 Target 是 fn-knock Runtime 環境能存取的本機 IPv4 HTTP 服務。服務探索不會掃描公網、IPv6、網域或非 HTTP Protocol；Docker 中的 `127.0.0.1` 只代表 Container 本身。

將掃描 CIDR 限縮至 Target 所在的實際網段，確認不超過 `16` 個 CIDR、合計 `1024` 台 Host，再從 fn-knock 所在環境直接存取 Target Port。TCP Port 已開啟但無法透過 HTTP 分析時，也不會產生候選項目。完整範圍與強度設定請參考[服務探索與批次串接](/zh-tw/guide/service-discovery)。

### EdgeOne 或 ESA 出現登入迴圈、頁面異常

請檢查：

- Origin 是否指向 fn-knock 的實際 Gateway Port。
- 子網域映射是否啟用對應的平台支援。
- Cache 是否關閉，WebSocket 是否啟用。
- 是否正確傳遞真實 Client IP Header。
- Dual Stack Origin 是否將 Request 分流至不同入口。

專題設定請參考[騰訊雲 EdgeOne](/zh-tw/tutorials/tencent-edgeone-with-fknock)及[阿里雲 ESA](/zh-tw/tutorials/aliyun-esa-with-fknock)。

### 回到家中 Wi-Fi 後仍然繞公網

Client 仍在使用公網 DNS 結果。飛牛原生 FPK 或 OpenWrt 使用智慧連線時，請檢查：

- `系統設定 → 功能 → 智慧連線` 是否啟用。
- 本機 LAN IP 是否正確。
- Router DHCP DNS 或 Client DNS 是否指向 fn-knock 所在裝置。
- Client DNS Cache 是否已重新整理。

OpenWrt 還要確認系統已安裝並執行 `dnsmasq`，且主要設定已納入 `/etc/dnsmasq.d/`；頁面的自動安裝會呼叫 `apt-get`，不適用於 OpenWrt。智慧連線只用於子網域模式的 LAN DNS 最佳化，不會修改 Public DNS。Docker 不提供此能力。請參考[智慧連線](/zh-tw/guide/smart-connect)。

## 登入或工作階段異常

### TOTP、密碼、Passkey 與 QQ 該怎麼選

- TOTP：預設登入方式，也是綁定 Passkey、QQ 及其他外部帳號的基礎；務必保留可用的復原方式。
- 帳號密碼：適合不方便使用身份驗證器 App 的成員。
- Passkey：在既有 TOTP 身分上提供更方便的登入方式。
- QQ：將 QQ 帳號綁定至既有 TOTP 後提供快捷登入，並繼承該 TOTP 的服務範圍，不是獨立使用者。

切換至帳號密碼登入模式後，登入頁不會顯示 Passkey、QQ 或其他外部帳號入口。請參考[驗證與登入](/zh-tw/guide/auth)及[綁定 QQ 快捷登入](/zh-tw/guide/qq-quick-login)。

### 登入頁的人機驗證在哪裡設定

進入 `系統設定 → Challenge`。PoW 與 Turnstile 的差異請參考 [Challenge](/zh-tw/guide/captcha)；Cloudflare 設定請參考 [Turnstile](/zh-tw/guide/cloudflare-turnstile)。

### 「記住我」會如何影響工作階段

工作階段時長在 `系統設定 → 工作階段` 中設定。啟用「記住我」後會使用長期工作階段時長；若 IP 授權設為跟隨工作階段，對應授權也會延長。

只應在個人可信任裝置上使用長期工作階段。

### 刪除 TOTP 後，其他登入方式也失效

刪除某組 TOTP 時，關聯的 Passkey、QQ 及其他外部帳號綁定也會一併失效。刪除前應確認還有其他可用身分；刪除後必須重新綁定相關登入方式。

### 登入成功後仍返回登入頁

請依序檢查：

1. 驗證網域與服務網域是否使用相同的公開 Protocol。
2. Root Domain、Cookie Scope 及 Passkey RP ID 是否相符。
3. 瀏覽器是否阻擋 Cookie。
4. Edge Platform 是否 Cache 了登入回應。
5. Front Proxy 是否傳遞正確的 `Host`、`X-Forwarded-Host` 及 `X-Forwarded-Proto`。
6. 系統時間是否準確。

系統偵測到相同驗證頁或相同 Target 持續迴圈時，會暫停自動 Redirect。此時請從原始服務 Host 重新發起存取，不要反覆重新整理，或複製 Authentication Callback URL。

### 在飛牛 App 中直接填寫位址後無法登入

飛牛 App 能否處理 Web 驗證 Redirect 並重複使用 Cookie，取決於 Client 版本。瀏覽器工作階段不一定會自動共享給原生 App：

- 子網域或內網穿透：先在手機瀏覽器中開啟相同外部網域並登入。
- 直連授權：先在瀏覽器中開啟實際 Gateway Port，再回到 App 連線原始位址。

完整步驟請參考[使用飛牛 App](/zh-tw/tutorials/use-fnos-app-with-fknock)。

### 切換網路後突然失去存取權限

行動網路、Proxy 及家用寬頻可能改變 Public Egress IP。請重新開啟驗證入口登入，並在 `系統設定 → 工作階段` 檢視 `IP 漂移軌跡`。

該軌跡會記錄工作階段從原 IP 移動至新 IP 的過程，不是一般 Request Log。

### 工作階段旁的飛牛圖示代表什麼

這表示該登入工作階段已附加飛牛 token，常見於飛牛 App 或 Web 頁面繼續沿用目前登入。強制登出、主動登出或工作階段過期時，附加的 token 也會失效。請參考[工作階段管理](/zh-tw/guide/session-management)。

## 路由、安全性或 Log 異常

### 登入成功後仍顯示不在允許清單

先確認該 Host 是否繼承歷史 `strict_whitelist` 規則：

- 關閉 `要求登入`：目前的登入優先映射會公開存取，不檢查登入與允許清單；歷史嚴格允許清單映射不適用此行為。
- 開啟 `要求登入`：手動來源授權可獨立放行；自動 IP 授權通常允許相同來源繼續存取，但不會覆蓋已帶有的服務範圍拒絕；沒有可用來源授權時，才檢查工作階段。
- 歷史嚴格允許清單規則：即使關閉 `要求登入` 也不一定會公開；只依有效來源授權記錄判斷（手動或登入後自動建立），瀏覽器工作階段 Cookie 本身無法取代來源條件。

目前的 Host 編輯介面沒有嚴格允許清單選項。遇到歷史規則時，應確認目前 Egress IP 的手動或自動授權記錄；若只允許手動來源，請關閉登入後自動 IP 授權，並檢查遺留的自動記錄。需要退出該規則時，先記下完整映射設定，再透過目前介面重新建立映射；只關閉 `要求登入` 不足以切換為公開存取。

### 飛牛分享連結遭到攔截

飛牛分享直通可以用於子網域路由與內網穿透，不適用於直連模式。請確認 Request 命中真正指向飛牛的 Host 映射或預設路由。請參考[飛牛分享直通](/zh-tw/guide/fnos-share-bypass)。

### 在哪裡啟用 Request Log

進入 `系統設定 → Log` 啟用。啟用後側邊欄會出現 `Request Log`，可依日期查看命中的 Host、Upstream 及 Response Status。請參考 [Request Log](/zh-tw/guide/request-logs)。

### CPU 或記憶體用量很高，但事件中心沒有警示

目前預設必須讓使用率持續達到 `80%` 約 `30` 秒才會產生警示；短暫 Spike 不會立即形成 Event，恢復時也必須持續降至 `60%`。Windows 不提供系統資源監控；Docker 中的數值則依 Container Runtime 可見的 Resource Boundary 解讀。

先確認平台能力、事件系統及資源 Event 正常，再區分「產生資源 Event 的條件」與「觸發通知規則的條件」。後者只決定既有 Event 何時送出，不會改變 Sampling Threshold。請參考[事件中心與通知](/zh-tw/guide/event-center-and-notifications#cpu-與記憶體監控)。

### 通用封鎖清單與 Scanner 封鎖清單有什麼不同

- Scanner 封鎖清單：依未驗證的異常 Path 探測行為自動封鎖。
- 通用封鎖清單：由管理員從 Log 或封鎖清單頁面明確封鎖 IP。

通用封鎖清單只接受單一 IPv4 或 IPv6，不接受 CIDR。網段或地區限制請使用[閘道可見性](/zh-tw/guide/gateway-visibility)；單一異常 IP 請使用[通用封鎖清單](/zh-tw/guide/general-blacklist)。

### 為什麼應儘早設定 HTTPS

HTTPS 能保護登入憑據與工作階段 Cookie，也是 Passkey 正常使用的必要條件。公網網域、FRP 及 Cloudflared 的公開入口都應使用受信任憑證。請參考 [TLS 憑證](/zh-tw/guide/ssl)。

## 安裝、升級或資料異常

### OpenWrt 如何安裝與升級

OpenWrt 支援符合架構的 `.ipk` 與 `.apk` Package。安裝後入口為 `服務 → 敲門 Knock`。

升級時請安裝新版 Package；應用程式內的 FPK 更新不適用於 OpenWrt。正常升級會保留 `/etc/config/fn-knock` 及 `/var/lib/fn-knock`。完整指令請參考 [OpenWrt 部署](/zh-tw/quick-start/openwrt-deployment)。

### Docker 升級後資料變成空白

先停止繼續寫入，確認舊 Data Volume 仍然存在。目前版本使用 SQLite；只有從早期 Redis 版本升級時，才需要執行 Redis 至 SQLite 的歷史遷移。

不要刪除舊 Volume、不要以空 Volume 覆蓋原本的 Mount，也不要在新安裝中額外加入 Redis。請依 [Docker 部署](/zh-tw/quick-start/docker-deployment)的備份與遷移步驟還原。

### 無法匯入 `.knock` 備份，或匯入後出現警告

確認檔案保留原始 `.knock` 副檔名、大小不超過 `128 MiB`，且匯出版本不高於目前 Instance。Target 版本也必須落在錯誤訊息顯示的支援區間內；不要修改 Archive JSON 來偽造版本。

匯入成功後出現警告，代表設定項目已經還原，但閘道、WAF、SSL 等某個 Runtime 同步步驟失敗，不代表整次匯入已自動 Rollback。請保留管理入口，依警告逐項檢查並手動重新儲存對應設定，不要先反覆匯入相同檔案。請參考[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

### Windows 如何更新或清理資料

透過 `fn-knock Windows 管理程式` 或 System Tray 的「檢查更新」安裝 Windows 更新；Web UI 的 `關於 / 更新` 只顯示版本與說明。升級前請匯出備份；若啟動失敗，安裝程式會還原前一版程式與資料。

解除安裝 Windows 程式後，`%ProgramData%\FnKnock` 會保留供日後還原，其中包含 SQLite、憑證及設定。確認不再需要復原後，才以系統管理員權限另外刪除該目錄。

### 更新後的功能入口與舊文件不一致

先確認目前部署方式具備的能力：

| 能力 | 飛牛 fnOS FPK | Docker | OpenWrt | Linux 服務 | Synology DSM 7 SPK | Windows x86_64 |
| --- | --- | --- | --- | --- | --- | --- |
| Host 防火牆與直連授權 | 支援 | 不支援 | 支援 | 不支援 | 不支援 | 不支援 |
| 自動 HTTPS | 支援 | 不支援 | 不支援 | 支援；需要 `80` 連接埠與 Inbound Path | 不支援 | 支援；仍須打通防火牆、NAT 與 Inbound Path |
| ACME DNS-01 | 支援 | 支援 | 支援 | 支援 | 支援 | 支援；內建 Client，固定使用 Let's Encrypt |
| 智慧連線 | 支援 | 不支援 | 支援；依賴現有 `dnsmasq` 及已納入的設定 | 不支援 | 不支援 | 不支援 |
| SSH 安全性 | 支援 | 不支援 | 不支援 | 不支援 | 不支援 | 不支援 |
| Web 終端機 | 支援 | 不支援 | 不支援 | 支援；依賴 `tmux` | 不支援 | 不支援 |
| 內建 FRP / Cloudflared | 支援 | 支援 | 支援 | 支援 | 支援 | 不支援 |
| 安裝更新 | 透過 Web UI 更新 | Pull 新 Image | 安裝 IPK / APK | `sudo knock update` | DSM 套件中心 / SPK | 由 Windows 管理程式處理 |

部署限制與建議入口請參考[選擇部署與存取方案](/zh-tw/quick-start/deployment-options)。
