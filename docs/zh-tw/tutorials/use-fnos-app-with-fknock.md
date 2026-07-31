---
lang: zh-TW
title: "透過 fn-knock 使用 fnOS App"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 23c60dd4f0d78a94fb1ac36ba078dc26b9894c43a465a0c27a0a6ba3a0b1813d
---

# 透過 fn-knock 使用 fnOS App

fnOS App 最終連線的位址，必須符合 fn-knock 採用的發布方案。App 能否直接處理網頁身分驗證 Redirect、Cookie 與 Passkey，取決於 Client 版本及其網路實作；手機瀏覽器中的工作階段不一定會自動與原生 App 共用。設定完成後，應以 App 中實際的登入、檔案與影音操作進行驗證，不能只確認瀏覽器可以開啟。

共有兩種鏈路：

| 方案 | App 填入位址 | fn-knock 的作用 |
| --- | --- | --- |
| 子網域閘道或 Tunnel 子網域 | fnOS 業務 Host，例如 `https://nas.example.com` | 每個 App 請求都通過 Host 路由與存取原則 |
| 直連授權 | fnOS 的原始公網位址與連接埠 | 先從瀏覽器登入，再由 fn-knock 依來源 IP 暫時開放原始連接埠 |

## 子網域閘道或 Tunnel 子網域映射

請為 fnOS 建立一個業務 Host，例如 `nas.example.com`，並將 Target 指向 fnOS 服務的內部網路位址；身分驗證 Host 與 fnOS Host 都應進入同一個閘道。

1. 在手機瀏覽器開啟 fnOS Host，確認未登入時會進入身分驗證 Host，並完成登入。
2. 在 App 中填入 `https://nas.example.com`，或包含實際對外連接埠的完整位址。
3. 在 App 中完成 fnOS 帳號本身的登入，並測試目錄、上傳、下載、影音與長連線。
4. 在 fn-knock 請求記錄中，確認 App 請求的 Host、Client IP、身分驗證結果與上游 Target。

如果 App 不會沿用瀏覽器 Cookie，開啟「要求登入」的 Host 可能會反覆回傳網頁身分驗證 Redirect。請勿因此直接將業務 Host 改成公開。應先確認 App 是否支援系統瀏覽器驗證或 Cookie Persistence；若確實無法相容，請使用受控的直連授權方案，或只在網路層對 VPN／固定可信任來源開放。

使用子網域方案時，請勿在 App 中填入未經過閘道的 `5666` 等原始公網連接埠，否則會繞過身分驗證、工作階段與來源 IP 判斷。

## 直連模式

直連模式會透過閘道入口完成身分驗證，再允許目前的公網 IP 存取原始連接埠。此模式只適用於 fnOS 標準 FPK；Knock Lite、Docker、OpenWrt、一般 Linux、Synology DSM 7 SPK 與 Windows 都不提供這種動態連接埠授權。

1. 在 `系統設定 → 模式` 選擇 `直連模式（不建議）`，並保留本機救援入口。
2. 在 `系統設定 → 工作階段` 中，將登入後 IP 授權設為跟隨工作階段或所需時段。
3. 在手機瀏覽器存取閘道入口並完成登入。
4. 確認目前行動網路的對外 IP 已出現在 IP 授權清單中。
5. 在 App 中填入 fnOS 服務的原始公網位址與連接埠，並測試實際功能。

網路切換導致公網 IP 變更後，App 的原始連接埠連線無法自行重新整理授權。請再次從瀏覽器開啟閘道入口，再返回 App 測試。

限制服務範圍的登入憑證不會產生自動 IP 授權。需要直連時，請使用未限制範圍的憑證，或由管理員手動加入目前來源；不要為行動網路填入過大的 CIDR。

## 疑難排解

| 現象 | 檢查項目 |
| --- | --- |
| App 無法連線 | App 位址是否對應實際發布的 Host、DNS／憑證，以及 Tunnel 或公網入口 |
| 瀏覽器可以開啟，但 App 不行 | App 是否共用瀏覽器 Cookie、能否處理身分驗證 Redirect、HTTPS 憑證支援與位址格式 |
| App 反覆要求登入 | 查看請求記錄中的身分驗證狀態；確認 App 是否保留 Cookie，且不要快取身分驗證回應 |
| 切換網路後失效 | 查看工作階段、Client IP 與直連模式的 IP 允許清單；必要時重新登入 |
| 頁面異常或反覆登入 | Cookie Domain、身分驗證 Host、真實 Client IP 與上游 Proxy Cache |
| 直連登入後連接埠仍無法連線 | IP 授權原則、憑證服務範圍、目前的對外 IP、fnOS 服務監聽與防火牆同步 |

使用行動網路測試時請關閉 Wi-Fi，並在切換網路後建立新的 App 連線。測試完成後，檢查是否仍留有不再需要的自動或手動 IP 授權。

- [工作階段、IP 授權與 IP 漂移](/zh-tw/guide/session-management)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [原始連接埠存取：直連授權](/zh-tw/quick-start/direct-mode)
