---
lang: zh-TW
title: "Linux 部署（systemd / OpenRC）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: e90b21ae59103a44858cf77355da8ae1c08bd5d08c064f9dd16d6518234919d4
---

# Linux 部署（systemd / OpenRC）

本頁適用於一般 Linux 主機。安裝套件支援 `amd64`、`arm64` 與 `armv7`，可執行於使用 systemd 的 Linux Distribution，以及採用 OpenRC 的 Alpine Linux。主機需要 root 權限，且 systemd 或 OpenRC 必須已正常啟動；沒有 Init System 的精簡 Container 不適用這套主機安裝程式，請改用 [Docker 部署](/zh-tw/quick-start/docker-deployment)。

安裝程式會視需要安裝 `curl`、`openssl`、`tar`、`unzip`、`gzip` 與連接埠偵測工具；在 Alpine 上，也會透過 `apk` 安裝執行所需的 Bash 與相依套件。

Linux 版本會在 `7991` 提供管理面板，並在 `7999` 提供 Go 閘道入口。管理面板只應透過區域網路、VPN 或具有存取控制的 HTTPS 反向代理開啟；請勿直接映射至公網。

## 安裝

### 使用 systemd 的 Distribution

在 Terminal 中執行：

```bash
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo bash
```

### Alpine Linux（OpenRC）

請以 `sh` 啟動安裝程式，避免首次安裝前系統尚未提供 Bash：

```sh
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo sh
```

安裝程式會確認 OpenRC 正在執行，接著將 `fn-knock` 註冊至 `default` Runlevel 並立即啟動。如果系統只有 `rc-service` 指令，但 `/run/openrc` 不存在，表示目前不是正常開機的 OpenRC 主機；安裝會中止，不會留下只設定一半的服務。

無論使用哪一種 Service Manager，安裝程式都會先偵測是否已安裝 fn-knock：

- 首次安裝時可選擇繼續或退出。
- 已安裝時，可選擇安裝最新版本、開啟管理選單、查看服務狀態或解除安裝。
- 下載正式套件前會檢查所需的 TCP 連接埠。若連接埠已被占用，系統會顯示監聽資訊並進入連接埠設定選單；修改後再繼續安裝。

如果未偵測到已安裝的程式，卻找到舊的 `/etc/fn-knock/fn-knock.env`，安裝程式會明確顯示「殘留連接埠設定」，並提供保留、修改或清除舊設定的選項。選擇「清除舊連接埠設定」只會刪除此環境檔案並還原預設連接埠，不會刪除 `/var/lib/fn-knock` 中的資料或閘道設定。

安裝完成後，在瀏覽器中開啟：

```text
http://<伺服器位址>:7991/
```

依頁面提示設定管理面板密碼。這組密碼只保護管理面板，與存取業務服務時使用的 TOTP、帳號密碼或 Passkey 並不是同一套憑證。

## 預設連接埠

`7999` 是最重要的 Go 閘道入口，負責承接已設定映射的業務流量；它會列在 Linux 連接埠設定選單的第一項。

| 連接埠 | 用途 | 預設監聽範圍 |
| --- | --- | --- |
| `7999` | Go 閘道入口 | 所有網路介面 |
| `7991` | 管理面板 | 所有網路介面 |
| `7998` | Rust 管理後端 | 僅限本機 |
| `7997` | 身分驗證服務 | 僅限本機 |
| `7996` | Go 管理介面 | 僅限本機 |

首次安裝或更新既有安裝時，都可輸入對應編號修改連接埠。儲存前，系統會拒絕重複的連接埠，以及已被其他服務占用的連接埠。

## 管理指令

安裝完成後，使用 `sudo knock` 開啟管理選單。常用的非互動式指令如下：

```bash
sudo knock status
sudo knock restart
sudo knock config
sudo knock update
sudo knock logs
sudo knock reset-panel-password
```

`sudo knock status` 會顯示服務是否已啟用及正在執行、對外監聽連接埠，以及 `server-admin-rs`、`go-reauth-proxy` 兩個核心 Process 的 PID、RSS Memory 與總記憶體用量。

指令會自動使用目前系統的 Service Manager：systemd 使用 `systemctl`，OpenRC 使用 `rc-service`。兩種環境都會顯示服務狀態、對外監聽與核心 Process 記憶體；systemd 還會顯示 Main PID、最近一次 Exit Code 與啟動時間。

查看記錄可使用：

```bash
sudo knock logs
sudo knock logs --follow
```

在 systemd 上，這兩個指令會讀取 `journalctl`；在 OpenRC 上則讀取或持續追蹤 `/var/log/fn-knock.log`。若記錄檔尚未產生，`knock logs` 會顯示提示，不會將其誤判為服務故障。

`sudo knock config` 會顯示依編號排列的連接埠表格；輸入 `1` 至 `5` 修改對應連接埠，輸入 `S` 驗證並儲存，輸入 `R` 還原預設連接埠。服務執行期間保留其目前監聽的連接埠，不會被誤判為衝突。

`sudo knock reset-panel-password` 需要再次確認。它會清除管理面板密碼、所有面板登入工作階段與登入失敗退避記錄；下次存取 `7991` 的實際管理位址時，會重新進入首次設定密碼流程。

## 更新與 Rollback

執行 `sudo knock update` 後，指令會同時顯示本機與線上版本。更新器會依目前架構從固定網址讀取最新版本 Manifest；發布流程會重新整理該網址的 CDN 快取並回讀驗證，因此指令不再為每次檢查附加隨機 Query Parameter。

即使本機與線上版本相同，仍可確認重新下載並部署該版本。新版本啟動後會檢查管理面板的 Health Status；若啟動失敗，系統會還原原版本、管理指令、對應的 systemd Unit 或 OpenRC Service Script，以及原本的服務啟停狀態。

若保留了上一個版本，可執行：

```bash
sudo knock rollback
```

## 資料與備份

預設安裝的主要路徑如下：

| 路徑 | 內容 |
| --- | --- |
| `/opt/fn-knock` | 版本化程式、目前版本連結與保留的 Rollback 版本 |
| `/etc/fn-knock` | 連接埠環境檔與閘道設定 |
| `/var/lib/fn-knock` | SQLite、憑證、金鑰、下載資源與其他應用程式資料 |
| `/var/log/fn-knock.log` | OpenRC 服務記錄；systemd 使用 Journal |

更新或遷移前，請先從維護頁面匯出 `.knock`，再備份 `/etc/fn-knock` 與 `/var/lib/fn-knock`。應用程式封存檔用於移轉可還原的設定，目錄備份則用於保留 SQLite 與平台執行資料；兩者無法互相取代。詳細範圍與還原步驟請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

這些目錄含有身分驗證憑證與私鑰。備份應加密，且只允許 root 或實際維護人員讀取；請勿將完整目錄當成一般記錄附件上傳。

## 反向代理與安全邊界

需要從公網管理時，應優先透過 HTTPS 反向代理提供入口。安裝後執行以下指令可輸出 Nginx 範例：

```bash
sudo knock nginx
```

請在反向代理上啟用 TLS，並限制可信任的來源 IP、VPN 網段或加入額外身分驗證。Linux 執行模式不會修改主機防火牆；只開放業務實際需要的連接埠。管理入口與業務閘道入口的差異請參閱[連接埠與入口](/zh-tw/quick-start/ports-and-entrypoints)。

### 掛載至現有業務網域的子路徑

若雲端伺服器已使用 Nginx 提供 `https://www.example.com`，可以不新增網域或公網連接埠，直接將 fn-knock 管理面板掛載至子路徑。以下範例建議使用 `/fn-knock/`，也可以改為其他未被現有業務占用的路徑。請將設定加入 `www.example.com` 對應的 HTTPS `server {}`：

```nginx
# 自訂路徑時，只需修改下一行中的 /fn-knock
location ~ ^(?<panel_prefix>/fn-knock)(?<panel_uri>/.*)?$ {
    if ($panel_uri = "") {
        return 308 $panel_prefix/$is_args$args;
    }

    include /etc/nginx/snippets/migrated-proxy-headers.conf;

    proxy_http_version 1.1;

    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header X-Forwarded-Prefix $panel_prefix;

    proxy_redirect ~^(/.*)$ $panel_prefix$1;

    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    rewrite ^ $panel_uri break;
    proxy_pass http://127.0.0.1:7991;
}
```

此範例假設管理面板仍使用預設連接埠 `7991`；若安裝時曾修改連接埠，請一併調整 `proxy_pass`。`/etc/nginx/snippets/migrated-proxy-headers.conf` 也必須已存在，並提供目前網站的通用代理請求標頭；若現有網站使用其他共用代理設定，請將 `include` 路徑改為實際檔案。

Nginx 的 `location` 無法直接引用透過 `set` 定義的變數。此範例改用正規表示式命名擷取：`/fn-knock` 只出現一次，並儲存為 `$panel_prefix`，因此改用 `/knock-admin` 等路徑時，只需修改 `location` 這一行。`$panel_uri` 會保留前綴之後的請求路徑，供轉送時移除外部前綴。若同一個 `server` 中還有其他正規表示式 `location`，請將此設定放在可能與其衝突的規則之前。

- 未帶結尾斜線的前綴會以 `308` 重新導向至帶有 `/` 的網址，並保留原有查詢參數。
- `rewrite` 會使用 `$panel_uri`，在轉送至管理面板前移除外部前綴；`X-Forwarded-Prefix` 會告知管理面板對外路徑，`proxy_redirect` 則會將上游傳回的根路徑重新導向改寫回相同前綴。
- `X-Forwarded-Host` 與 `X-Forwarded-Port` 會保留訪客實際使用的網域與連接埠。

儲存設定後，請先檢查語法，再依主機使用的 Service Manager 重新載入 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Alpine Linux 請使用：

```sh
sudo rc-service nginx reload
```

重新載入成功後，範例中的管理面板可透過 `https://www.example.com/fn-knock/` 存取；若修改了建議路徑，存取網址也應使用相同的新前綴。開啟未帶結尾斜線的網址時會自動重新導向。此路徑只代理 `7991` 管理入口，不會取代 `7999` 業務閘道入口。可從公網連線時，仍應為此路徑限制來源 IP、接入 VPN 或加入額外身分驗證。

## 解除安裝

```bash
sudo knock uninstall
```

預設解除安裝只會刪除程式，以及目前 Service Manager 的註冊項目（systemd Unit 或 OpenRC Service Script），並保留 `/etc/fn-knock` 設定與 `/var/lib/fn-knock` 資料。只有明確使用 `--purge`，並在互動式 Terminal 中輸入 `DELETE` 後，才會永久刪除設定與資料。

繼續閱讀：

- [選擇部署與存取方案](/zh-tw/quick-start/deployment-options)
- [連接埠與入口](/zh-tw/quick-start/ports-and-entrypoints)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
