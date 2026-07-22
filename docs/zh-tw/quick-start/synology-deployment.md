---
lang: zh-TW
title: "Synology DSM 7 部署（x86_64 / ARM）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: ad4203acd39e7498eafeae21acfd0d38b24da49a426da64ac27023961e6f6521
---

# Synology DSM 7 部署（x86_64 / ARM）

`fn-knock` 提供適用於 Synology DSM 7 的原生 SPK 套件，支援 `x86_64`、`armv8` 與 `armv7` 三種 Synology 套件架構。每個 SPK 只包含一種架構的原生二進位檔，必須選擇與 NAS 相符的檔案；也不能將 fnOS 使用的 FPK 當成 DSM 安裝套件。

套件會以 DSM 建立的 `fn-knock-synology` 套件帳號執行，不需要長期以 root 身分執行。如此可保留 DSM 的套件權限邊界，但也代表部分需要直接管理主機的功能無法使用。

## 安裝前確認

- DSM 版本為 `7.0-40000` 以上，且套件架構為 `x86_64`、`armv8` 或 `armv7`。
- 目前的 DSM 帳號屬於 administrators 群組；只有 DSM 管理員能開啟 fn-knock 管理介面。
- 閘道預設使用 `7999/tcp`，請勿與既有反向代理、Container 或另一套 fn-knock 衝突。
- 若計畫從外部網路存取，請事先確認網域名稱、路由器／NAT、DSM 防火牆，以及 IPv6／ISP 原則；安裝成功不代表外部入口已可使用。

## 選擇正確的 SPK

| Synology 套件架構 | 常見處理器類型 | 檔名 | 下載 |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64 位元 | `fn-knock-synology-x86_64-<版本>-<建置編號>.spk` | [下載 x86_64 SPK](https://get.fnknock.cn/?type=synology&arch=x86_64) |
| `armv8` | ARM 64 位元 | `fn-knock-synology-armv8-<版本>-<建置編號>.spk` | [下載 ARMv8 SPK](https://get.fnknock.cn/?type=synology&arch=armv8) |
| `armv7` | ARM 32 位元 | `fn-knock-synology-armv7-<版本>-<建置編號>.spk` | [下載 ARMv7 SPK](https://get.fnknock.cn/?type=synology&arch=armv7) |

請依照 Synology 機型對應的 **Package Arch（套件架構）** 選擇，不要只依產品名稱或 CPU 品牌猜測。架構不相符時 DSM 會拒絕安裝；請重新下載正確的 SPK，不要變更檔名或混用套件內的二進位檔。

## 安裝 SPK

1. 從上表或 [Synology 下載頁面](https://www.fnknock.cn/synology)下載與 NAS 套件架構相符的 SPK。
2. 在 DSM 中開啟「套件中心」，選擇「手動安裝」，上傳 SPK 並完成安裝。
3. 確認套件已啟動，再從 DSM 主選單開啟「敲門 knock」。
4. 在管理介面中完成身分驗證、閘道映射與憑證設定。

管理介面會透過已登入的 DSM 桌面工作階段開啟。DSM 主選單會先開啟工作階段啟動頁面：

```text
/webman/3rdparty/fn-knock-synology/launch.html
```

啟動頁面會從 DSM 桌面視窗讀取目前的工作階段並完成驗證，再進入 CGI Proxy：

```text
/webman/3rdparty/fn-knock-synology/index.cgi/
```

請勿將這兩個內部位址加入書籤或直接開啟；離開 DSM 桌面環境時，啟動頁面無法讀取工作階段。也不要將 `7998` 當成瀏覽器管理連接埠，或使用 DSM Root Path 下的 `/3rdparty/...` 取代上述路徑。

## 管理入口與連接埠

| 入口或連接埠 | 監聽範圍 | 用途 |
| --- | --- | --- |
| DSM 主選單中的「敲門 knock」 | 啟動頁面驗證已登入的 DSM 工作階段後進入 CGI Proxy | 唯一受支援的管理入口；僅限 DSM 管理員存取 |
| `7998` | `127.0.0.1` | 管理後端，由 DSM CGI Proxy 至本機 |
| `7997` | 僅限本機內部 | 身分驗證服務 |
| `7996` | 僅限本機內部 | 閘道內部通訊 |
| `7999` | 閘道公開監聽 | 承接業務網域名稱與閘道流量 |
| `7991` | 不開放 | DSM 原生套件不使用此管理連接埠 |

請勿將 `7998`、`7997`、`7996` 轉送至公網或區域網路，也不要為這些連接埠新增 DSM 防火牆放行規則。業務服務只應透過閘道連接埠 `7999` 進入。

## 安全地對外提供閘道服務

SPK 會將 `7999/tcp` 宣告為套件的公開閘道連接埠，讓 DSM 能在防火牆介面中辨識此 Port Resource；套件本身不會以 root 權限改寫 DSM 的主機防火牆原則。是否允許外部連線，仍取決於下列各層設定：

1. DSM 防火牆是否只針對所需來源、介面與連接埠放行 `7999`。
2. 路由器是否將公網連接埠正確轉送至 NAS，或是否已透過 FRP、Cloudflared 等 Tunnel 回源。
3. IPv6 防火牆、上游 ISP 與 DNS 解析是否符合所選存取方式。
4. 閘道中的 Host 映射是否已設定憑證、身分驗證與目標服務位址。

管理入口應保留在 DSM 桌面內，請勿為了方便管理而公開 `7998`。設定完成後，使用行動網路等真正的外部連線存取業務網域名稱，並檢查請求是否通過閘道且觸發預期的登入原則。

## DSM 版本的功能限制

| 功能 | DSM 原生 SPK 中的狀態 |
| --- | --- |
| Host／路徑映射、身分驗證、憑證與 ACME | 支援 |
| 內建 FRP、Cloudflared | 支援，可作為閘道的外部入口方案 |
| 直連授權、主機防火牆管理、智慧連線 | 不支援 |
| fnOS 憑證庫同步、系統時鐘同步 | 不支援 |
| Web Terminal、SSH 安全性 | 不支援 |
| 應用程式內自動更新 | 不支援；請使用 DSM 套件中心安裝 SPK 更新 |

缺少「主機防火牆管理」不影響在 DSM 中手動設定防火牆規則；這只代表 fn-knock 不會依登入狀態動態改寫 DSM 防火牆。若需要原始連接埠的直連授權，應改用支援此功能的部署方式。

## 資料、記錄與升級

執行資料、設定、憑證與金鑰儲存於：

```text
/var/packages/fn-knock-synology/var
```

此目錄包含敏感資料。升級前建議匯出 fn-knock 應用程式備份，並將 DSM Snapshot 或備份原則納入規劃；請勿在升級過程中手動清空此目錄。服務記錄預設位於：

```text
/var/packages/fn-knock-synology/var/fn-knock.log
```

`.knock` 應用程式封存檔方便移轉設定，DSM 目錄 Snapshot 則保留 SQLite、憑證與套件執行資料。兩者涵蓋範圍不同；還原順序與匯入版本限制請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

DSM 原生套件不使用應用程式內的 FPK 更新流程。取得新版 SPK 後，請在「套件中心 → 手動安裝」中選取新檔案完成升級；安裝期間服務會短暫重新啟動。升級後，請重新從 DSM 主選單進入管理介面，並驗證閘道、身分驗證與一筆已設定的業務映射。

繼續閱讀：

- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
- [選擇部署與存取方案](/zh-tw/quick-start/deployment-options)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
