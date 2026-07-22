---
lang: zh-TW
title: "路徑型反向代理（相容模式）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: a5c2d2d14d03659b1798f2dbf1496082ee3d8cc398978d44caa41e811a4e7aaf
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 路徑型反向代理（相容模式）

`路徑映射` 只會在 `內網穿透 → 路徑模式` 中作為主要路由使用。它會將同一個外部 Host 下的不同 Path Prefix 轉送至不同 HTTP 上游，例如將 `/alist` 轉送至 AList。

新部署請優先使用[子網域映射](/zh-tw/guide/subdomain-proxy)：Host 路由可讓每個應用程式繼續在根路徑執行，通常比 Path Rewrite 更可靠。路徑模式適合保留既有 URL，或暫時無法規劃多個子網域的部署環境。

## 路由模型

```text
https://example.com/alist    -> http://127.0.0.1:5244
https://example.com/jellyfin -> http://127.0.0.1:8096
```

閘道會依最長 Path Prefix 進行比對。若同時存在 `/app` 與 `/app-admin`，請求 `/app-admin/users` 會命中 `/app-admin`。

Path Prefix 會出現在瀏覽器 URL 中。若應用程式將 `/`、Callback URL、Service Worker Scope 或 WebSocket URL 寫死，即使啟用 Rewrite 仍可能異常；此時應移轉至 Host 路由，而不是繼續疊加規則。

## 新增映射

進入 `路徑映射` 後，可使用 `一鍵探索` 產生候選規則，也可以手動填寫：

| 欄位 | 作用 |
| --- | --- |
| `觸發路徑` | 以 `/` 開頭的外部 Path Prefix |
| `Target URL` | 使用 `http`、`https`、`ws` 或 `wss` 的上游 URL |
| `要求身分驗證` | 尚未授權時，先進入 fn-knock 登入流程 |
| `移除 Prefix` | 將 `/alist/users` 以 `/users` 傳送至上游 |
| `Rewrite HTML` | 替部分頁面資源引用補上外部 Path Prefix |
| `根目錄模式` | 記錄命中的映射後，將瀏覽器導向 `/`，以相容必須在根目錄執行的應用程式 |

Target URL 必須能從 fn-knock 的 Runtime 環境連線。通常使用 Loopback 或區域網路 IP；Docker 中的 `127.0.0.1` 代表 Container 本身，Host Service 必須使用 Container 可連線的位址。

一鍵探索提供的驗證、Rewrite 與移除 Prefix 選項只供參考。儲存前仍需依目標應用程式對 Base Path 的支援能力調整。

掃描視窗可選擇「依裝置建議」或低、中、高、極高強度。各級的探索範圍與結果相同，只會改變 Concurrency、耗時與裝置負載；資源有限的裝置建議優先使用自動或低強度。

掃描只接受本機 IPv4 CIDR，候選設定不會自動上線。完整的 Target 來源、連接埠範圍、Concurrency 限制與疑難排解流程，請參閱[服務探索與批次匯入](/zh-tw/guide/service-discovery)。

## 存取原則

停用 `要求身分驗證` 會將該路徑設為公開；啟用後，公網訪客必須先通過 fn-knock 登入，才能存取上游。路徑映射沒有獨立的嚴格允許清單原則。`IP 允許清單` 可提供來源授權，但不會將「要求身分驗證」的路徑變成只允許該來源；若需要在請求到達路徑前先限縮來源，請使用[閘道可見性](/zh-tw/guide/gateway-visibility)或外部網路層規則。

當閘道識別到 Loopback、私有網路或 Link-local 來源時，驗證結果會是 `local_exempt`，並略過一般登入檢查。因此，能從區域網路直接開啟路徑，不代表公網身分驗證已經生效。流量經過 FRP 或其他 Proxy 時，應在請求記錄中確認已保留真實的公網用戶端 IP。

Host 映射中的 `略過 Basic Auth` 會向 Target Service 注入上游憑據，並不是 fn-knock 登入。路徑映射不應將瀏覽器 Basic Auth 當成閘道身分驗證的替代方案。

## 預設路由

預設路由負責處理根路徑 `/`。服務探索通常會將飛牛 OS 設為預設服務；只有明確需要讓根路徑進入其他應用程式時，才應修改。

修改多筆映射或預設路由後，可按下 `同步路由`，主動將目前設定重新下發至閘道。儲存單一規則通常已經會觸發同步。

## 何時應移轉至 Host 路由

發生下列任一情況時，請優先移轉：

- 靜態資源、WebSocket 或登入 Callback 仍跳回根路徑。
- 應用程式不支援可設定的 Base Path。
- 多個應用程式的 Prefix、Cookie 或 Service Worker 彼此干擾。
- 需要替不同服務分別設定 `要求登入`、排程開放或上游 Basic Auth 注入。

切換至 `內網穿透 → 子網域映射` 後，既有路徑規則仍會保留，但入口會隱藏；確認 Host 連線穩定後，再清理舊規則。

## 疑難排解

1. 確認目前模式為 `內網穿透 → 路徑模式`。
2. 從 fn-knock 所在環境直接存取 Target URL。
3. 檢查最長 Prefix 是否命中預期規則。
4. 依上游收到的 URI，決定是否啟用 `移除 Prefix`。
5. 頁面資源載入失敗時，檢查 `Rewrite HTML`；若仍失敗，請評估改用 Host 路由。
6. 查看請求記錄中的用戶端 IP、命中路徑、Status Code 與上游 Target。

網路入口請參閱[內網穿透](/zh-tw/guide/tunnel)，操作流程請參閱[內網穿透快速上手](/zh-tw/quick-start/reverse-proxy-mode)與[反向 Proxy 存取教學](/zh-tw/tutorials/reverse-proxy-with-fknock)。
