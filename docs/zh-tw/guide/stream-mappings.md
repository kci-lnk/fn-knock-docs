---
lang: zh-TW
title: "TCP / UDP 通訊協定映射"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: f5432bc2cfe0a0c7ead7c3a7085d570742c31091eff31a5dc325eff32e13d75a
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TCP / UDP 通訊協定映射

`通訊協定映射` 可替 SSH、資料庫、DNS 等非 HTTP 服務新增 TCP／UDP Listen Port。它不會讀取網域 Host 或 URL Path，而是將特定對外連接埠的 Byte Stream 轉送至 `host:port`。

此功能只作為公網直連 `子網域模式` 的補充。Web 服務仍應使用[子網域映射](/zh-tw/guide/subdomain-proxy)；路徑相容規則請參閱[路徑映射](/zh-tw/guide/reverse-proxy)。

## 生效條件

側邊欄要顯示 `通訊協定映射`，必須同時符合：

1. `系統設定 → 模式` 為 `子網域模式`。
2. `系統設定 → 功能 → 通訊協定映射` 已啟用。

關閉功能開關會清除所有既有通訊協定映射，而不只是隱藏選單。切離子網域模式時，此功能也會停用；變更前請先記錄仍需保留的規則。

`內網穿透 → 子網域映射` 雖然同樣使用 Host 路由，但不提供通訊協定映射。若要讓 FRP 或 Cloudflare 承載其他通訊協定，必須在對應平台另外設定，不能共用 fn-knock 的 HTTP Host 入口。

## 路由模型

```text
TCP :2222 -> 192.168.1.20:22
TCP :3306 -> 127.0.0.1:3306
UDP :53   -> 127.0.0.1:53
```

網域只負責解析至入口 IP，不參與通訊協定分流。用戶端可連線至 `nas.example.com:2222`，最終命中哪條規則只取決於 Transport Protocol 與連接埠。

## 規則欄位

| 欄位 | 說明 |
| --- | --- |
| `傳輸通訊協定` | `TCP`、`UDP`，可同時選取；儲存後拆成兩條規則 |
| `對外連接埠` | 用戶端連線使用的連接埠，範圍為 `1-65535` |
| `Target` | 純 `host:port`，不可包含 `http://` 或路徑 |
| `要求驗證` | 連線前依來源 IP 查詢 fn-knock 授權狀態 |

同一個連接埠可各有一條 TCP 與 UDP 規則，例如 `53/tcp` 與 `53/udp`；相同通訊協定、相同連接埠不可重複。

Target 必須能從 fn-knock 所在環境連線。在 Docker 中，`127.0.0.1` 代表 Container 本身；Host 或區域網路 Target 必須使用 Container 可連線的 IP。

## 驗證機制是檢查來源 IP

SSH、MySQL、Redis 等用戶端不會開啟 fn-knock 登入頁面。啟用 `要求驗證` 後，使用順序如下：

1. 在瀏覽器中開啟 fn-knock 的 Web 入口並完成登入。
2. 若工作階段設定與所用憑據允許，登入流程會替目前公網出口 IP 建立授權記錄；否則請手動新增該 IP／CIDR。
3. 再從相同出口 IP，使用通訊協定用戶端連線至對外連接埠。

出口 IP 變更、授權到期，或用戶端改走其他網路時，連線會被直接拒絕，必須重新登入或更新手動授權。瀏覽器 Cookie 本身不會隨 TCP／UDP 連線傳送；通訊協定入口依賴的是來源 IP 授權。服務範圍受限的登入憑據不會建立自動 IP 授權，必須改用範圍未受限的憑據，或手動加入來源。工作階段與 IP 變化請參閱[工作階段管理與 IP 軌跡](/zh-tw/guide/session-management)，驗證方式請參閱[身分驗證總覽](/zh-tw/guide/auth)。

停用 `要求驗證` 會將該 Listen Port 公開轉送。Target Service 本身的 SSH Key、資料庫密碼、TLS 與最小權限仍必須妥善設定。

### `local_exempt`

身分驗證服務會將閘道識別到的 Loopback、私有網路與 Link-local 來源歸類為 `local_exempt`。這些來源連線至已啟用驗證的通訊協定映射時，也會被視為本地網路存取，不要求先完成 Web 登入。

因此：

- 區域網路連線成功，無法證明公網驗證有效。
- 若連接埠前方還有 NAT 或 Proxy，應確認閘道看到的不是 Proxy 的私有 IP。
- 公網測試必須使用真實外部網路，並核對工作階段中的來源 IP。

## 儲存、同步與防火牆

儲存規則會更新設定、重新整理閘道 Listener，並在支援的部署環境中同步連接埠放行。`同步閘道` 可在連續修改多條規則後，主動重新套用全部設定，通常不需要每次都按。

平台限制如下：

- 飛牛原生 FPK，以及具備 root Host 管理能力的 OpenWrt，可在啟用自動防火牆管理後同步通訊協定連接埠。
- Docker 不會發布新的 Host Port，也不會修改 Host 防火牆。必須在 Container 啟動設定中明確發布固定連接埠，並手動處理 Host 與路由器規則；執行中的 Compose 無法只靠後台新增連接埠就完成公網暴露。
- 自行接管閘道 Runtime 時，連接埠放行仍由系統管理員負責；不要假設 fn-knock 會修改 Host 防火牆。

無論平台是否自動放行，路由器 Port Forwarding、Cloud Security Group 與上游網路原則仍必須允許該連接埠。

## 驗證與疑難排解

1. 確認目前使用公網直連子網域模式，且功能開關仍為啟用。
2. 檢查通訊協定與對外連接埠是否和用戶端一致。
3. 從 fn-knock Runtime 環境直接連線至 Target。
4. 檢查 Container Port Publishing、Host 防火牆、路由器轉送與 Cloud Security Group。
5. 啟用驗證時，確認瀏覽器登入與通訊協定用戶端使用相同的公網出口 IP。
6. 儲存後仍未 Listen 時，按下 `同步閘道`，再查看狀態與 Log。

相關功能開關請參閱[系統設定](/zh-tw/guide/system)。
