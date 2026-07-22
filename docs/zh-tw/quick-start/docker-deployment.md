---
lang: zh-TW
title: "Docker Compose 部署"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: efd17576c9922af7b163e51a729df52d857eb01e58e179275383dbb565311a9e
---

# Docker Compose 部署

本頁使用已發布的 `kcilnk/fn-knock` Image，以及儲存庫中的 `deploy/docker/compose.remote.yaml`。此檔案不含本機建置設定，適合部署在伺服器上；執行 `docker compose up -d` 時，若本機尚無 Image，Docker 會自動拉取。

若要在 fnOS 上使用完整功能，請改看 [fnOS 原生 FPK 安裝與初始設定](/zh-tw/quick-start/install-and-first-login)。

## 前置需求與限制

- 已安裝 Docker Engine 與 Docker Compose v2。
- 主機的 `7991`、`7999` 尚未被其他服務占用，或已規劃替代連接埠。
- 管理入口只應開放給區域網路、VPN 或可信任的反向代理；請勿直接將其連接埠轉送至公網。

標準 Compose 只會發布管理入口與閘道入口。Container 內的後端、身分驗證服務與閘道內部 gRPC 連接埠不會發布到主機。

| 主機連接埠 | Container 服務 | 用途 |
| --- | --- | --- |
| `7991` | 管理後台 | 首次存取時設定 Docker 管理面板密碼 |
| `7999` | 閘道入口 | 使用者存取映射服務時經過的入口 |
| 不發布 | `7998`、`7997`、`7996` | 管理後端、身分驗證服務與內部 gRPC |

Docker 管理面板密碼，與 `fn-knock` 為訪客設定的 TOTP、帳號密碼或 Passkey，是兩套不同的憑證。

## 取得正式版 Compose

請以 root 身分（或在每行指令前加上 `sudo`）建立獨立的執行目錄，並將發布專用的 Compose 檔案儲存為預設檔名：

```bash
install -d -m 0750 /opt/fn-knock
cd /opt/fn-knock
curl -fsSLo compose.yaml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

在同一個目錄中建立 `.env`。以下是預設的正式環境設定；`compose.remote.yaml` 會從此檔案讀取 Image、連接埠與網段。

```dotenv
FN_KNOCK_IMAGE=kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
GO_REPROXY_PORT=7999
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
```

通常只需要修改 `ADMIN_VIEW_PORT`、`GO_REPROXY_PORT` 與時區。Compose 預設使用 IPv4 `172.30.0.0/16` 和 IPv6 `fd42:fb33:7f7a:100::/64`；只有當它們與既有 Docker Network、VPN 或主機路由重疊時，才需要在 `.env` 中加入 `FN_KNOCK_DOCKER_IPV4_SUBNET`、`FN_KNOCK_DOCKER_IPV6_SUBNET`，並改成尚未占用的私有網段。請勿為了部署額外加入 Redis Container 或 `REDIS_*` 環境變數；目前的正式 Image 使用 SQLite。

如果管理入口必須經由公網反向代理，請將 Proxy 節點的出口 IP 或 CIDR 填入 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`，並讓 Proxy 傳遞 `X-Forwarded-For` 或 `X-Real-IP`。請勿將 `0.0.0.0/0` 加入可信任 Proxy 清單。

## 啟動與驗證

```bash
cd /opt/fn-knock
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

`docker compose config` 應能輸出完整設定，且 `docker compose ps` 中的 `fn-knock` 應為執行中。可在主機上執行以下指令，檢查管理服務的 Health Check：

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

接著從區域網路開啟：

```text
http://<主機區域網路位址>:<ADMIN_VIEW_PORT>/
```

`<ADMIN_VIEW_PORT>` 是 `.env` 中實際設定的管理連接埠，預設值為 `7991`。依頁面提示設定 Docker 管理面板密碼，再進入 `fn-knock` 管理後台設定模式、身分驗證與映射。對外服務應進入 `.env` 中 `GO_REPROXY_PORT` 指定的閘道連接埠，預設值為 `7999`；完成映射後，請使用行動網路等真正的外部連線驗證，不要只在主機上存取 `127.0.0.1`。

## 資料、備份與救援入口

Compose 會建立兩個持久化 Volume：

| Volume | 內容 |
| --- | --- |
| `fn_knock_gateway` | 閘道設定與 SQLite 資料庫 |
| `fn_knock_data` | Secret、備份、FRP / Cloudflared 等執行資料 |

重建 Container 不會清空這兩個 Volume，但刪除 Volume 會。更新或遷移前，請先匯出應用程式備份，並將兩個 Volume 納入主機備份；其中可能包含憑證與金鑰，因此封存檔不得放在可公開讀取的目錄。

`.knock` 封存檔與 Volume 備份解決的是不同問題：前者用於還原可移轉的應用程式設定，後者則保留 SQLite、下載資源與 Container 執行資料。封存內容、版本限制與還原驗收方式請參閱[備份、還原與資料清理](/zh-tw/guide/backup-and-restore)。

如果忘記的是 Docker 管理面板密碼，而不是訪客登入憑證，可在執行目錄中執行：

```bash
docker compose exec fn-knock \
  fn-knock-reset-panel-password
```

### 從舊版 Redis 遷移

此步驟只適用於舊版 Compose 中仍有 Redis，且升級時需要保留舊資料的環境。全新安裝請勿加入 Redis，也不需要執行遷移。

請先備份舊 Redis 與兩個持久化 Volume。確認舊 Redis 服務和目前的 `fn-knock` Container 仍位於同一個 Compose Network，再執行：

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

指令成功後會刪除 Redis 中的 `fn_knock:*` Key，避免舊資料再次被讀取。因此務必先完成備份，並在移除 Redis 或切換至目前版本的 Compose 前，確認管理後台及 SQLite 資料均正常。只有在明確需要覆寫既有 SQLite 資料時，才加上 `--force`。

## Docker 版本的功能限制

| 功能 | Docker Compose 中的處理方式 |
| --- | --- |
| 應用程式內 FPK 更新 | 不支援；透過 Compose 拉取並重建 Image |
| 直連模式、主機防火牆管理、智慧連線 | 無法使用；Container 無法安全接管主機網路原則 |
| Web Terminal、SSH 安全性 | 無法使用；這些功能仰賴主機 Terminal 或 SSH 記錄 |
| 自動 HTTPS | 標準 Compose 未發布主機的 `80` 連接埠；請使用上游反向代理／憑證方案，或自行規劃連接埠與憑證 |

這些限制不會妨礙子網域模式或反向代理模式使用閘道。Docker 部署應優先選擇不依賴主機防火牆放行的模式。

## 更新正式版 Image

使用 `latest` 時：

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

如果 `.env` 固定了版本 Tag，請先將 `FN_KNOCK_IMAGE` 改成目標版本，再執行同一組指令。更新完成後，請檢查管理後台、閘道入口、憑證及正在使用的 Tunnel；公網驗證務必從外部網路執行。

繼續閱讀：

- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
- [選擇存取方案](/zh-tw/quick-start/run-modes)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
