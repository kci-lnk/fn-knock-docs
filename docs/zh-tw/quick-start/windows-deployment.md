---
lang: zh-TW
title: "Windows 部署（x86_64）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: d5c6f6c5ebe2b4db1d7e8a3862b2d8d4cc4339c9e029f3861fb0d874d536dae1
---

# Windows 部署（x86_64）

Windows 版本會透過原生安裝程式安裝為系統服務，並提供 `fn-knock Windows 管理程式`與系統匣入口。此版本只支援 64 位元 x86_64 Windows，安裝時需要系統管理員權限。

管理後台永遠只在本機 Loopback 位址提供；閘道 `7999` 則預設監聽所有 IPv4 與 IPv6 介面。因此，Windows 可作為公網直連或自管 Tunnel 的閘道，但能否真正從外部連線，仍取決於 Windows 防火牆設定、路由器或 NAT、ISP 入站限制及其他安全性軟體。Windows 不提供直連授權，也不內建 FRP 或 Cloudflared。

## 原生開發，服務獨立執行

Windows 版本採用原生開發，不依賴 WebView 或 WebView2，也不會在桌面程式中常駐一套瀏覽器核心。閘道、身分驗證與管理後端等主要業務，會由 `FnKnock` Windows Service 在背景執行，桌面管理程式不需要保持常駐。

桌面捷徑開啟的只是一個輕量管理程式，用於查看服務狀態、修改連接埠、開啟管理後台、清除管理密碼與安裝更新，執行時僅占用約 `2 MB`。需要設定 fn-knock 時，管理程式會呼叫系統預設瀏覽器開啟本機管理後台，而不是在程式內嵌網頁。

完成設定後，可隨時結束管理程式。即使從系統匣完全結束，`FnKnock` Service 仍會在背景繼續執行，既有的身分驗證、映射與閘道存取都不受影響。只有主動停止 `FnKnock` Service 或解除安裝 fn-knock，才會中斷業務。

## 安裝前確認

- 系統為 64 位元 Windows，且目前帳號可透過 UAC 取得更高權限。
- 預設的 `7991`、`7998`、`7997`、`7996`、`7999` 未被其他程式占用；安裝後可透過管理程式修改。
- 管理後台僅供安裝程式的本機使用，請勿規劃從區域網路、VPN 或反向代理存取。
- 若計畫從區域網路或公網存取閘道，請先確認 Windows Network Profile、防火牆、路由器或 NAT，以及 ISP 入站原則；請勿暴露管理連接埠。

## 下載 Windows 安裝程式

前往 [fn-knock Windows 下載頁面](https://www.fnknock.cn/windows)，下載官方網站提供的 Windows 安裝程式。

請勿從聊天群組、網路硬碟或第三方下載站取得安裝程式，也不要使用 fnOS FPK、Linux 或 OpenWrt 安裝套件。後續版本更新同樣應以官方網站及 Windows 管理程式顯示的官方管道為準。

## 安裝與首次進入

1. 按兩下從官方網站下載的 Windows 安裝程式，在 UAC 提示中確認系統管理員權限並完成安裝。
2. 安裝完成後啟動 Windows 管理程式，或從「開始」功能表啟動。
3. 在管理程式中確認服務狀態為就緒，按一下「開啟管理後台」。預設會開啟：

   ```text
   http://127.0.0.1:7991/
   ```

4. 依頁面提示設定管理面板密碼，再設定身分驗證、映射與憑證。

管理面板密碼只保護本機管理入口，與訪客透過閘道使用的 TOTP、帳號密碼或 Passkey 不同。

## 預設連接埠與監聽範圍

| 連接埠 | 新安裝時的監聽範圍 | 用途 |
| --- | --- | --- |
| `7991` | 本機 Loopback（IPv4 / IPv6） | 管理面板 |
| `7998` | 本機 Loopback（IPv4 / IPv6） | Rust 管理後端 |
| `7997` | 本機 Loopback（IPv4 / IPv6） | 身分驗證服務 |
| `7996` | 本機 Loopback（IPv4 / IPv6） | Go 閘道內部 gRPC |
| `7999` | 所有 IPv4 / IPv6 介面（`0.0.0.0`、`::`） | 閘道入口 |

可在 `fn-knock Windows 管理程式`中修改這五個連接埠；儲存後 Service 會重新啟動並檢查新連接埠是否就緒，若失敗則還原原設定。五個連接埠不得重複，`7998`、`7997` 與 `7996` 不是對外入口。

管理後台永遠只接受本機 Loopback 存取，`7998`、`7997` 與 `7996` 也不是對外入口。閘道沒有獨立的監聽範圍開關；舊版本保留的 `loopback` 設定，會在 Service 啟動時自動遷移成目前的所有介面監聽。請勿直接編輯 `%ProgramData%\FnKnock\config\runtime.json`。

安裝程式會建立名為 `FnKnock Gateway` 的入站程式規則，預設只涵蓋 Windows 的「網域」與「私人」Network Profile，不涵蓋「公用」網路。這是一條依閘道程式比對的靜態規則，並不是依登入狀態動態開關連接埠的防火牆功能。若要從公網存取，仍需逐段確認：Windows 防火牆或第三方安全性軟體、路由器／NAT Port Forwarding、IPv6 防火牆，以及 ISP 入站原則。

如果由同一台 Windows 主機上的獨立 Tunnel 或反向代理提供外部入口，仍建議回源至 `127.0.0.1:7999`，以減少本機橫向曝露；該 Process 不受 fn-knock 管理，且必須保留原始 Host 與真實 Client IP。Windows 版本沒有 `系統設定 → FRP` 或 `系統設定 → Cloudflared` 的內建資源與 Process 管理。

## 日常管理、更新與資料

關閉管理程式視窗只會將其縮至系統匣；即使從系統匣選單完全結束管理程式，也不會停止 `FnKnock` Service 或影響閘道業務。系統匣選單與主視窗可用於開啟管理後台、啟動／停止／重新啟動服務、修改連接埠、清除管理密碼及檢查更新。

更新應在 `fn-knock Windows 管理程式`中執行「檢查更新」。管理程式會從官方管道下載安裝程式、核對檔案大小與 SHA-256，再啟動安裝；網頁中的 `關於／更新` 只會顯示版本與 Release Notes。安裝程式升級期間會短暫停止 Service，若新版本無法就緒，則還原原有程式與資料。更新前仍應先匯出應用程式備份。

| 位置 | 內容 |
| --- | --- |
| `%ProgramFiles%` 下的應用程式目錄 | 管理程式、Service 與閘道程式 |
| `%ProgramData%\FnKnock` | 設定、SQLite、憑證、WAF、記錄、狀態與 Rollback 資料 |

解除安裝會移除 Service、程式檔案與相關規則，但會保留 `%ProgramData%\FnKnock`，以便重新安裝或還原。此目錄含有敏感資料；確認不再需要還原後，再以系統管理員權限另行清除。

應同時規劃應用程式 `.knock` 封存檔與 `%ProgramData%\FnKnock` 目錄備份：前者方便移轉設定，後者保留 SQLite、憑證與 Windows 執行資料。匯入版本範圍、敏感資料邊界與驗收流程請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

## Windows 版本的功能限制

| 功能 | 狀態 |
| --- | --- |
| 子網域或路徑映射設定 | 可從本機管理後台設定 |
| 閘道外部入口 | `7999` 預設監聽所有介面；入站路徑由靜態 Windows 規則、網路與路由設定共同決定 |
| 直連授權、主機防火牆管理 | 不支援；不會依登入狀態動態寫入防火牆規則 |
| 智慧連線、Web Terminal、SSH 安全性 | 不支援 |
| 內建 FRP、Cloudflared | 不支援；可自行管理同一台主機上的外部 Process |
| ACME 憑證 | 支援內建 DNS-01；詳情請參閱[憑證與 HTTPS](/zh-tw/guide/ssl) |
| 更新安裝 | 由 Windows 管理程式處理 |

若忘記管理面板密碼，請優先使用管理程式中的「清除管理密碼」。若無法開啟管理程式，可在系統管理員 PowerShell 中執行：

請在應用程式安裝目錄中，以系統管理員 PowerShell 執行：

```powershell
.\fn-knock-service.exe reset-panel-password
```

此操作會清除面板密碼、面板工作階段與登入退避狀態，不會刪除映射、憑證或其他閘道資料。

繼續閱讀：

- [連接埠與入口](/zh-tw/quick-start/ports-and-entrypoints)
- [憑證與 HTTPS](/zh-tw/guide/ssl)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
