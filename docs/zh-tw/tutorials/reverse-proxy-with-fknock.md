---
lang: zh-TW
title: "無公網 IP：透過隧道發布子網域"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 92b38595cf586a2f6634b8882301ad43e413c48f4ea5649cbf49f823352e74c0
---

# 無公網 IP：透過隧道發布子網域

即使沒有公網 IP，仍可使用子網域映射。重點是讓 FRP 或 Cloudflared 將外部請求帶到 fn-knock 的閘道入口，再由閘道依 Host 路由至內部網路服務。

路徑映射仍可用於舊設定，但新部署應優先選擇「內網穿透／子網域映射」。

## 前置需求

- 已部署 fn-knock，且閘道連接埠可在本機使用；
- 已備妥 FRP Server 或 Cloudflare Zero Trust 帳號；
- 擁有可管理的網域名稱，或 Tunnel 提供的公網 Host；
- 已備妥登入憑證與真正的外部網路驗證環境。

## 設定步驟

1. 在 `系統設定 → 模式` 選擇 `內網穿透`，並選擇 `子網域映射`。
2. 在 `子網域映射` 設定根網域、身分驗證 Host 與第一個業務 Host。業務 Host 的 Target 請填入 fn-knock 所在環境可存取的內部網路服務位址，預設開啟「要求登入」；身分驗證 Host 必須公開。
3. 使用 FRP 時，設定 Client 將流量轉送至實際閘道 Port；使用 Cloudflared 時，連接建議的 Account API Token、選擇專用 Tunnel 並套用預檢計畫。
4. FRP 的 DNS 與入口由 Server 設定；託管 Cloudflared 會自動維護 Wildcard DNS 與 Ingress，不需要逐筆新增 Public Hostname。兩種方式都要正確傳遞 Host、WebSocket 與真實 Client IP。
5. 設定對外 HTTPS。如果由 Tunnel 或前置反向代理終止 TLS，請明確設定回源 Protocol 與憑證驗證方式；不要將內部的 `localhost` 位址當成瀏覽器存取位址。
6. 從行動網路開啟身分驗證 Host，完成登入後再存取業務 Host。

## FRP 與 Cloudflared 的差異

| 項目 | FRP | Cloudflared |
| --- | --- | --- |
| 公網入口 | 自有 `frps` 或 Provider 節點 | Cloudflare Edge 與 Tunnel |
| DNS | 通常指向 FRP Server | 託管模式自動維護 Wildcard 代理 CNAME |
| 真實來源 IP | HTTP Header 或正確設定的 PROXY Protocol | Cloudflare Request Header；需要依入口正確設定 |
| fn-knock 中的管理 | 可管理多個 frpc Instance、設定與記錄 | 透過 API Token 管理 Tunnel、DNS、Ingress、Token、Process、Log 與優選 |

如果 FRP 只進行 TCP Forwarding，fn-knock 看到的連線來源可能是 Tunnel 節點或本機轉接位址；應依 FRP 鏈路設定 PROXY Protocol 或可信任的真實 IP Header，並在請求記錄中驗證結果。請勿因為頁面可以開啟，就假設 IP 允許清單、地區與掃描規則使用了正確的 Client Address。

Cloudflared 建議連接 Cloudflare API Token，透過預檢與套用自動建立 Wildcard DNS、Ingress 和專用本機入口。託管模式的訪客位址使用 `https://服務網域`，不附加 `:7999`，也不必在 Dashboard 逐筆建立 Public Hostname。只有手動或外部自管 Cloudflared 才需自行將 Public Hostname 回源至實際閘道 Port；請勿直接回源業務服務，否則會繞過 fn-knock Host 路由與身分驗證。

## Target 位址

- fn-knock 與服務以原生方式執行於同一台主機時，可使用服務實際監聽的 `127.0.0.1:<連接埠>`。
- Docker 中的 `127.0.0.1` 是 fn-knock Container 本身。主機服務應填入 Container 可連線的位址，其他 Container 則應透過共用的 Network Name 存取。
- 服務位於其他區域網路裝置時，請填入其固定內部 IP 或內部 DNS Name。
- Target 使用 HTTPS 時，請檢查憑證名稱與 Trust Chain；內部網路憑證錯誤會顯示為閘道 `502`。

## 為什麼不使用 DDNS

在 Tunnel 情境中，公開網域名稱通常解析至 FRP Server 或 Cloudflare Edge，而不是家用寬頻位址。此時若再為同一個 Host 設定家用位址的 DDNS，會造成 DNS 解析衝突。只有在 DNS 最終需要指向會變動的自有公網入口時，才需要設定 DDNS。

## 驗證鏈路

請依序檢查：

1. fn-knock 中的 Tunnel 資源已安裝，Instance 或 Tunnel 狀態為執行中，且記錄中沒有持續重新連線；
2. 公網 DNS 是否指向正確入口；
3. 身分驗證 Host 是否可開啟並完成登入；
4. 請求記錄是否顯示正確的 Host 與真實 Client IP；
5. 業務 Host 是否命中正確的上游。

如果 DNS 可以解析，但請求記錄中沒有任何記錄，問題位於 Tunnel 或前置平台；如果記錄中已有請求但轉送失敗，再檢查映射與上游服務。

請繼續測試 WebSocket、上傳下載、登出與憑證服務範圍。區域網路請求可能被判定為 `local_exempt`，最終結果必須從真正的外部網路驗證。

## 回復與遷移

切換 Tunnel 前，請匯出 fn-knock 設定，並記錄舊 DNS、frpc 設定或 Tunnel Public Hostname。需要回復時，先還原舊入口，再停止新 Tunnel；不要讓兩個入口長期針對同一個 Host 提供不同的真實 IP 或 TLS 語意。

從路徑模式遷移至子網域映射時，請先平行建立新的業務 Host 並完成驗證，再移除舊路徑。如果上游應用程式儲存了 Absolute Callback URL，也需要同步更新應用程式設定。

- [內網穿透](/zh-tw/guide/tunnel)
- [Cloudflared Tunnel](/zh-tw/guide/cloudflared-tunnel)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
