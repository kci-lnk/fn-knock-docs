---
lang: zh-TW
title: "Cloudflare Tunnel（cloudflared）設定"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: eec0d64b8afa9b973302d46c06e9eba28248e07035de9d98c29f37c41e520c0e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Tunnel（cloudflared）設定

Cloudflared 會從內部網路主動連上 Cloudflare Tunnel，並將 Public Hostname 的請求送往 fn-knock 閘道。fn-knock 只負責管理 Cloudflared 執行檔資源、Tunnel Token、傳輸通訊協定與處理程序；網域及 Origin Service 仍需在 Cloudflare Dashboard 中設定。

新部署請使用 `內網穿透 → 子網域映射`，讓 Cloudflare 保留 Host，再由 fn-knock 依 Host 分流。路徑模式只用於相容既有的單網域路徑入口。

群暉 DSM 7 SPK 內建 Cloudflared 資源、Token 與處理程序管理功能。Windows x86_64 不提供這些功能；本頁的系統設定步驟不適用於 Windows。若自行在同一台 Windows 主機執行 Cloudflared，可將其 Service 指向 `http://127.0.0.1:7999`，並自行維護處理程序、Log 與更新。

## 1. 準備資源與 Tunnel

1. 在 `系統設定 → Cloudflared` 下載資源，確認狀態顯示為已就緒。
2. 開啟 [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)，前往 `Networks → Tunnels`。
3. 建立 Cloudflared Tunnel，並在安裝頁面複製 `--token` 後方的長字串。
4. 回到 `內網穿透 → Cloudflared`，貼上 Token。也可以貼上完整安裝指令，頁面會嘗試擷取其中的 Token。
5. 傳輸通訊協定建議優先使用 `自動`：先嘗試 QUIC，失敗時再降級至 HTTP/2。只有明確確認 UDP `7844` 遭封鎖時，才固定使用 HTTP/2。
6. 儲存並啟動，確認狀態與 Log 顯示 Tunnel 已連線。

Token 是 Tunnel 的連線憑據，應比照密碼妥善保存，不要放進截圖或公開 Log。

## 2. 設定 Host 路由

先在 fn-knock 儲存根網域、身分驗證服務與服務 Host，例如：

```text
auth.example.com  -> 身分驗證服務
nas.example.com   -> http://127.0.0.1:5666
alist.example.com -> http://127.0.0.1:5244
```

接著在 Tunnel 的 Public Hostname 中設定：

```text
Public Hostname  *.example.com
Service          http://127.0.0.1:7999
```

若實際閘道並非 `7999`，請使用後台顯示的連接埠。Wildcard Public Hostname 會將各服務 Host 送進同一個閘道，實際轉送至哪個服務仍由本機 Host 映射決定。

Cloudflared Tunnel 已保護 Cloudflare 至內部網路之間的傳輸時，本機 Origin 連線優先使用 HTTP，設定最單純。只有需要 HTTPS Origin 連線時，才依下一節處理憑證。

## 3. HTTPS Origin 連線

閘道已啟用 HTTPS 時，Service 可設定為：

```text
https://localhost:7999
```

Cloudflared 會驗證 Origin 憑證。使用自簽憑證，或憑證中未包含 `localhost` 時，Log 可能會出現：

```text
certificate is valid for nas.example.com, not localhost
```

這代表 Tunnel 已連到 Origin，但驗證使用的 Hostname 與憑證不相符。請選擇其中一種處理方式：

- 將 Origin Server Name 設為憑證所涵蓋的網域。
- 明確接受風險後，停用該 Origin 的 TLS 驗證。
- 改回 `http://127.0.0.1:7999`，由 Cloudflare 負責外部 HTTPS。

請勿將「停用驗證」當成憑證已修復；它只是停止檢查。憑證管理請參閱 [SSL 憑證](/zh-tw/guide/ssl)。

## 路徑模式相容設定

若已有 `https://home.example.com/alist` 之類的 URL，可在 `內網穿透 → 路徑模式` 中保留單一 Public Hostname：

```text
Public Hostname  home.example.com
Service          http://127.0.0.1:7999
```

Cloudflare 只負責將請求送至閘道，路徑分流仍由 fn-knock 處理。請勿同時在 Cloudflare 與 fn-knock 維護兩套彼此覆蓋的路徑 Rewrite 規則。

## 用戶端 IP 與 `local_exempt`

登入與允許清單會以閘道識別到的用戶端 IP 為準。私有網路、Loopback 與 Link-local 來源會被標記為 `local_exempt`，略過一般登入流程及既有嚴格允許清單規則的檢查。

Cloudflared 連至本機時，本身是從 Loopback 位址進入，因此必須讓內網穿透的子網域連線路徑正確使用 Cloudflare 傳入的訪客資訊。完成設定後，請從行動網路存取，並在 fn-knock 請求記錄中確認顯示的是訪客公網 IP，而不是 `127.0.0.1` 或 Container IP。EdgeOne / ESA 的用戶端 IP 開關不適用於 Cloudflared。

## 平台限制

- Cloudflared 是 Outbound Process，不要求 fn-knock 管理 Host 防火牆；Docker 環境也能使用。
- 執行平台必須具備符合架構的 Cloudflared 資源。資源頁尚未就緒時，即使儲存 Token 也無法啟動。
- 在 Docker 中，`127.0.0.1` 只代表目前 Container；若 Cloudflared 在獨立 Container 中執行，Service 應改用 fn-knock 的 Container Service Name 與連接埠。
- 群暉 DSM 7 SPK 支援應用程式內建 Cloudflared；管理頁面需從 DSM 桌面的套件入口開啟，閘道 Origin 連線使用實際連接埠 `7999`。
- Windows 不提供應用程式內建的 Cloudflared 資源頁；獨立執行的 Client 不受 fn-knock 管理。
- fn-knock 不會建立 Cloudflare DNS、Tunnel、Public Hostname、Cache Rule 或 Origin Request 設定。

## 疑難排解

1. **處理程序未啟動**：檢查資源狀態、Token 與傳輸通訊協定 Log。
2. **Tunnel 顯示 Online，但網域無法連線**：檢查 Public Hostname、DNS 與 Service 的實際連接埠。
3. **回傳 TLS 錯誤**：核對 Origin 通訊協定、憑證信任與 Origin Server Name。
4. **身分驗證 Host 可開啟，但服務 Host 回傳 404**：確認已使用 Wildcard Public Hostname，且請求 Host 已存在於本機映射中。
5. **所有存取看起來都來自同一來源**：檢查請求記錄中的用戶端 IP，再排查 Cloudflare 至閘道之間的來源資訊傳遞。
6. **頁面可開啟，但資源載入失敗**：確認 WebSocket 未遭停用；路徑模式還要檢查移除 Prefix 與 HTML Rewrite 設定。

整體執行狀態請參閱[內網穿透](/zh-tw/guide/tunnel)，完整範例請參閱[反向 Proxy 存取教學](/zh-tw/tutorials/reverse-proxy-with-fknock)。
