---
lang: zh-TW
title: "IPv6 公網直連與原始連接埠授權"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e94a3094af107a34487e1adfa1b17fbf62a7a905aa6fda0941106dfc65098208
---

# IPv6 公網直連與原始連接埠授權

直連模式讓訪客先透過閘道登入，再依 IP 允許清單存取 fnOS 或其他原始連接埠。此模式適合確實需要原始連接埠的 IPv6 環境，並不是發布 Web 服務的首選方案。

此模式需要 fn-knock 管理主機防火牆，因此只適用於 fnOS 標準 FPK。Knock Lite、Docker、OpenWrt、一般 Linux、Synology DSM 7 SPK 與 Windows 均不支援直連模式。

## 前置需求

- 裝置擁有可從公網路由的 IPv6 位址；
- 路由器與主機防火牆允許閘道入口的 IPv6 流量；
- 已備妥 AAAA Record，或可透過 DDNS 更新 AAAA；
- 有一部不在同一個區域網路中的 IPv6 Client 可供驗證；
- 已備妥至少一組登入救援憑證。

請先分別從裝置與外部網路確認 Address Family。裝置取得 `fe80::/10` Link-local Address 或 ULA Private Address，不代表擁有公網 IPv6；AAAA 必須指向裝置目前可路由的 Global Address。家用寬頻即使不需要設定 IPv4 NAT Port Forwarding，路由器的 IPv6 入站防火牆仍可能預設拒絕連線。

切換模式前，請先記錄以下救援資訊：

- fn-knock 管理入口與區域網路位址；
- 目前的防火牆設定備份；
- 閘道入口與預計保護的原始連接埠；
- 從區域網路或裝置主控台還原規則的方法。

## 設定步驟

1. 在 `DDNS 管理` 中選擇 `只更新 IPv6`。位址來源可使用自動選取，也可固定至實際的公網介面；Docker 無法使用本教學的直連模式。
2. 等待同步後，從外部 DNS 查詢 AAAA，確認回傳裝置目前的 Global IPv6，而不是舊 Prefix、Temporary Address 或另一部裝置。
3. 在路由器的 IPv6 防火牆中，只允許閘道入口連線至 fn-knock。請勿預先大範圍放行準備保護的原始連接埠，否則會繞過動態授權。
4. 在 `系統設定 → 模式` 中選擇 `直連模式（不建議）`。閱讀確認提示；儲存後，系統會依模式同步防火牆規則。
5. 在 `驗證設定` 中建立 TOTP 或帳號密碼，並於 `系統設定 → 工作階段` 將登入後 IP 授權設為跟隨工作階段，或設定所需的固定時段。
6. 為閘道網域名稱設定 HTTPS 憑證。憑證必須涵蓋實際存取的 Host；自動 HTTPS 的申請與部署條件請參閱[憑證與 HTTPS](/zh-tw/guide/ssl)。
7. 從外部網路開啟閘道入口，例如 `https://auth.example.com:<閘道連接埠>`，並完成登入。
8. 接著存取所需的原始服務連接埠；確認目前的公網 IPv6 已在 IP 授權清單中生效。

限制服務範圍的 TOTP、密碼帳號、Passkey、OIDC 或 LDAP 憑證不會建立自動 IP 授權，避免憑證透過來源位址擴大權限。若要讓直連模式自動開放原始連接埠，請使用未限制服務範圍的憑證，或手動加入所需的 IPv6 / CIDR。

## 防火牆驗證順序

每個步驟都請建立新連線，不要沿用已建立的 SSH、瀏覽器或 App 連線：

1. 未登入時，閘道入口應可連線，受保護的原始連接埠則應拒絕連線或逾時。
2. 登入後，從同一個外部網路連線至原始連接埠，應進入上游服務本身的身分驗證。
3. 在 `IP 允許清單` 或工作階段詳細資料中確認記錄類型、IPv6 與到期時間。
4. 登出或等待授權到期，再次建立新連線，原始連接埠應重新遭到拒絕。
5. 換一條外部網路測試，未授權的新 IPv6 不應繼承舊網路的放行。

## IP 變動時

在直連模式下，後續存取原始連接埠的連線不會再經過閘道。IPv6 Prefix 或 Client 對外位址變更後，應重新開啟閘道入口完成身分驗證，等待自動 IP 授權同步，再重試原始服務連接埠。

Client 可能會使用 Privacy Extension Temporary Address，行動網路也可能更換 Prefix。請勿為了減少重新登入次數而放行過大的 IPv6 網段；手動設定 CIDR 會授權整個範圍。

## 驗證與疑難排解

- 請從行動網路或另一條 IPv6 網路測試；家用 Wi-Fi 可能套用本機例外。
- AAAA 解析正確但無法連線：檢查路由器 IPv6 防火牆、ISP 入站原則與主機防火牆。
- 可以登入但原始連接埠不通：檢查 IP 允許清單記錄、模式同步狀態，以及服務是否監聽 IPv6。
- 登入後未產生授權：檢查工作階段的 IP 授權原則，以及憑證是否限制了服務範圍。
- 位址偶爾指向無法連線的主機：檢查 DDNS 選取的介面、Temporary IPv6 Address 與 Prefix 變動。
- 未登入時也能存取原始連接埠：請立即檢查路由器、Cloud Security Group 與手動防火牆規則，確認沒有繞過 fn-knock 的放行。

需要回復原設定時，請從區域網路或主控台將執行模式切回原方案、還原備份的防火牆規則，並刪除不再使用的 AAAA Record。先恢復管理能力，再清除暫時授權記錄。

- [IP 允許清單](/zh-tw/guide/whitelist)
- [DDNS 管理](/zh-tw/guide/ddns)
- [選擇存取方案](/zh-tw/quick-start/run-modes)
- [原始連接埠存取：直連授權](/zh-tw/quick-start/direct-mode)
