---
lang: zh-TW
title: "向上游傳遞反向代理標頭"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9827693dded1cee8ddfdade27e9b43fb9fdd9b929f9327980103ed08f0dbf5eb
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 向上游傳遞反向代理標頭

透過 fn-knock 轉送請求時，上游服務可能需要知道原始通訊協定、對外 Host 或用戶端 IP。`系統設定 → 閘道 → 協議標頭` 可依服務 Host 控制閘道是否向上游傳送 `X-Forwarded-*` 等反向代理標頭。此選項只可在採用 Host 路由的子網域模式中編輯，包括公網直達的 `子網域模式` 與 `內網穿透 → 子網域映射`；路徑模式和直連模式不提供此功能。

啟用後，上游應用程式可依這些標頭產生正確的外部連結、判斷 HTTPS、記錄用戶端 IP，或設定自身的 Trusted Proxy。停用後，應用程式通常只會看到 fn-knock 與上游之間的連線資訊。

介面會依 Host 顯示，但 Runtime 是依上游 Target 套用。多個 Host 共用同一個 Target 時，停用其中一個 Host 的協議標頭，也會影響其他共用該 Target 的 Host；若需要不同原則，請替它們使用不同 Target。

## 上游也需要正確設定

傳送反向代理標頭只是在提供資訊，不會讓上游自動採用。還需要在應用程式或其前置 Web Server 中：

1. 將 fn-knock 的連線 IP 或所在網段設為 Trusted Proxy。
2. 指定實際使用的協議標頭名稱。
3. 檢查外部 URL、HTTPS 判斷與 Access Log 中的用戶端 IP。

若上游信任所有來源提供的 `X-Forwarded-For`，攻擊者繞過 fn-knock 直接連上上游時，就能偽造 IP。應同時限縮上游的 Listen 範圍，或透過防火牆只允許 fn-knock 存取。

## 使用原則

- 只有在上游應用程式確實需要，且能正確處理這些標頭時才啟用。
- 上游應用程式應只信任來自 fn-knock 的反向代理標頭；不要讓它接受任意用戶端偽造的 `X-Forwarded-For`。
- CDN、FRP 或 Tunnel 位於 fn-knock 前方時，前置連線路徑必須移除或改寫外部用戶端可偽造的真實 IP 標頭；接著從請求記錄確認 fn-knock 識別到的用戶端 IP。
- 修改後，請透過請求記錄與上游 Access Log 比對 Host、通訊協定與用戶端 IP。

此設定只會影響 **fn-knock 傳送給上游** 的標頭，不會決定 fn-knock 如何識別 Inbound 用戶端 IP，也不能充當 Trusted Proxy 清單。Inbound 來源識別仰賴前置連線路徑正確處理真實 IP 標頭；部署後務必在請求記錄中核對。

- [向上游保留 Host](/zh-tw/guide/gateway-host-response)
- [安全邊界與基準設定](/zh-tw/guide/security)
- [請求記錄](/zh-tw/guide/request-logs)
