---
lang: zh-TW
title: "內網穿透與隧道"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: baec212f5c1e0405344d0502a1b06be59dedf2e1896a33f26cc5cca99344b96d
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 內網穿透與隧道

當裝置沒有可從公網連入的入口時，FRP 或 Cloudflared 可以從內網主動建立 Tunnel，將外部 Request 送進 fn-knock 閘道。Tunnel 只會改變網路拓撲；Request 進入閘道後，仍會依 Host 或相容 Path 路由，再套用存取政策。

進入 `系統設定 → 模式`，選擇 `內網穿透`。新部署請選 `子網域映射`；只有既有服務仍使用單一網域 Path 入口時，才選擇已標示為不再建議使用的 `路徑模式`。

macOS 與 Synology DSM 7 SPK 提供 FRP 與 Cloudflared 的應用程式內建資源及 Process 管理。Windows x86_64 不包含這些資源，因此本頁的 `系統設定 → FRP`、`系統設定 → Cloudflared` 步驟不適用於 Windows。若自行在同一台 Windows 主機上執行 Tunnel Client，可將 Origin 指向 `127.0.0.1:7999`，但該 Process 的安裝、憑據及生命週期須由管理員自行維護。

## 兩種 Tunnel 方案

| 方案 | 外部資源 | 適用情境 |
| --- | --- | --- |
| FRP | 一台執行 frps 的公網 Server 及 Remote Port | 想自行掌控公網位址、連接埠與傳輸設定 |
| Cloudflared | Cloudflare Account、Zone 與 API Token | 已使用 Cloudflare，希望自動維護 Tunnel、Wildcard DNS 與 Ingress |

FRP 與手動 Cloudflared 的本機 Target 通常是實際閘道入口 `127.0.0.1:7999`；託管 Cloudflared 使用由 fn-knock 自動設定的專用本機入口，不需要手動填寫 Port。

## 選擇路由方式

### 子網域映射

建議的流量路徑如下：

```text
nas.example.com -> FRP / Cloudflared -> fn-knock -> Host nas.example.com -> 飛牛
```

Tunnel 必須保留原始 Host，並將驗證 Host 與服務 Host 都送到同一個閘道。託管 Cloudflared 會自動維護 `*.example.com` Ingress 與代理 CNAME；FRP TCP Forwarding 則由 DNS 與 Remote Port 一起指向 frps。

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

資源頁提示更新時，fn-knock 會下載到暫存位置、驗證固定摘要，暫停正在執行的託管程序，備份執行檔與安裝資訊後替換並恢復。新檔案無法啟動時會還原舊檔並嘗試重啟。更新期間 Tunnel 會短暫中斷，完成後應確認程序和外部存取。

先到 `系統設定 → Cloudflared` 下載資源，再到 `內網穿透 → Cloudflared` 填入建議的 Cloudflare Account API Token。選擇專用 Tunnel，執行預檢並套用；fn-knock 會建立或接入 Tunnel、維護 Wildcard DNS 與 Ingress、取得 Tunnel Token 並啟動 Process。進階區域仍保留手動 Tunnel Token 模式。

託管流程、Token 權限、標準 HTTPS Port、優選 Beta 與故障回退，請參考 [Cloudflared Tunnel 設定](/zh-tw/guide/cloudflared-tunnel)。

## 存取政策與真實 Client IP

Tunnel 不會取代 fn-knock 登入、允許清單或憑據範圍。Host 編輯頁可透過 `要求登入` 切換公開存取或登入優先；歷史設定中的嚴格允許清單規則，仍會依來源 IP 執行。Path 模式則由每一條映射個別決定是否要求登入。

驗證判斷以閘道最終辨識到的 Client IP 為準。Private、Loopback 及 Link-local 來源會標示為 `local_exempt`，並略過一般登入與嚴格允許清單，因此來源位址的傳遞也是 Tunnel 安全邊界的一環：

- FRP 應優先保留預設的 PROXY Protocol v2。
- 託管 Cloudflared 只在 Loopback 專用入口信任 `CF-Connecting-IP`，不要套用 EdgeOne / ESA 開關，也不要信任訪客自行提供的 `X-Forwarded-For`。
- 啟動後請從行動網路存取，並在 Request Log 中確認 Client IP 是訪客的公網位址，而不是 `127.0.0.1`、Container 位址或 Tunnel Node 位址。

## Process 守護與失敗診斷

由 fn-knock 管理的 FRP 與 Cloudflared Process 會顯示 `已停止`、`啟動中`、`執行中` 或 `等待重新啟動`。已設定持續執行的 Process 意外結束後，系統會自動重啟，並以約 `1、2、5、10、30、60、120、300` 秒逐步退避（含少量隨機抖動）；穩定執行約 `5` 分鐘後，連續失敗計數會重設。手動停止會取消後續重試。

等待重啟時，頁面會顯示連續失敗次數、下次重試時間與最近診斷。Log 會保留 Process PID、啟動與結束時間、執行時長、Exit Code 或 Signal、失敗摘要，以及最近的 stdout/stderr，可用來區分 Token、TLS、網路、設定與執行檔問題。分享 Log 前仍須遮蔽 Token、網域、公網位址與 Server 資訊。

fn-knock 服務本身重新啟動後，會恢復已儲存為持續執行的 Tunnel，並在可驗證時接管仍存在的 Process。此守護只涵蓋由 fn-knock 啟動的內建 FRP / Cloudflared；Windows 或其他外部獨立 Process 仍由管理員負責。

## 平台限制

- Tunnel 是 Outbound Connection，不需要 fn-knock 寫入 Host 防火牆；Docker 也能使用。
- Runtime 環境必須具備符合架構的 FRP / Cloudflared 執行檔。請以 `系統設定 → FRP` 或 `系統設定 → Cloudflared` 顯示的就緒狀態為準。
- Synology DSM 7 SPK 支援這些內建資源；管理入口仍只會出現在 DSM 桌面 CGI 中。託管 Cloudflared 的本機入口由 fn-knock 自動設定，FRP 與自管 Tunnel 才使用實際閘道 Port。
- macOS Intel 與 Apple Silicon 原生套件都支援這些內建資源；下載會符合目前 Darwin 架構，管理面板仍只監聽本機 `127.0.0.1:7991`。
- Windows 不提供這些內建資源或就緒狀態；自行部署的 Tunnel Process 不受 fn-knock 啟停與 Log 管理。
- Docker 內的 `127.0.0.1` 代表目前的 Container。fn-knock 閘道與 Tunnel Process 位於同一 Container 時可以使用；若自行建立獨立的 Tunnel Container，則須改用 Service Name 或 Container Network 位址。
- 內網穿透模式不提供智慧連線及協定映射。額外的 TCP / UDP 服務必須另外在 FRP 或 Cloudflare 平台規劃。
- 切換離開內網穿透模式時，系統會嘗試停止由 fn-knock 管理的 Tunnel Process；外部獨立 Process 不在控制範圍內。

## 啟動與驗證

1. 儲存路由方式、驗證 Host 及至少一條服務映射。
2. 儲存並啟動 FRP；或為 Cloudflared 連接 API Token、預檢並套用託管設定。
3. 確認執行狀態顯示為已連線；若顯示 `等待重新啟動`，請查看連續失敗次數、下次重試時間與最近診斷，再檢查 Token、TLS、網路或連接埠錯誤。
4. 從外部網路存取驗證 Host 與服務 Host。
5. 在 Request Log 中核對 Host、Client IP、授權類型及 Upstream Target。

操作流程請參考[內網穿透快速上手](/zh-tw/quick-start/reverse-proxy-mode)與[反代存取教學](/zh-tw/tutorials/reverse-proxy-with-fknock)。
