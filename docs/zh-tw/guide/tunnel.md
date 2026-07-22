---
lang: zh-TW
title: "內網穿透與隧道"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 484e31df2a08db12c32d71138b3eb11a2fc29bfb557732f747a920b8d20ffa9a
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 內網穿透與隧道

當裝置沒有可從公網連入的入口時，FRP 或 Cloudflared 可以從內網主動建立 Tunnel，將外部 Request 送進 fn-knock 閘道。Tunnel 只會改變網路拓撲；Request 進入閘道後，仍會依 Host 或相容 Path 路由，再套用存取政策。

進入 `系統設定 → 模式`，選擇 `內網穿透`。新部署請選 `子網域映射`；只有既有服務仍使用單一網域 Path 入口時，才選擇已標示為不再建議使用的 `路徑模式`。

Synology DSM 7 SPK 提供 FRP 與 Cloudflared 的應用程式內建資源及 Process 管理。Windows x86_64 不包含這些資源，因此本頁的 `系統設定 → FRP`、`系統設定 → Cloudflared` 步驟不適用於 Windows。若自行在同一台 Windows 主機上執行 Tunnel Client，可將 Origin 指向 `127.0.0.1:7999`，但該 Process 的安裝、憑據及生命週期須由管理員自行維護。

## 兩種 Tunnel 方案

| 方案 | 外部資源 | 適用情境 |
| --- | --- | --- |
| FRP | 一台執行 frps 的公網 Server 及 Remote Port | 想自行掌控公網位址、連接埠與傳輸設定 |
| Cloudflared | Cloudflare Tunnel 與 Public Hostname | 已使用 Cloudflare，希望透過網域接入，且不想自行維護 frps |

兩者的本機 Target 都是實際的閘道入口，常見值為 `127.0.0.1:7999`；若曾自訂連接埠，請以後台顯示內容及部署設定為準。

## 選擇路由方式

### 子網域映射

建議的流量路徑如下：

```text
nas.example.com -> FRP / Cloudflared -> fn-knock -> Host nas.example.com -> 飛牛
```

Tunnel 必須保留原始 Host，並將驗證 Host 與服務 Host 都送到同一個閘道。Cloudflared 可以使用 `*.example.com` Public Hostname；若使用 FRP TCP Forwarding，則由 DNS 與 Remote Port 一起指向 frps。

### 路徑模式

相容模式的流量路徑如下：

```text
https://example.com/alist -> Tunnel -> fn-knock -> Path /alist -> AList
```

這種模式可以保留舊 URL，但應用程式可能需要移除 Prefix、改寫 HTML 或切換成 Root Path 模式。不要只因為使用 Tunnel，就讓新服務預設採用 Path-based Routing。

## FRP

先到 `系統設定 → FRP` 下載資源，再進入 `內網穿透 → FRP`。預設產生的 Proxy 通常包含：

```toml
type = "tcp"
localIP = "127.0.0.1"
localPort = 7999
transport.proxyProtocolVersion = "v2"
```

PROXY Protocol v2 用來將公網 Client 位址一路傳遞到閘道。如果 frps、Forwarding 路徑或自訂設定不支援此協定，閘道可能只能看到 FRP Node 的位址，允許清單與登入後 IP 授權也會因此失真。

頁面提供兩種編輯方式：

- `表單模式` 用於維護 Server 位址、連接埠、Token、Local Port 及 Remote Port。它只會覆寫已支援的欄位，其他合法 TOML 內容會保留。
- `自訂` 可直接編輯 `frpc.toml`。儲存前會執行 `frpc verify`；語法有誤時無法儲存，也無法可靠地切回表單模式。

如果已有自訂設定，請先備份原始內容，再切換編輯方式。

## Cloudflared

先到 `系統設定 → Cloudflared` 下載資源，再到 `內網穿透 → Cloudflared` 儲存 Tunnel Token。公網網域及 Origin Service 必須在 Cloudflare Dashboard 中設定，不是在 fn-knock 裡建立。

Host 路由的建議設定與 TLS 取捨，請參考 [Cloudflared Tunnel 設定](/zh-tw/guide/cloudflared-tunnel)。

## 存取政策與真實 Client IP

Tunnel 不會取代 fn-knock 登入、允許清單或憑據範圍。Host 編輯頁可透過 `要求登入` 切換公開存取或登入優先；歷史設定中的嚴格允許清單規則，仍會依來源 IP 執行。Path 模式則由每一條映射個別決定是否要求登入。

驗證判斷以閘道最終辨識到的 Client IP 為準。Private、Loopback 及 Link-local 來源會標示為 `local_exempt`，並略過一般登入與嚴格允許清單，因此來源位址的傳遞也是 Tunnel 安全邊界的一環：

- FRP 應優先保留預設的 PROXY Protocol v2。
- Cloudflared 請使用專用的內網穿透子網域路徑，不要套用 EdgeOne / ESA 開關。
- 啟動後請從行動網路存取，並在 Request Log 中確認 Client IP 是訪客的公網位址，而不是 `127.0.0.1`、Container 位址或 Tunnel Node 位址。

## 平台限制

- Tunnel 是 Outbound Connection，不需要 fn-knock 寫入 Host 防火牆；Docker 也能使用。
- Runtime 環境必須具備符合架構的 FRP / Cloudflared 執行檔。請以 `系統設定 → FRP` 或 `系統設定 → Cloudflared` 顯示的就緒狀態為準。
- Synology DSM 7 SPK 支援這些內建資源；管理入口仍只會出現在 DSM 桌面 CGI 中，服務流量則繼續進入 `7999` 閘道。
- Windows 不提供這些內建資源或就緒狀態；自行部署的 Tunnel Process 不受 fn-knock 啟停與 Log 管理。
- Docker 內的 `127.0.0.1` 代表目前的 Container。fn-knock 閘道與 Tunnel Process 位於同一 Container 時可以使用；若自行建立獨立的 Tunnel Container，則須改用 Service Name 或 Container Network 位址。
- 內網穿透模式不提供智慧連線及協定映射。額外的 TCP / UDP 服務必須另外在 FRP 或 Cloudflare 平台規劃。
- 切換離開內網穿透模式時，系統會嘗試停止由 fn-knock 管理的 Tunnel Process；外部獨立 Process 不在控制範圍內。

## 啟動與驗證

1. 儲存路由方式、驗證 Host 及至少一條服務映射。
2. 儲存 FRP 或 Cloudflared 設定並啟動。
3. 確認執行狀態顯示為已連線，再檢查 Log 中是否有重新連線、Token、TLS 或連接埠錯誤。
4. 從外部網路存取驗證 Host 與服務 Host。
5. 在 Request Log 中核對 Host、Client IP、授權類型及 Upstream Target。

操作流程請參考[內網穿透快速上手](/zh-tw/quick-start/reverse-proxy-mode)與[反代存取教學](/zh-tw/tutorials/reverse-proxy-with-fknock)。
