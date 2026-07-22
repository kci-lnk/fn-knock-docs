---
lang: zh-TW
title: "轉送至上游時保留 Host 標頭"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2ca12f8a45486d4679a747a99818ce4460a68848c7135d050ccafb04cb6c11e4
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 轉送至上游時保留 Host 標頭

反向 Proxy 預設會將訪客請求中的 `Host` 原樣傳給上游。例如存取 `https://nas.example.com` 時，上游仍會看到 `Host: nas.example.com`。應用程式可據此產生外部連結、設定 Cookie Domain、選擇 Virtual Host，或驗證 Callback URL。

`系統設定 → 閘道 → Host 回應` 只可在採用 Host 路由的子網域模式中編輯，包括公網直達的子網域模式與 `內網穿透 → 子網域映射`。路徑模式與直連模式不提供此選項，身分驗證服務 Host 也不會列入可編輯項目。

## 何時應停用

除非上游明確要求使用自己的位址作為 Host，否則應維持預設啟用。常見情況包括：

- 上游 Web Server 只設定了內部 Virtual Host Name；
- 應用程式會驗證 Host 允許清單，但暫時無法加入外部網域；
- 舊版應用程式收到外部 Host 後回傳 `400`、錯誤重新導向或錯誤站台。

停用後，閘道不再強制保留外部 Host，上游會依反向 Proxy 的 Target URL 處理 Host。這可能解決上游的 Host 驗證問題，也可能讓應用程式產生含有 `127.0.0.1`、Container Service Name 或內部網域的連結。修改後務必檢查登入重新導向、Absolute URL、Cookie 與 WebSocket。

## 依 Target 套用

頁面會依 Host 顯示開關，但閘道 Runtime 會依上游 Target 編譯。下列兩個 Host 共用同一個 Target：

```text
photos.example.com -> http://127.0.0.1:8080
files.example.com  -> http://127.0.0.1:8080
```

停用其中一個 Host 的保留行為，會影響整個共用 Target。若需要不同原則，請替兩個 Host 設定不同的 Target URL；即使最終連到同一個應用程式，也可以透過不同的 Listen Address、連接埠或反向 Proxy 層加以區分。

路徑回應中的反向 Proxy 動作，也會依其實際 Target 套用同一組 Runtime 規則。固定回應沒有上游，因此不涉及 Host 保留。

## 驗證與疑難排解

1. 修改後，等待頁面顯示已儲存並同步。
2. 從實際服務網域存取，檢查 Status Code、重新導向 URL 與登入流程。
3. 在請求記錄中確認命中的 Host、路由類型與上游 Target。
4. 從上游 Access Log 查看收到的 Host，確認符合應用程式預期。
5. 若多個 Host 同時出現變化，檢查它們是否共用了相同 Target。

Host 保留不會決定 fn-knock 如何識別用戶端 IP，也不會修改 TLS 憑證或 DNS。用戶端來源資訊透過 Proxy Header 傳遞，請參閱[向上游傳遞 Proxy Header](/zh-tw/guide/gateway-proxy-headers)。

- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [路徑回應](/zh-tw/guide/gateway-path-response)
- [請求記錄](/zh-tw/guide/request-logs)
