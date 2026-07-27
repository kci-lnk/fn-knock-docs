---
lang: zh-TW
title: "fnOS 應用程式商店 Lite 與官網標準 FPK"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c372dfbf4ec440e9b6dce702cab355d78b91d76ec92a8e1736ce822006acbe6d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# fnOS 應用程式商店 Lite 與官網標準 FPK

`敲門 knock Lite` 是 fnOS 應用程式商店提供的原生套件。它不是 Docker 版，也不是限時試用版；Lite 與官網標準 FPK 具備相同的核心閘道和管理能力，但使用獨立的非 Root 套件帳號執行。

兩者的主要差異不是反向 Proxy、驗證或 WAF 能否使用，而是 fn-knock 能否直接修改 fnOS 主機。Lite 遵守非 Root 權限邊界，因此不提供防火牆、系統網路參數或特權連接埠監聽等主機能力；官網標準 FPK 以 Root 執行，可以完成這些系統層級的整合。

## 如何選擇

以下情況通常適合應用程式商店 Lite：

- 主要使用 Host 或路徑反向 Proxy；
- 需要 TOTP、帳號密碼、Passkey、OIDC 等驗證能力；
- 需要 DDNS、憑證、ACME DNS-01、WAF、Request Log 與監控；
- 使用內建 FRP 或 Cloudflared，不需要 fn-knock 修改主機防火牆；
- 希望套件維持非 Root 權限邊界。

明確需要以下任一能力時，應選擇官網標準 FPK：

- 登入後動態開放裝置原始連接埠的直連模式；
- fn-knock 自動維護主機防火牆；
- 智慧連線、SSH 安全、系統時間同步或 fnOS 網路最佳化；
- Web 終端機、fnOS SSL 憑證庫同步；
- FN Connect 流量接入 WAF；
- 應用程式內更新；
- 公網 `80 / 443` 可連線時使用標準連接埠直連與自動 HTTPS。

## 功能比較

| 能力 | 應用程式商店 Lite | 官網標準 FPK | 說明 |
| --- | --- | --- | --- |
| Host / 路徑反向 Proxy | 支援 | 支援 | 兩個版本都能透過閘道將請求轉送至內網 Web 服務 |
| 驗證與存取控制 | 支援 | 支援 | 包含 TOTP、帳號密碼、Passkey、OIDC、工作階段與服務範圍 |
| DDNS | 支援 | 支援 | 可維護公網 IPv4 / IPv6 對應的 DNS 記錄 |
| SSL 憑證與 ACME DNS-01 | 支援 | 支援 | Lite 可以申請、上傳、管理和使用 HTTPS 憑證 |
| WAF、Request Log 與監控 | 支援 | 支援 | Lite 仍保留核心 HTTP 防護與可觀測性 |
| 內建 FRP / Cloudflared | 支援 | 支援 | Tunnel 是對外連線，不依賴主機防火牆管理 |
| 直連模式 | 不支援 | 支援 | 直連模式需要依照登入來源動態修改主機防火牆 |
| 主機防火牆管理 | 不支援 | 支援 | Lite 不會自動寫入、重設或清除 fnOS 防火牆規則 |
| 智慧連線 | 不支援 | 支援 | 需要管理主機 `dnsmasq` 和區域網路 DNS 分流 |
| SSH 安全 | 不支援 | 支援 | SSH 登入偵測、來源封鎖和規則同步需要主機 Log 與防火牆權限 |
| 系統時間同步 | 不支援 | 支援 | Lite 不會修改 fnOS 主機時間 |
| 自動 HTTPS | 不支援 | 支援 | 指公網 `80 / 443` 可連線時的標準連接埠直連輔助能力，不代表 Lite 不支援 HTTPS |
| fnOS SSL 憑證庫同步 | 不支援 | 支援 | Lite 內的憑證不會自動寫入 fnOS 系統憑證記錄 |
| fnOS 網路最佳化 | 不支援 | 支援 | BBR、TCP MTU 探測等設定需要修改主機 `sysctl` |
| Web 終端機 | 不支援 | 支援 | Lite 不提供主機 Shell / tmux 工作階段 |
| FN Connect 流量接入 WAF | 不支援 | 支援 | 此入口需要主機網路與防火牆權限 |
| 應用程式內更新 | 不支援 | 支援 | Lite 透過應用程式商店或手動安裝新套件；標準 FPK 可從管理後台更新 |

## 自動 HTTPS 不等於 HTTPS 支援

表格中的「自動 HTTPS」是一項範圍很窄的主機功能，不是對整體 HTTPS 能力的判斷。

它主要用於下列公網直連條件：

1. ISP 沒有封鎖入站 TCP `80` 和 `443`；
2. 路由器、防火牆或 NAT 已將公網標準連接埠送到 fn-knock；
3. fn-knock 已設定涵蓋實際存取網域的有效憑證。

符合這些條件時，官網標準 FPK 可以使用主機權限監聽 `80` 連接埠，在閘道側將 HTTP Request 重新導向 HTTPS，並啟用已設定的憑證。此開關不會代為申請網域、解除 ISP 入站限制、建立路由器 Port Forwarding 或設定 CDN Origin。

Lite 無法直接綁定需要 Root 權限的主機 `80` 連接埠，因此沒有此開關，但不影響以下能力：

- 在 Lite 中申請、上傳和管理憑證；
- 使用 ACME DNS-01 申請與續期憑證；
- 讓 Lite 閘道在已設定的連接埠提供 HTTPS；
- 由路由器將公網 `443` 映射到 Lite 閘道連接埠；
- 由前置反向 Proxy、CDN、Edge Platform、FRP 或 Cloudflared 負責公網 HTTPS。

如果 ISP 封鎖 `80`，即使安裝官網標準 FPK，也無法依靠公網 `80` 完成自動重新導向；如果 `443` 也無法連線，就不能使用公網標準連接埠直連，必須改用其他連接埠、Tunnel 或 Edge Platform。使用 DNS-01 申請憑證時不依賴公網 `80`。

憑證與入口設定的完整邊界請參閱[TLS 憑證與 HTTPS](/zh-tw/guide/ssl)。

## 執行方式差異

| 比較項目 | 應用程式商店 Lite | 官網標準 FPK |
| --- | --- | --- |
| 執行帳號 | 獨立的非 Root 套件帳號 `fn-knock-lite` | Root |
| 預設連接埠 | `8998 / 8997 / 8996 / 8999` | `7998 / 7997 / 7996 / 7999` |
| 安裝精靈可用連接埠 | `1024`～`65535` | `1`～`65535` |
| 更新方式 | 應用程式商店或手動安裝新套件 | 支援從管理後台進行應用程式內更新 |
| 早期 Redis 資料移轉 | 不提供 | 支援從早期 Redis 版本移轉 |

連接埠範圍限制只表示 Lite 不能直接監聽低於 `1024` 的主機連接埠，不限制路由器將公網連接埠映射到 Lite 的高位閘道連接埠。

## 從 Lite 移轉到標準 FPK

兩個版本使用不同的預設連接埠，但仍不建議同時執行。請依照以下順序移轉：

1. 在 Lite 的維護頁面匯出 `.knock` 備份；
2. 停止或解除安裝 Lite，確認原連接埠已經釋放；
3. 依照裝置架構安裝官網標準 FPK；
4. 開啟標準 FPK 並匯入 `.knock`；
5. 重新檢查閘道連接埠、憑證、外部 Port Forwarding、Tunnel 和主機相關功能；
6. 分別從區域網路與行動網路驗證驗證 Host 和業務 Host。

`.knock` 用於移轉可還原的設定，不包含主機防火牆狀態、外部 DNS 記錄和上游應用程式資料。完整範圍請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。
