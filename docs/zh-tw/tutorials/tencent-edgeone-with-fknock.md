---
lang: zh-TW
title: "在 fn-knock 前端串接 Tencent Cloud EdgeOne"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 544d6e4ba7d0447b81b3e05ab57fac721e2bf08313b223018b36c1b2a1e1132d
---

# 在 fn-knock 前端串接 Tencent Cloud EdgeOne

EdgeOne 可作為 fn-knock 前方的 DNS、TLS 與 Edge Entry Point。串接後，身分驗證 Host 與業務 Host 仍應交由 fn-knock 處理；Edge Platform 不得將動態登入頁面快取成靜態內容，也不能遺失真實 Client IP。

## 串接前確認

- fn-knock 的子網域映射已透過本機或公網入口驗證通過；
- 每個要公開的 Host 都有明確的上游 Target 與存取原則；
- EdgeOne 至來源站的回源位址、連接埠與 Protocol 均可連線；
- 已準備可透過行動網路存取的測試網域名稱。

## 設定重點

1. 在 `子網域映射 → 子網域模式設定 → Edge Network 真實 IP 辨識` 中選擇 `Tencent EdgeOne`。閘道會讀取 `EO-Connecting-IP`，將辨識到的位址作為 Client IP，並透過 `X-Forwarded-For` 傳給身分驗證服務。
2. 在 EdgeOne 新增網域名稱，並為身分驗證 Host 與業務 Host 設定回源至 fn-knock 閘道入口。
3. 確保請求 Host、WebSocket Upgrade 與 EdgeOne 真實 Client IP Header 都能傳到來源站。
4. 為身分驗證、Callback 與動態業務路徑設定 Bypass Cache；Cache Policy 應依應用程式逐項決定，不要一律快取登入頁面。
5. 在 EdgeOne 設定 HTTPS 後，從公網依序測試身分驗證 Host、業務 Host，以及 WebSocket／長連線應用程式。

## 回源設定

身分驗證 Host 與業務 Host 可共用一組來源站位址及連接埠，但回源請求必須保留訪客使用的 Host，fn-knock 才能命中對應映射。回源目標是閘道入口，預設為 `7999`，不是管理入口 `7991`，也不是內部後端 `7998`。

請依 TLS 終止位置選擇回源 Protocol：

| 外部 TLS | EdgeOne 至 fn-knock | fn-knock 端需求 |
| --- | --- | --- |
| EdgeOne 終止 HTTPS，使用 HTTP 回源 | HTTP | 來源站連接埠可連線；前置層必須正確傳達外部 Protocol |
| EdgeOne 終止 HTTPS，使用 HTTPS 回源 | HTTPS | fn-knock 憑證涵蓋回源 Host，且憑證鏈受到 EdgeOne 信任 |
| End-to-end HTTPS | HTTPS | 同時驗證 Edge Certificate 與 Origin Certificate |

身分驗證頁面、驗證 API、OIDC／QQ Callback、登出、工作階段狀態，以及設定 Cookie 的回應，都應略過 Cache。業務應用程式是否適合快取，應依其 Response Header 與登入機制決定；不能只根據副檔名假設請求是靜態內容。

## 保護真實 IP Header

選擇 EdgeOne Provider 後，閘道會信任 `EO-Connecting-IP` 的語意。如果來源站連接埠仍允許任意公網 Client 直接連線，攻擊者可能繞過 EdgeOne 並自行偽造此 Request Header。應使用防火牆、Origin Access Control 或無法從公網路由的回源鏈路，讓閘道入口只接受 EdgeOne 回源與必要的維運探測。

切換前可暫時保留一個只有管理員能使用的直連測試 Host，但不要讓它與正式業務共用過度寬鬆的公網放行規則。驗證完成後，請移除 Fallback DNS 或限制其來源。

## 驗證重點

請分別使用行動網路與另一條外部連線存取，避免只測試同一個對外 IP：

1. 開啟身分驗證 Host，確認未登入時可看到驗證頁面。
2. 登入後存取業務 Host，確認返回原 Target 且不會循環重新導向。
3. 開啟 `請求記錄`，確認 `Client IP` 是訪客位址、`連線來源 IP` 可以是 EdgeOne 節點位址，且可看到 `EO-Connecting-IP`。
4. 確認 Host、身分驗證結果、上游 Target 與回應狀態符合目前請求。
5. 測試 WebSocket、檔案上傳下載與登出；登出後重新存取需要登入的 Host。
6. 從不經過 EdgeOne 的位址嘗試直接連線至來源站，確認遭到網路層拒絕。

若發生登入循環、頁面資源異常或來源地判斷錯誤，請依序檢查 Cache、Cookie Domain、回源 Host、外部 Protocol 與真實 IP Header。如果請求完全未進入 fn-knock 記錄，問題位於 DNS、EdgeOne 回源或來源站網路層；記錄已有請求但回傳 `502` 時，再檢查 fn-knock 至業務 Target 的鏈路。

## 回復原設定

變更前，請記錄原本的 DNS、來源站位址、連接埠、Protocol 與 Cache Rule。需要回復時，先還原原 DNS 或停用加速網域名稱，再將 fn-knock 的 Edge True IP Provider 改回符合實際入口的選項。DNS 尚未完全生效期間，兩條鏈路可能會同時收到請求，應避免其中一條鏈路提供過期的身分驗證內容。

EdgeOne 的產品介面、方案與回源選項可能會變動，Edge 端操作請以 [EdgeOne 官方文件](https://cloud.tencent.com/document/product/1552)為準。

- [安全邊界與基準線](/zh-tw/guide/security)
- [請求記錄](/zh-tw/guide/request-logs)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
