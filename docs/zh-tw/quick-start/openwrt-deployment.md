---
lang: zh-TW
title: "OpenWrt 部署"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: b0262d7159450ec265777aa9dbe71330637425391c37bd7b443934b0845d705f
---

# OpenWrt 部署

`fn-knock` 的 OpenWrt 套件包含 LuCI 設定頁面、管理後台、身分驗證頁面、Rust 後端與 Go 閘道。安裝後可從 `服務 → 敲門 Knock` 管理服務；管理後台預設使用 `7991`，閘道入口預設使用 `7999`。

請先分辨韌體使用的軟體套件格式與架構。格式錯誤時，Package Manager 無法安裝；架構錯誤時，即使 CPU 看似相近也無法執行。

## 選擇正確的軟體套件

### 套件格式取決於韌體

| 韌體的 Package Manager | 套件格式 | 常見 OpenWrt 版本 | 安裝指令 |
| --- | --- | --- | --- |
| `opkg` | `.ipk` | `24.10` 以下版本 | `opkg install /tmp/<檔名>.ipk` |
| `apk` | `.apk` | `25.12` 以上版本 | `apk add --allow-untrusted /tmp/<檔名>.apk` |

OpenWrt `25.12` 以上版本通常使用 `apk`，`24.10` 以下版本通常使用 `opkg`；衍生韌體或升級中的裝置仍應以實際的 Package Manager 為準。請勿根據系統版本或副檔名猜測，應先在路由器上確認：

```bash
ubus call system board
if command -v opkg >/dev/null 2>&1; then
  opkg print-architecture
else
  apk --print-arch
fi
```

### 依韌體架構直接下載

請以上方指令輸出的 Target Architecture 為準，再從下表直接下載對應格式的套件。這些連結與官網使用相同的穩定下載入口，已指定套件格式與架構，不需要手動修改網址。

| Target Architecture | 常見裝置 | APK（OpenWrt 25.12 以上） | IPK（OpenWrt 24.10 以下） |
| --- | --- | --- | --- |
| `x86_64` | Intel / AMD 64 位元軟路由與虛擬機器 | [下載 APK](https://get.fnknock.cn/?type=apk&arch=x86_64) | [下載 IPK](https://get.fnknock.cn/?type=ipk&arch=x86_64) |
| `aarch64_cortex-a53` | IPQ60xx、Cortex-A53、ImmortalWrt `qualcommax/ipq60xx` | [下載 APK](https://get.fnknock.cn/?type=apk&arch=aarch64_cortex-a53) | [下載 IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_cortex-a53) |
| `aarch64_generic` | Generic ARM64 路由器與開發板 | [下載 APK](https://get.fnknock.cn/?type=apk&arch=aarch64_generic) | [下載 IPK](https://get.fnknock.cn/?type=ipk&arch=aarch64_generic) |
| `arm_cortex-a7_neon-vfpv4` | 使用對應 Target 的 32 位元 ARMv7 裝置 | [下載 APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a7_neon-vfpv4) | [下載 IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a7_neon-vfpv4) |
| `arm_cortex-a5_vfpv4` | Cortex-A5 / VFPv4 路由器 | [下載 APK](https://get.fnknock.cn/?type=apk&arch=arm_cortex-a5_vfpv4) | [下載 IPK](https://get.fnknock.cn/?type=ipk&arch=arm_cortex-a5_vfpv4) |

正式套件檔名的最後一段是 OpenWrt Target Architecture，例如：

```text
fn-knock_<version>-<release>_x86_64.ipk
fn-knock_<version>-r<release>_aarch64_cortex-a53.apk
```

請以 `opkg print-architecture` 或 `apk --print-arch` 輸出的 Target 名稱為準，尤其不要混用 `aarch64_generic` 與 `aarch64_cortex-a53`。目前沒有對應套件的 MIPS、ARMv6 或其他 Target，無法強制安裝。

請下載 `fn-knock` 主套件，不要將應用商店 Metadata 套件誤當成執行套件。

## 安裝

將符合架構的套件上傳至路由器的 `/tmp` 後，依韌體類型執行其中一行指令：

```bash
# opkg 韌體
opkg install /tmp/fn-knock_*.ipk

# apk 韌體
apk add --allow-untrusted /tmp/fn-knock_*.apk
```

上述萬用字元指令假設 `/tmp` 中只有一個待安裝的 `fn-knock` 主套件；若保留了多個版本，請改用完整檔名。

`apk --allow-untrusted` 只適用於從可信任的正式發布頁面取得，且已核對來源或 Checksum 的本機安裝套件；此選項會略過套件儲存庫的簽章驗證，不能用於來源不明的檔案。離線安裝前，也需要確認韌體的套件來源能提供所需相依套件。

安裝 Script 會啟用並啟動服務，同時重新整理 LuCI 選單 Cache。也可以透過 LuCI 的軟體套件上傳入口安裝本機套件；使用 CLI 較容易確認實際採用的格式與架構。

## 首次進入與連接埠

開啟 `服務 → 敲門 Knock`，確認服務狀態為「執行中」，再按一下「開啟管理後台」。預設位址為：

```text
http://<OpenWrt 區域網路位址>:7991/
```

首次進入時需要設定管理面板密碼。這組密碼只保護 OpenWrt 上的管理入口，與使用者存取業務服務時使用的 TOTP、帳號密碼或 Passkey 不同。

| 連接埠 | 監聽範圍 | 用途 |
| --- | --- | --- |
| `7991` | 可設定，預設為管理入口 | 管理後台 |
| `7999` | 閘道監聽連接埠 | 對外存取映射服務的入口 |
| `17998` | `127.0.0.1` | Rust 管理後端內部 API |
| `7997` | `127.0.0.1` | 身分驗證服務 |
| `7996` | `127.0.0.1` | 閘道內部 gRPC |

可在 LuCI 頁面修改這些連接埠、資料目錄與閘道設定目錄。提交設定後，`procd` 會重新載入服務。連接埠數值不得重複。

請勿在 WAN 上轉送或放行 `7991`。需要公網存取時，請先明確選定模式、憑證與存取原則，再為閘道連接埠 `7999` 建立必要的防火牆規則或上游轉送。套件本身不會取代 OpenWrt 的 WAN 防火牆原則。

檢查服務與記錄：

```bash
/etc/init.d/fn-knock status
logread -e fn-knock
```

能開啟管理後台，只能證明本機服務已啟動。設定映射後，請使用行動網路等真正的外部連線驗證 `7999` 與網域名稱，不要將 LAN 測試結果當成公網身分驗證結果。

### 自動開放閘道連接埠

LuCI 可維護一條由 fn-knock 擁有、從 `wan` 到目前 TCP 閘道連接埠且同時適用 IPv4 / IPv6 的 firewall4 規則。全新安裝可預設啟用；舊安裝升級不會自行擴大公開範圍，需明確開啟。規則會跟隨重載與連接埠變更，停用、停止或解除安裝時移除。它不開放管理或內部連接埠，也不設定 NAT、DNS、TLS 或驗證；同名非自有規則會顯示衝突而不覆寫。自訂 zone 或集中管理防火牆時請關閉。

## 資料與升級

執行設定與資料預設位於：

```text
/etc/config/fn-knock
/etc/fn-knock/gateway
/etc/fn-knock/data
```

`/etc/config/fn-knock` 保存 UCI 連接埠與目錄設定，`/etc/fn-knock/gateway` 保存閘道 Runtime 設定，`/etc/fn-knock/data` 保存 SQLite、驗證金鑰及其他持久化資料。升級前請將這三處納入備份；其中含有敏感資訊，不應上傳至公開位置。

從舊版本升級且 UCI 仍使用預設 `/var/lib/fn-knock` 時，安裝 Script 會先停止服務、將舊資料複製至 `/etc/fn-knock/data`，再更新 `fn-knock.main.data_dir`。自訂資料目錄不會被強制遷移。升級後請先確認 LuCI 中的資料目錄、管理登入與原有設定正常，再處理舊目錄；驗證前不要手動刪除。

同時請從維護頁面匯出 `.knock` 應用程式備份。目錄備份用於保留 SQLite 與平台執行資料，`.knock` 則用於移轉可還原的設定；內容範圍、版本限制與還原驗收方式請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

OpenWrt 不支援從管理後台安裝 FPK 更新。請從上方直接下載表取得相同格式、相同韌體架構的新套件後，再執行：

```bash
# opkg 韌體：安裝新版本，或明確重新安裝相同版本
opkg install --force-reinstall /tmp/fn-knock_*.ipk

# apk 韌體
apk add --allow-untrusted /tmp/fn-knock_*.apk

/etc/init.d/fn-knock status
```

如果 `/tmp` 中保留了多個版本，請使用完整檔名取代萬用字元，避免一次將多個套件傳給 Package Manager。

升級不會主動清除上述執行目錄。如果 Package Manager 詢問如何處理已修改的 `/etc/config/fn-knock`，請保留現有設定，除非本次升級明確要求還原預設設定。

若忘記 OpenWrt 管理面板密碼，請透過 SSH 執行：

```bash
fn-knock-reset-panel-password
```

接著返回 LuCI 的管理後台入口，依提示設定新密碼。

## OpenWrt 版本的功能限制

| 功能 | OpenWrt 軟體套件中的狀態 |
| --- | --- |
| 應用程式內 FPK 更新 | 不支援；使用 `opkg` 或 `apk` 安裝符合條件的新套件 |
| 直連模式、主機防火牆管理 | 不支援；使用 OpenWrt 自身防火牆、VPN 或上級閘道控制原始連接埠 |
| 智慧連線 | 不支援；需要分流時在 OpenWrt 的 `dnsmasq`、DHCP 或其他本機 DNS 中自行設定 |
| SSH 安全性 | 不支援；請使用 OpenWrt 本身的 SSH 記錄、防火牆或安全性外掛套件 |
| Web Terminal | 不支援 |
| 自動 HTTPS | 目前的 OpenWrt 軟體套件不支援 |

`fn-knock` 無法取代 OpenWrt 韌體更新、路由器備份與防火牆最小曝露原則。

繼續閱讀：

- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
- [選擇存取方案](/zh-tw/quick-start/run-modes)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
