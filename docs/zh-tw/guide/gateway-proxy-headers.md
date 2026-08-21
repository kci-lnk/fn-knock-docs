---
lang: zh-TW
title: "入站 PROXY Protocol 與上游代理標頭"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 84149bddf09f75e1eda90eb3fbce8aead310d88afeb751741c8ce841d0db9a69
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 入站 PROXY Protocol 與上游代理標頭

閘道會處理兩個方向相反的代理資訊：前置負載平衡器可用 PROXY Protocol 告知 fn-knock 真實連線位址，fn-knock 則可用 `X-Forwarded-*` 等標頭把訪問資訊傳給應用上游。兩者的信任邊界與設定分開。

## 接收入站 PROXY Protocol

使用 HAProxy、Nginx stream 或其他四層負載平衡器時，可在 `系統設定 → 閘道 → PROXY Protocol` 啟用 v1 / v2，並填入可傳送該協定的代理 IP 或 CIDR。這裡填的是 TCP 對端代理節點，不是訪客 IP。

啟用後至少需要一個可信來源。只接受 IP 或 CIDR，拒絕網域名稱以及涵蓋全部 IPv4 或 IPv6 的網段。只有列出的 socket 對端可提交 PROXY 標頭；其他來源仍可一般連線，但偽造的 `X-Forwarded-For` 或 `X-Real-IP` 不能覆蓋 PROXY 位址。

PROXY Protocol 本身沒有驗證。不要複製客戶端允許清單或信任寬泛公網，應使用固定內網代理位址並加上網路層限制。託管 FRP 會自動啟用所需設定，不必把 FRP 訪客位址加入清單。

儲存時會以交易方式驗證並套用閘道設定。修改後從外部鏈路送出請求，在請求記錄核對 socket 對端與客戶端 IP。

## 向上游傳遞 HTTP 代理標頭

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
