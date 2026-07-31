---
lang: zh-TW
title: "智慧連線"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 9cf7912a7fa75e589bb8838e64c052f7b9927e36d042da678921578c361ce24e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 智慧連線

`智慧連線` 是飛牛標準 FPK 在公網直達子網域模式下提供的 Split-horizon DNS：外部網路仍會將 `nas.example.com` 解析至公網入口，區域網路裝置則從本機 `dnsmasq` 取得裝置的私有 IPv4，以避開 Hairpin NAT 與繞行公網。

它只會改變 DNS 解析結果，不會建立 Host 映射、不會修改公網 DNS，也不會切換執行模式。

## 適用條件

同時符合下列條件時再啟用：

1. 目前使用 `子網域模式`，而不是 `內網穿透 → 子網域映射`。
2. 已設定身分驗證 Host，以及至少一筆服務 Host 映射。
3. fn-knock 所在裝置具備穩定的私有 IPv4。
4. 區域網路用戶端會將此裝置作為 DNS Server。
5. `53` 連接埠由預計交給智慧連線使用的 `dnsmasq` Listen，且沒有其他 DNS 服務與其衝突。
6. 目前使用飛牛標準 FPK，且具備 Host `dnsmasq` 與 Service Management 能力。

子網域入口設定請參閱[子網域模式快速上手](/zh-tw/quick-start/subdomain-mode)與[子網域映射](/zh-tw/guide/subdomain-proxy)。

## DNS 查詢路徑

```text
外部裝置 -> 公網 DNS -> 公網入口 -> fn-knock
區域網路裝置 -> 本機 dnsmasq -> 192.168.31.20 -> fn-knock
```

智慧連線會自動同步目前 Host 映射中的身分驗證 Host 與服務 Host，例如：

```text
auth.example.com  -> 192.168.31.20
nas.example.com   -> 192.168.31.20
alist.example.com -> 192.168.31.20
```

之後新增或刪除 Host 映射時，會觸發重新同步。沒有可用 Host 時無法啟用。

## 存取原則會如何改變

智慧連線不只是縮短連線路徑。流量改走區域網路後，閘道通常會識別到用戶端的私有網路來源，驗證結果會是 `local_exempt`：

- 開啟 `要求登入` 的 Host，不再要求該區域網路來源先登入。
- 舊設定中的嚴格允許清單規則也會放行本地來源，不會強制區域網路裝置加入公網允許清單。
- 從瀏覽器登出只會結束工作階段，不會取消該網路的 `local_exempt` 屬性。

因此，啟用智慧連線等同於將該區域網路納入信任邊界。訪客 Wi-Fi、不受信任的 VLAN 或多人共用網路，不應直接使用同一組 Split DNS，除非你能接受這些網路中的裝置取得本地豁免。

公網身分驗證必須透過行動網路等真實外部連線驗證，不能在已分流的 Wi-Fi 中測試。

## 設定方式

路徑：`系統設定 → 功能 → 智慧連線`

1. 開啟 `智慧連線`。
2. 頁面提示資源尚未就緒時，先安裝並初始化 `dnsmasq`。
3. 選擇區域網路用戶端實際可連線的私有 IPv4，例如 `192.168.31.20`。
4. 按下 `儲存並同步`，確認同步網域數量與最近同步時間。
5. 在路由器 DHCP 中，將 DNS Server 設為該私有 IPv4；也可以先在一台測試裝置上手動設定。
6. 重新取得網路設定，等待 Cache 更新後再查詢各子網域。

請選擇主要區域網路介面的 IP，不要選擇 Docker Bridge、Tunnel，或只供內部通訊使用的 Virtual Interface。

## 用戶端必須使用這台 DNS Server

後台儲存成功只代表本機已寫入並重新載入 `dnsmasq` 規則。若路由器仍向用戶端下發其他 DNS，或瀏覽器啟用了繞過本地 DNS 的 Encrypted DNS，查詢結果仍可能是公網 IP。

本地規則的 TTL 約為 `30` 秒。變更後可等待 Cache 過期、重新連線 Wi-Fi，或清除系統與瀏覽器 DNS Cache。

驗證時請查詢：

```text
auth.example.com
nas.example.com
```

回傳值應為所選的私有 IPv4，接著請求記錄中的來源也應符合區域網路預期。

## `dnsmasq` 狀態

| 狀態 | 意義 |
| --- | --- |
| `未安裝` | 沒有可用的 `dnsmasq` 程式 |
| `待初始化` | 程式存在，但服務或初始設定尚未就緒 |
| `未執行` | 已有設定，但服務目前未正常運作 |
| `已就緒` | 可以寫入規則並重新載入服務 |

初始化失敗時，請先檢查 `53/tcp` 與 `53/udp` 是否遭占用，再確認 Runtime 環境能否管理 `dnsmasq` 服務。不要讓兩個 DNS 服務同時 Bind 相同 IP 與連接埠。

## 平台限制

- 飛牛原生 FPK 可使用智慧連線；若沒有 `dnsmasq`，頁面可嘗試透過 `apt-get` 安裝。
- OpenWrt 不支援智慧連線；需要區域網路 DNS 分流時，請自行在 OpenWrt 的 `dnsmasq`、DHCP 或其他本機 DNS 中設定網域解析。
- Docker 不支援。Container 無法代替 Host 接管 `dnsmasq` 與 `53` 連接埠，後台會隱藏或拒絕此功能。
- 通用 Linux 安裝套件不提供智慧連線；如有需求，應在路由器或獨立 DNS 中設定分流。
- 群暉 DSM 7 SPK 不支援智慧連線，也不提供應用程式內的 `dnsmasq` 或區域網路 DNS 管理。
- Windows x86_64 不支援智慧連線，也不提供應用程式內的 `dnsmasq` 或區域網路 DNS 管理。
- 不具備 Host 管理能力的環境，應自行部署 Split DNS。
- 內網穿透的子網域映射不支援智慧連線。此拓樸的公網入口位於 Tunnel 平台，區域網路 DNS 分流必須自行在路由器或獨立 DNS 中設定。

## 它不會處理的內容

- 不會修改網域註冊商、Cloudflare 或其他公網 DNS Record。
- 不會自動更新公網 IPv4／IPv6；請使用 [DDNS 管理](/zh-tw/guide/ddns)或 [Cloudflare DDNS 設定](/zh-tw/guide/cloudflare-ddns)。
- 不會開放路由器連接埠、防火牆或 Docker Published Port。
- 不會變更上游服務的 Listen Address，也無法阻止區域網路使用者繞過閘道直接連上上游。

## 疑難排解

1. 頁面無法使用：確認目前採用公網直達子網域模式，並檢查部署平台能力。
2. 沒有可同步的網域：先建立身分驗證 Host 與服務 Host。
3. 沒有可選 IP：檢查主要網路介面是否取得 `10/8`、`172.16/12` 或 `192.168/16` IP。
4. 初始化失敗：檢查 `53` 連接埠占用狀態與 `dnsmasq` 服務狀態。
5. 用戶端仍解析至公網：檢查 DHCP 下發、手動 DNS、Encrypted DNS 與 Cache。
6. 網域已解析至私有網路但無法開啟：檢查實際閘道連接埠、憑證與 Host 映射，不要再排查公網 DDNS。

其他功能開關請參閱[系統設定](/zh-tw/guide/system)。
