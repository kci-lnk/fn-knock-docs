---
lang: zh-TW
title: "控制台與系統更新"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: ef2d7fbe2f0bb6a3223819b5528c1226d51b7bd2dcc8bea3ce067b8bd1969ea1
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 控制台與系統更新

`控制台` 集中顯示閘道流量、安全性封鎖、DDNS 與 Tunnel 狀態，適合快速判斷系統是否有流量、近期是否出現明顯異常。它不能取代請求記錄、長期監控，或上游服務本身的可用性檢查。

## 查看控制台

頁面頂端可選擇 `15 分鐘`、`1 小時`、`6 小時`、`24 小時` 或 `7 天`。所選範圍會套用至累計 Inbound／Outbound、安全性趨勢與網路流量走勢圖；即時 Inbound、即時 Outbound 與目前 Online 數量則反映當下狀態。

主要區塊包括：

| 區塊 | 內容 |
| --- | --- |
| 即時與累計流量 | 目前收送速率，以及所選範圍內的 Inbound 與 Outbound 總量 |
| 安全性封鎖 | 登入失敗、掃描器封鎖清單數量、WAF 偵測與阻擋事件及其趨勢 |
| 入口狀態 | DDNS 供應商、最近位址、更新範圍、最近檢查，以及額外網域狀態 |
| Tunnel 入口 | 內網穿透模式下的 FRP、Cloudflared 執行狀態、預設 Tunnel 與 PID |
| 網路流量走勢 | 所選時間範圍內的 Inbound、Outbound 時間序列 |

「入口狀態」模組可在 `系統設定 → 功能` 中隱藏。Tunnel 區塊只會在內網穿透模式，且目前平台支援 FRP 或 Cloudflared 時顯示。

進行疑難排解時，請依下列順序檢查：

1. 新增映射後，從外部發起存取，確認 Online 數量、即時速率或流量曲線是否有所變化。
2. 安全性封鎖增加時，前往事件中心、掃描器封鎖清單或 WAF Log 查看實際來源。
3. DDNS 未更新時，前往 DDNS 頁面比對最近檢查、位址來源與更新記錄。
4. Tunnel 顯示未執行時，點選對應卡片進入 Tunnel 頁面，查看處理程序狀態與 Log。
5. 只有特定網域異常時，檢查該 Host 的映射、憑證、存取原則與上游 Target。

本機或區域網路流量無法證明公網入口有效。涉及身分驗證、反向 Proxy 或 Tunnel 時，請透過行動網路等真實外部連線路徑重新測試。

## 管理後台配色

控制台右上角可選擇預設色、愛馬仕橙、普魯士藍或動態白。此設定會儲存為管理後台的系統層級主題色，與淺色／深色外觀切換彼此獨立，也不會影響身分驗證頁面或上游應用程式的樣式。

## 更新頁面依部署型態運作

路徑：`版本與更新`。所有部署方式都會顯示目前版本、最新版本、檢查結果與 Release Notes；只有飛牛原生 FPK 能直接從頁面下載並安裝更新。群暉 DSM 7 SPK 需透過 DSM 套件中心安裝，Windows 原生版則由獨立的 `Knock 敲門 · Windows 管理程式` 負責安裝，兩者都不會在網頁更新頁面執行。

| 部署型態 | 更新頁面提供的功能 | 實際升級方式 |
| --- | --- | --- |
| 飛牛原生 FPK | 檢查、下載、驗證並一鍵安裝 | 在頁面執行一鍵更新；應用程式會重新啟動 |
| Docker Compose | 檢查版本與查看說明 | Pull 發布 Image 並重新建立 Container |
| OpenWrt | 檢查版本與查看說明 | 安裝符合韌體套件格式與架構的 `.ipk` 或 `.apk` |
| Linux（systemd / OpenRC） | 檢查版本與查看說明 | 執行 `sudo knock update` |
| 群暉 DSM 7 SPK | 檢查版本與查看說明 | 下載符合架構的 SPK，並在 DSM 套件中心手動更新 |
| Windows x86_64 | 檢查版本與查看說明 | 在 `Knock 敲門 · Windows 管理程式` 或系統匣選單中檢查並安裝更新 |

請勿在 Docker、OpenWrt 或群暉的更新頁面嘗試安裝 FPK；頁面會將這些平台標示為不支援應用程式內更新。Windows 也不要透過網頁更新頁面安裝，請改用桌面管理程式。

## 飛牛原生 FPK 更新

請在 `版本與更新` 中檢查新版本。偵測到更新後，頁面會下載符合裝置架構的 FPK 與 Checksum 檔案，再透過飛牛應用程式中心安裝並重新啟動應用程式。下載、驗證與安裝期間會顯示進度；進入安裝階段後請勿關閉頁面。

更新期間，管理後台與閘道會短暫無法使用。開始前請先匯出設定備份；更新完成後，從飛牛桌面重新開啟應用程式，確認版本號、身分驗證設定與閘道入口均已恢復正常。

## 更新 Docker Compose

請在部署目錄執行：

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

如果 `.env` 中將 `FN_KNOCK_IMAGE` 固定為特定版本 Tag，請先改成目標版本。Image 不等同於資料備份：升級前應備份 `fn_knock_gateway` 與 `fn_knock_data` 這兩個 Persistent Volume。

## 更新 Linux

一般 Linux 安裝請使用：

```bash
sudo knock update
```

此指令會比對本機與線上版本、下載並驗證發布套件，再部署至版本目錄。即使版本相同，也可以確認重新安裝；若新版本未通過 Health Check，系統會還原原有程式、Service Script 與啟停狀態。需要切回保留的上一版時，請執行 `sudo knock rollback`。更新前仍應備份 `/etc/fn-knock` 與 `/var/lib/fn-knock`。

## 更新 OpenWrt

先選擇符合韌體套件管理員與目標架構的新套件，再執行：

```bash
# opkg 固件
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk 固件
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

若 `/tmp` 中保留多個版本，請使用完整檔名取代 Wildcard。

本機 `.apk` 的 `--allow-untrusted` 只能用於從可信發布管道取得的套件。升級會保留 `/etc/config/fn-knock`、`/etc/fn-knock/gateway` 與 `/var/lib/fn-knock`；即使會保留，升級前仍應先備份。

## 更新群暉 DSM 7 SPK

在 `版本與更新` 查看版本與 Release Notes 後，下載符合群暉機型架構的 SPK，再透過 DSM 套件中心完成手動更新。網頁不會代替 DSM 安裝或重新啟動套件。

更新前請先匯出應用程式備份。套件資料位於 `/var/packages/fn-knock-synology/var`；升級後從 DSM 桌面的套件入口重新進入，檢查版本、身分驗證設定與閘道存取是否恢復正常。

## 更新 Windows x86_64

開啟 `Knock 敲門 · Windows 管理程式`，按一下「檢查更新」，或從系統匣選單執行相同操作。管理程式下載 Windows 安裝套件時，會核對下載來源、檔案大小與 SHA-256，接著啟動安裝程式；網頁中的 `版本與更新` 只用來查看版本與說明。

安裝程式會暫時停止服務。若新版本未能通過 Readiness Check 並啟動，安裝程式會還原原有程式與執行資料；這不等同於備份，更新前仍應匯出應用程式備份。Windows 解除安裝或升級後會保留 `%ProgramData%\FnKnock`，其中包含設定、SQLite 與憑證等敏感資料。

## 每次更新後的檢查

1. 管理入口能否登入，目前版本是否正確。
2. 是否能從真實外部網路存取閘道網域或連接埠。
3. 目前模式、憑證、映射與身分驗證規則是否仍符合預期。
4. 正在使用的 FRP、Cloudflared 或其他上游反向 Proxy 是否已恢復連線。
5. 事件中心、請求記錄與 WAF Log 是否持續產生新記錄。

`fn-knock` 更新不能取代 Host 系統更新與備份。對外閘道、憑證、DNS 與服務各自都有獨立的故障面，更新後應分別驗證。

繼續閱讀：

- [請求記錄](/zh-tw/guide/request-logs)
- [Docker 部署](/zh-tw/quick-start/docker-deployment)
- [OpenWrt 部署](/zh-tw/quick-start/openwrt-deployment)
- [群暉 DSM 7 部署](/zh-tw/quick-start/synology-deployment)
- [Windows x86_64 部署](/zh-tw/quick-start/windows-deployment)
