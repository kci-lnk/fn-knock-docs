---
lang: zh-TW
title: "選擇部署與存取方案"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 864d6c653b9a318f10adffa3005157d2a80b7718d3631dfff494c19b2e608c48
---

# 選擇部署與存取方案

部署 fn-knock 時，需要依序決定三件事：程式要在哪裡執行、外部流量如何抵達閘道，以及閘道要如何將請求轉送給目標服務。最後再由存取原則決定哪些請求可以通過。

fn-knock 用於收斂入口並提供前置身分驗證，不能取代系統更新、備份、最小權限原則，以及上游服務本身的安全性設定。

## 選擇部署方式

| 部署方式 | 管理入口 | 預設閘道入口 | 適用情境 | 主要限制 |
| --- | --- | --- | --- | --- |
| fnOS 原生 FPK | fnOS 桌面的「敲門 knock」圖示（本機 CGI 轉送至後端 `7998`） | `7999` | fnOS 主機，且希望使用完整的主機功能 | `7998` 是管理後端，不是對外或瀏覽器管理入口 |
| Docker Compose | `7991` | `7999` | NAS、Home Server 或一般 Docker 主機 | 不支援直連模式、主機防火牆管理、自動 HTTPS、SSH 安全性、智慧連線與 Web Terminal |
| OpenWrt 軟體套件 | `服務 → 敲門 Knock`；預設連接埠為 `7991` | `7999` | 主路由器、軟路由或旁路由 | 不支援自動 HTTPS、SSH 安全性、Web Terminal 與應用程式內 FPK 更新；智慧連線仰賴既有 `dnsmasq` 設定 |
| [Linux（systemd / OpenRC）](/zh-tw/quick-start/linux-deployment) | `7991` | `7999` | 一般 Linux Server、VPS 或自管主機 | 需要 root 權限及正在執行的 systemd 或 OpenRC；主機防火牆由管理員自行維護 |
| [Synology DSM 7 x86_64 / ARM SPK](/zh-tw/quick-start/synology-deployment) | DSM 桌面上的套件入口 | `7999` | 搭載 Intel / AMD / ARM 處理器的 DSM 7 NAS | 不支援直連、主機防火牆管理、智慧連線、Web Terminal 與 SSH 安全性；透過套件中心升級 |
| [Windows x86_64](/zh-tw/quick-start/windows-deployment) | 管理程式開啟本機 `127.0.0.1:7991` | `7999`，預設監聽所有介面 | 需要 Windows Service 與本機系統匣管理程式 | 仍須設定防火牆與 NAT；不支援直連授權、內建 FRP / Cloudflared、智慧連線、Web Terminal 與 SSH 安全性 |

Docker、OpenWrt、Linux 與 Windows 的管理入口需要另行設定面板密碼。這組密碼只保護管理面板，與閘道入口使用的 TOTP、帳號密碼或 Passkey 並不是同一套憑證。

安裝說明：

- fnOS 原生應用程式：[安裝與初始設定](/zh-tw/quick-start/install-and-first-login)
- Docker：[Docker 部署](/zh-tw/quick-start/docker-deployment)
- OpenWrt：[OpenWrt 部署](/zh-tw/quick-start/openwrt-deployment)
- Linux：[Linux 部署（systemd / OpenRC）](/zh-tw/quick-start/linux-deployment)
- Synology：[Synology DSM 7 部署](/zh-tw/quick-start/synology-deployment)
- Windows：[Windows x86_64 部署](/zh-tw/quick-start/windows-deployment)

### 安裝套件來源與驗證

建議先從 [fn-knock 官方網站](https://www.fnknock.cn/)進入對應平台的下載頁面。正式版本會同時提供以下驗證資訊：

- [`release-manifest.json`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/release-manifest.json)：記錄版本、專案原始碼 Commit、Go 閘道 Commit、平台、架構、檔案大小與 SHA-256。
- [`SHA256SUMS`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/SHA256SUMS)：用於驗證 GitHub Release 中的安裝套件。
- Docker Multi-Arch Image 的 SBOM 與建置來源證明（Provenance）。

離線下載或轉存安裝套件後，應在安裝前重新計算 SHA-256，並與正式發布清單比對。雜湊值只能證明檔案與發布清單一致，仍需確認所選平台與 CPU 架構正確。

建議依以下順序驗證：

1. 從官方網站進入對應的 GitHub Release，不要使用聊天群組、網路硬碟或搜尋結果中的同名檔案。
2. 在 `release-manifest.json` 中找到完全相同的檔名，並核對發布版本、平台、架構與檔案大小。
3. 計算本機檔案的 SHA-256：

   ```bash
   # Linux、OpenWrt 或其他提供 sha256sum 的系統
   sha256sum <安裝套件檔名>

   # macOS
   shasum -a 256 <安裝套件檔名>
   ```

   Windows PowerShell 請使用：

   ```powershell
   (Get-FileHash -LiteralPath '<安裝套件檔名>' -Algorithm SHA256).Hash
   ```

4. 將結果與 Manifest 中該檔案的 `sha256`，或 `SHA256SUMS` 中的同名項目逐字元比對；若不一致，請停止安裝並重新下載。
5. 需要稽核建置來源時，再確認安裝套件的 GitHub Build Provenance 來自官方儲存庫。Docker 還可同時核對 Manifest 中的 Multi-Arch Image Digest、SBOM 與 Provenance；固定版本部署可使用 Digest，避免 `latest` 日後指向不同內容。

`release-manifest.json` 也會記錄控制平面與 Go 閘道的原始碼 Commit，可用於將安裝套件追溯至兩部分原始碼。單獨取得一段 SHA-256 文字並不能證明發布者身分；Manifest、Checksum 檔與建置來源證明都必須來自官方 Release。

## 選擇網路拓撲

### 公網直連

網域名稱直接解析至家用網路的公網 IPv4 / IPv6，或由路由器將公網連接埠轉送至 fn-knock 閘道入口。

適用條件：

- 外部網路可以連線至家中入口
- 已備妥網域名稱
- 路由器、防火牆與 ISP 未封鎖所需連接埠

Web 服務請使用[公網直連：子網域路由](/zh-tw/quick-start/subdomain-mode)。只有在必須繼續存取原始連接埠時，才使用[原始連接埠：直連授權](/zh-tw/quick-start/direct-mode)。

### FRP 或 Cloudflared Tunnel

外部請求會先進入 FRP Server 或 Cloudflare，再經由 Tunnel 回到 fn-knock 閘道入口。家用網路不需要具備可接受入站連線的公網 IP。

新部署的 Web 服務預設使用：

- 後台模式：`內網穿透`
- 路由方式：`子網域映射`

完整步驟請參閱[內網穿透：子網域路由](/zh-tw/quick-start/reverse-proxy-mode)。

### 以 EdgeOne 或 ESA 作為前置層

EdgeOne、ESA 等 Edge Platform 可在公網端接收標準 `80 / 443` 流量，再回源至 fn-knock。它們是公網直連拓撲前方的一層，不會改變 fn-knock 內部的 Host 路由與存取原則。

開始串接前，請先確認 fn-knock 的本機閘道、身分驗證子網域與業務子網域均能正常運作。

## 選擇路由方式

| 路由方式 | 外部位址範例 | 適用服務 | 說明 |
| --- | --- | --- | --- |
| Host 路由 | `https://nas.example.com` | Web 服務 | 建議方案；每項服務使用獨立子網域 |
| 路徑路由 | `https://example.com/photos` | 已支援 Subpath 的 Web 服務 | 相容舊設定；後台位於 `內網穿透 → 路徑模式`，此模式已標示為不建議使用 |
| TCP / UDP 轉送 | `example.com:3306` | SSH、資料庫、DNS 等非 Web Protocol | 透過「通訊協定映射」設定；目前只在後台的子網域模式中提供 |

Host 路由可同時用於公網直連及 FRP / Cloudflared。是否擁有公網 IP，已不再決定能否使用子網域。

路徑路由只應保留給以下情況：

- 既有路徑映射需要平順遷移
- 上游應用程式明確支援 Subpath
- 外部環境只能使用一個固定 Hostname

## 選擇存取原則

目前管理介面透過 Host 映射中的 `要求登入` 開關設定新服務：

| 原則 | 目前設定方式 | 通過條件 |
| --- | --- | --- |
| 公開存取 | 關閉目前優先登入映射的 `要求登入` | 不檢查 fn-knock 登入狀態與 IP 允許清單 |
| 要求登入 | 開啟 `要求登入` | 手動來源授權可獨立放行；自動 IP 授權通常可讓同一來源繼續存取，但不會覆蓋瀏覽器已帶有的服務範圍拒絕；沒有可用的來源授權時才檢查工作階段 |
| 子網域進階驗證 | 為已開啟 `要求登入` 的 HTTP / HTTPS Host 設定進階驗證規則 | 來源或請求特徵符合規則時，簽發僅限目前 Host 的暫時憑證；未符合時則繼續一般登入流程 |
| 嚴格允許清單 | 只可能存在於舊版映射，目前介面沒有建立入口 | 即使關閉 `要求登入` 也不一定公開；只依有效的來源授權記錄判斷（手動加入或登入後自動建立），工作階段 Cookie 本身不能取代來源條件 |

新建業務映射通常應開啟 `要求登入`。身分驗證服務本身必須保持公開，否則未登入的訪客無法進入登入頁面。若升級後遇到舊版的嚴格允許清單規則，請同時檢查手動與自動 IP 授權記錄；若要停用該規則，請先完整記下映射設定，再透過目前介面重新建立，單獨關閉 `要求登入` 並不足以將其公開。若嚴格規則只允許手動來源，請關閉登入後自動 IP 授權，並清除遺留的自動記錄。

登入憑證也可以限制允許存取的子網域。子網域進階驗證是獨立的 Host 放行路徑，不是用來為登入憑證增加限制；設定前請先閱讀[子網域進階驗證](/zh-tw/guide/advanced-auth)。上游 Basic Auth 憑證注入只用於 fn-knock 連線至目標服務，並不是訪客登入 fn-knock 的方式。

## 依需求前往設定

| 條件 | 選擇 |
| --- | --- |
| 具備公網入口與網域名稱，主要存取 Web 服務 | [公網直連：子網域路由](/zh-tw/quick-start/subdomain-mode) |
| 沒有公網 IP，使用 FRP 或 Cloudflared | [內網穿透：子網域路由](/zh-tw/quick-start/reverse-proxy-mode) |
| 已有路徑映射，暫時無法遷移 | [內網穿透頁面中的路徑相容方案](/zh-tw/quick-start/reverse-proxy-mode#路徑模式僅用於相容) |
| 必須在 Web 登入後存取 `5666`、`22` 等原始連接埠 | [原始連接埠：直連授權](/zh-tw/quick-start/direct-mode) |
| 尚未安裝，或無法區分管理入口與閘道入口 | [安裝與初始設定](/zh-tw/quick-start/install-and-first-login) |
| 在 Windows x86_64 本機部署與維護 | [Windows x86_64 部署](/zh-tw/quick-start/windows-deployment) |

只要部署方式提供外部閘道入口，就應使用行動網路等真正的外部鏈路完成最終驗證。區域網路與本機來源可能受到閘道信任，不能取代公網身分驗證測試。Windows 的 `7999` 雖預設監聽所有介面，仍需一併驗證 Windows Firewall Profile、路由器或 NAT、IPv6 防火牆，以及 ISP 的入站原則。
