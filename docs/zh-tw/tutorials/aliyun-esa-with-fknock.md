---
lang: zh-TW
title: "在 fn-knock 前端串接 Alibaba Cloud ESA"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9d7a51de355551d9492def65755568e6aa2df23a0aed9d679eb3e545a71d0bcf
---

# 在 fn-knock 前端串接 Alibaba Cloud ESA

Alibaba Cloud ESA 可部署在 fn-knock 前方，負責 DNS、TLS 與 Edge Delivery。來源站仍是 fn-knock 閘道；身分驗證、工作階段、Host 路由與存取原則不應在 ESA 設定中遭到繞過。

## 串接前確認

- 子網域映射已在不經過 ESA 的鏈路中驗證通過；
- 每個身分驗證 Host 與業務 Host 的 DNS、憑證及上游 Target 都已明確設定；
- ESA 可回源至 fn-knock 對外提供的位址、連接埠與 Protocol；
- 已保留繞過 ESA 的管理或 Fallback 路徑。

## 設定重點

1. 在 `子網域映射 → 子網域模式設定 → Edge Network 真實 IP 辨識` 中選擇 `Alibaba Cloud ESA`。閘道會讀取 `Ali-Real-Client-IP`，並透過 `X-Forwarded-For` 將辨識到的位址傳給身分驗證服務；ESA 端需要啟用託管轉換請求標頭。
2. 在 ESA 新增站點，將身分驗證 Host 與業務 Host 回源至 fn-knock 閘道。
3. 確保 Host、WebSocket 與真實 Client IP Header 都能 Pass Through 至來源站。
4. 為身分驗證、Callback、API 及其他動態路徑設定 Bypass Cache；快取靜態資源前，請先確認不會破壞 Cookie 或身分驗證。
5. 使用真正的外部網路，依序測試登入、業務頁面、檔案下載與長連線。

## 回源設定

ESA 的來源站應填入可連線至 fn-knock 閘道的位址，連接埠使用實際的閘道連接埠，預設為 `7999`。請勿回源至管理入口 `7991` 或內部後端連接埠。身分驗證 Host 與業務 Host 可使用同一個來源站，但必須將原始 Host 傳給 fn-knock。

如果 ESA 使用 HTTPS 回源，fn-knock 端的憑證需要涵蓋回源 Host，且憑證鏈可以通過平台驗證。如果使用 HTTP 回源，而公網至 ESA 的 Protocol 仍為 HTTPS，請確認前置層傳入的 Protocol 資訊不會讓應用程式產生 `http://` Callback 或 Cookie。

以下內容應視為動態請求：

- 身分驗證頁面與驗證 API；
- OIDC、QQ 等外部登入 Callback；
- 登出、工作階段狀態、Passkey，以及設定 Cookie 的回應；
- 業務應用程式本身的登入、上傳、下載簽章與 WebSocket Handshake。

只有在確認回應不會隨 Cookie、使用者或權限變化後，才能快取靜態資源。請勿快取包含 `Set-Cookie` 的回應，也不要讓不同使用者共用包含私有資料的 Cache Object。

## 真實 IP 的信任邊界

選擇 ESA Provider 後，`Ali-Real-Client-IP` 會參與 Client Address 判斷。如果攻擊者可以繞過 ESA 直接連線至來源站，就可能自行偽造同名 Header。應在防火牆、Cloud Security Group 或來源站存取控制中，只允許 ESA 回源節點與必要的維運來源存取閘道入口。

管理入口不應經過公開的 ESA 站點。需要遠端管理時，請使用 VPN、受限的反向代理或其他獨立管理鏈路。

## 疑難排解

請從行動網路執行完整鏈路測試：

1. 未登入時存取業務 Host，確認進入身分驗證流程。
2. 完成登入並返回業務 Host。
3. 在請求記錄中確認 `Client IP` 是訪客位址、`連線來源 IP` 可以是 ESA 節點，且可看到 `Ali-Real-Client-IP`。
4. 檢查請求 Host、身分驗證結果、上游 Target 與回應狀態。
5. 測試登出、外部登入 Callback、WebSocket 與檔案傳輸。
6. 嘗試繞過 ESA 直接連線至來源站，確認遭到網路層拒絕。

若發生登入循環、資源載入異常或地區規則誤判，請先檢查 ESA Cache Rule、回源 Host、外部 Protocol、Cookie Domain 與 Client IP Header，再修改 fn-knock 映射。請求未出現在 fn-knock 記錄中時，應檢查 DNS、ESA Origin Health 與來源站網路；記錄顯示 `502` 時，則檢查 fn-knock 至業務 Target 的鏈路。

## 回復原設定

變更前，請儲存原本的 DNS、回源 Protocol、連接埠、憑證與 Cache Policy。需要回復時，先還原原入口或停用 ESA Proxy，再將 fn-knock 的 Edge True IP Provider 改成符合目前鏈路的選項。在 DNS 傳播期間，請避免讓新舊入口使用不同的 Cookie Domain 或 Cache Rule。

ESA Console 與方案功能可能會變動，Edge 端操作請以 [ESA 官方文件](https://help.aliyun.com/zh/edge-security-acceleration/esa/)為準。

- [安全邊界與基準線](/zh-tw/guide/security)
- [請求記錄](/zh-tw/guide/request-logs)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
