---
lang: zh-TW
title: "fnOS 原生 FPK 安裝與初始設定"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e6560f97889fff7b3cfe3e7dbc4f798fa0fa33b7225cd8931d1f56ab46580813
---

# fnOS 原生 FPK 安裝與初始設定

本頁只介紹 fnOS 上的原生 `fn-knock` FPK。若要使用 Docker Compose，請參閱 [Docker 部署](/zh-tw/quick-start/docker-deployment)；路由器上的 OpenWrt 軟體套件請參閱 [OpenWrt 部署](/zh-tw/quick-start/openwrt-deployment)；一般 Linux 主機請參閱 [Linux 部署（systemd / OpenRC）](/zh-tw/quick-start/linux-deployment)；Synology DSM 7 請參閱 [Synology DSM 7 部署](/zh-tw/quick-start/synology-deployment)；Windows 主機請參閱 [Windows x86_64 部署](/zh-tw/quick-start/windows-deployment)。

## 安裝前確認

請從官方下載服務取得符合 fnOS 裝置架構的原生 FPK。目前原生套件提供兩種架構：

| fnOS 裝置架構 | 應選套件 |
| --- | --- |
| x86-64（Intel / AMD） | [從官網下載 `fn-knock-amd64.fpk`](https://get.fnknock.cn/) |
| ARM64（`aarch64`） | [從官網下載 `fn-knock-arm64.fpk`](https://get.fnknock.cn/?arch=arm64) |

> **建議使用官網原生 FPK**
>
> 官網提供的 fnOS 原生 FPK 是 fn-knock 功能最完整的版本，支援目前所有功能。若您先前從 fnOS 應用中心（App Center）安裝 fn-knock，該應用程式實際上是 Docker 版本，並非原生 FPK。建議先備份現有設定與資料、解除安裝應用中心版本，再依裝置架構從上方官網連結下載並手動安裝原生 FPK；請勿同時執行兩個版本，以免連接埠衝突。

請勿在 32 位元 ARM 裝置上安裝 ARM64 套件，也不要將其他部署格式當成原生 FPK 安裝。安裝精靈會要求設定四個連接埠；若沒有衝突，保留預設值即可。四個數值都必須介於 `1`–`65535`，且不得重複。

| 預設連接埠 | 精靈中的名稱 | 用途 |
| --- | --- | --- |
| `7998` | 管理後端連接埠 | fnOS 桌面圖示透過本機 Proxy 存取的管理後端 |
| `7997` | 驗證連接埠 | 登入、登出與 Passkey 等身分驗證頁面服務 |
| `7996` | Go 管理連接埠 | 閘道與管理端之間的內部 gRPC 通道 |
| `7999` | Go Proxy 連接埠 | 閘道入口；外部存取服務時通常會經過此連接埠 |

`7998`、`7997` 與 `7996` 不應轉送為公網入口。需要對外提供服務時，只需規劃閘道連接埠及其網域名稱；實際開放方式取決於所選模式。

## 在 fnOS 中安裝

1. 開啟 fnOS 的應用中心，進入手動安裝並選取下載完成的 `.fpk` 檔案。
2. 在連接埠設定步驟確認四個連接埠；僅在與現有服務衝突時修改。
3. 完成安裝，等待應用程式狀態變成執行中。
4. 回到 fnOS 桌面，開啟 `敲門 knock` 圖示。

桌面圖示開啟的是管理入口，不是提供外部訪客使用的閘道入口。修改應用程式設定中的連接埠後，應用程式會重新啟動以套用新值。

## 初始設定順序

### 1. 選擇存取模式

開啟 `系統設定 → 模式`，依實際網路條件選擇：

- 具備公網入口與網域名稱，主要對外提供 Web 服務：優先選擇子網域模式。
- 需要使用 FRP、Cloudflared 等 Tunnel：選擇「內網穿透」；新部署請使用其中的子網域映射，路徑映射僅供相容舊有方案。
- 必須在登入後繼續存取裝置的原始連接埠：才考慮直連模式。

模式決定流量如何進入與路由，並不會改變管理後台的存取位址。選擇前請先閱讀[選擇存取方案](/zh-tw/quick-start/run-modes)。

### 2. 建立登入憑證

請先在 `驗證設定` 中綁定至少一組 TOTP Token，再繼續設定公網入口。請在日常使用裝置以外的另一部可信任裝置或離線備份中保存 Token；若只留在一支手機上，更換或遺失手機時可能會無法登入。

若要使用帳號密碼、Passkey、QQ 或其他外部帳號登入，請先完成基礎憑證設定，再依對應頁面繼續：

- [TOTP 與驗證器 App](/zh-tw/guide/totp)
- [登入模式與帳號密碼登入](/zh-tw/guide/password-login)
- [外部帳號登入](/zh-tw/guide/oidc)
- [綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)

### 3. 設定憑證與入口

建立映射、DDNS 或 Tunnel 前，請先決定由哪個元件對外提供閘道入口。需要 HTTPS 時，請在 `SSL 憑證` 中設定既有憑證、ACME 或測試憑證；憑證、DNS 與連接埠轉送必須指向同一條入口鏈路。

## 驗證安裝

安裝完成後，先確認兩件事：

1. 從 fnOS 桌面開啟 `敲門 knock`，可正常進入管理後台。
2. 完成一組最小映射後，使用行動網路等真正的外部連線存取閘道網域名稱或 `7999`，確認請求進入預期的身分驗證與路由流程。

能在區域網路內開啟桌面圖示，只能證明應用程式已啟動；無法證明連接埠轉送、DDNS、憑證或公網身分驗證已正確設定。

## 常見問題

### 開啟桌面圖示後顯示無法連線至後端

請先在應用中心確認 `敲門 knock` 正在執行，再檢查四個連接埠是否與其他應用程式衝突。修改連接埠後需要等待應用程式重新啟動完成；若仍未恢復，請查看應用程式記錄中的啟動錯誤。

### 管理後台可用，但無法從外部存取

請沿著整條鏈路逐項檢查：閘道連接埠或網域名稱是否可達、目前模式是否符合拓撲、DNS/DDNS 是否正確、憑證是否涵蓋存取網域名稱，以及上游 Tunnel 或連接埠轉送是否指向 `7999`。管理後台可以開啟，不代表公網鏈路已通。

## 安全邊界

`fn-knock` 用於收斂入口並提供前置身分驗證，不能取代 fnOS 系統更新、備份、最小權限原則，以及業務服務本身的帳號安全。使用子網域或 Tunnel 路由時，若將管理連接埠或業務原始連接埠直接暴露至公網，會繞過閘道。只有使用[直連授權](/zh-tw/quick-start/direct-mode)時，原始連接埠才應由 fn-knock 的防火牆規則，針對已授權的來源 IP 暫時放行。

繼續閱讀：

- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
- [選擇存取方案](/zh-tw/quick-start/run-modes)
- [SSL 憑證](/zh-tw/guide/ssl)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
