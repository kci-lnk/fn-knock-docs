---
lang: zh-TW
title: "macOS 部署（Intel / Apple Silicon）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0912ae4a2d36e245cbe4770888063c9d343483a9a8a72e20b7573ef7a8a48ac9
---

# macOS 部署（Intel / Apple Silicon）

macOS 版使用命令列安裝程式與 `knock` 管理指令，不提供 `.app`、`.pkg` 或選單列程式。支援 macOS 13 以上版本，並分別提供 Intel 與 Apple Silicon 原生套件。

管理面板預設只監聽 `127.0.0.1:7991`。macOS 執行環境不會呼叫 `iptables`，也不會修改 macOS 主機防火牆。

## 安裝前確認

- macOS 13 或更高版本。
- 目前帳號可使用 `sudo`。
- 可透過 HTTPS 存取 `cdn.fnknock.cn` 與 GitHub Release。
- 預設連接埠 `7991`、`7996`、`7997`、`7998`、`7999` 未被占用；安裝程式發現衝突時會提示修改。

安裝程式會自動判斷架構：

| Mac | 發布架構 | 安裝套件檔名 |
| --- | --- | --- |
| Intel（`x86_64`） | `amd64` | `fn-knock-macos-<版本>-amd64.tar.gz` |
| Apple Silicon（`arm64`） | `arm64` | `fn-knock-macos-<版本>-arm64.tar.gz` |

即使在 Apple Silicon 的 Rosetta 終端中執行，安裝程式仍會辨識實體架構並選擇 `arm64`。進入服務安裝前也會驗證套件內的 Mach-O 架構。

## 一行安裝

在「終端機」執行：

```bash
curl -fsSL https://cdn.fnknock.cn/macos/install.sh | sudo bash
```

安裝程式會下載目前架構的穩定版、核對檔案大小與 SHA-256、安裝 root LaunchDaemon，並等待管理服務與閘道就緒；不需要 Homebrew。

完成後執行 `sudo knock status`，並在這台 Mac 的瀏覽器開啟 `http://127.0.0.1:7991/`。首次進入時設定管理面板密碼；它與訪客在閘道使用的 TOTP、帳號密碼或 Passkey 無關。

### 從其他電腦管理

`7991` 固定為本機回環入口。需要臨時遠端管理時，可從用戶端建立 SSH 轉送：

```bash
ssh -L 7991:127.0.0.1:7991 <macOS使用者>@<Mac位址>
```

保持 SSH 連線後，在用戶端瀏覽器開啟 `http://127.0.0.1:7991/`。長期入口可用 `sudo knock nginx` 取得 HTTPS Reverse Proxy 範例，並額外設定存取控制。

## 未簽章發行與 Gatekeeper

macOS 套件未使用 Apple Developer ID 簽章，也未經 Apple 公證。命令列安裝程式會依穩定版指標驗證大小與 SHA-256。手動下載時，請從官方 GitHub Release 取得壓縮檔及 `SHA256SUMS`，再執行：

```bash
shasum -a 256 fn-knock-macos-<版本>-<amd64或arm64>.tar.gz
```

結果必須與 `SHA256SUMS` 中相同檔名的項目完全一致。瀏覽器可能為手動下載並解壓的檔案加入 quarantine；只有驗證通過後，才可視需要對解壓目錄執行：

```bash
xattr -dr com.apple.quarantine /path/to/fn-knock
```

安裝程式不會靜默移除 quarantine。不要對未驗證來源的檔案執行 `xattr`。

## 連接埠與網路邊界

| 預設連接埠 | 監聽範圍 | 用途 |
| --- | --- | --- |
| `7991` | `127.0.0.1` | 管理面板 |
| `7998` | 本機回環 | Rust 管理後端 |
| `7997` | 本機回環 | 驗證服務 |
| `7996` | 本機回環 | Go 閘道管理介面 |
| `7999` | 由閘道設定決定；預設服務入口 | 接收經過 fn-knock 的服務流量 |

不可公開 `7996`、`7997`、`7998`。`7999` 能否從 LAN 或公網存取，仍取決於 macOS 防火牆、路由器或 NAT、IPv6 防火牆與 ISP 入站規則；fn-knock 不會修改它們。

自動 HTTPS 與協定映射只設定 fn-knock 的監聽與路由，不會開啟 macOS 防火牆、路由器連接埠或雲端安全群組。新增協定映射連接埠後，必須由管理員手動放行。

## 使用 `knock` 管理

不帶參數執行 `sudo knock` 可開啟互動選單。常用指令：

| 指令 | 用途 |
| --- | --- |
| `sudo knock status` | 查看 LaunchDaemon、核心 Process、連接埠與記憶體 |
| `sudo knock start` / `stop` / `restart` | 控制服務 |
| `sudo knock config` | 修改五個執行連接埠並檢查衝突 |
| `sudo knock logs` / `logs --follow` | 查看或持續跟隨 Log |
| `sudo knock update` / `update --yes` | 互動或非互動安裝同架構更新 |
| `sudo knock rollback` | 切回保留的上一版並驗證服務 |
| `sudo knock nginx` | 輸出管理面板 HTTPS Reverse Proxy 範例 |
| `sudo knock reset-panel-password` | 清除管理面板密碼以重新設定 |
| `sudo knock version` | 顯示已安裝版本 |

更新會在原子切換 `current` 連結前完成下載與驗證。新版本未通過 Health Check 時，會還原版本連結、管理指令、LaunchDaemon 設定與原有啟停狀態。這不能取代備份，更新前仍應匯出應用程式備份。

## 檔案位置

| 內容 | 路徑 |
| --- | --- |
| 版本目錄 | `/Library/Application Support/FnKnock/releases/<版本>` |
| 目前與上一版本 | `/Library/Application Support/FnKnock/current`、`previous` |
| 執行設定 | `/Library/Application Support/FnKnock/config/fn-knock.env` |
| 應用程式資料 | `/Library/Application Support/FnKnock/data` |
| 服務 Log | `/Library/Logs/FnKnock` |
| 管理指令 | `/usr/local/bin/knock` |
| LaunchDaemon | `/Library/LaunchDaemons/cn.fnknock.service.plist` |

LaunchDaemon 以 root 執行，可在登入前啟動；系統重新開機後自動載入，核心 Process 異常結束時由 launchd 重新啟動整組服務。

## 平台能力邊界

macOS 支援 Host / Path Reverse Proxy、身分驗證、憑證與 ACME、WAF、監控、深度監控，以及內建 FRP / Cloudflared。它不提供：

- `iptables` 或 macOS 主機防火牆管理。
- 直連授權與智慧連線。
- SSH 安全管理、Web Terminal、fnOS 憑證庫同步或 fnOS 專屬網路最佳化。
- Web UI 安裝更新；請使用 `sudo knock update`。

macOS 的白名單仍參與閘道存取規則，但不能用來開啟主機原始連接埠。

## 解除安裝

保留設定、資料與 Log，只移除程式及服務：

```bash
sudo knock uninstall
```

永久移除所有內容：

```bash
sudo knock uninstall --purge
```

完整清除需要在互動終端輸入 `DELETE`。請先匯出備份；解除安裝程式無法復原已刪除的本機資料。

## 疑難排解

```bash
sudo knock status
sudo launchctl print system/cn.fnknock.service
sudo knock logs
```

- 管理面板無法開啟：請在安裝 fn-knock 的 Mac 本機使用 `127.0.0.1`，並確認 `7991` 是否已修改。
- 服務未就緒：查看 `/Library/Logs/FnKnock/stdout.log` 與 `stderr.log`，再檢查五個連接埠衝突。
- 閘道無法從外部存取：檢查 `7999` 實際監聽、macOS 防火牆、路由器/NAT、IPv6 與 ISP 規則。
- 更新失敗：先確認自動還原結果；只有 `previous` 存在時才執行 `sudo knock rollback`。
- 架構不符：不要強制安裝，重新使用一行安裝指令選擇原生套件。

繼續閱讀：[連接埠與入口](/zh-tw/quick-start/ports-and-entrypoints)、[選擇部署與存取方案](/zh-tw/quick-start/deployment-options)、[控制台與系統更新](/zh-tw/guide/dashboard-and-update)。
