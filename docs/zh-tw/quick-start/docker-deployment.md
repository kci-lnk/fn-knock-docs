---
lang: zh-TW
title: "Docker Compose 部署"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5dbe558d2335cf9dd862fa1a6258676286d0409d9d7c3351c3025ae79cd554aa
---

# Docker Compose 部署

選擇適合目前網路的映像來源，使用完整的 Compose 設定，即可在 Linux 主機或基於 Linux 的 NAS 上執行 fn-knock。

[查看原始 Docker Hub 頁面](https://hub.docker.com/r/kcilnk/fn-knock)

## 映像來源

| 映像來源 | 映像位址 | 適用網路 |
| --- | --- | --- |
| 官方映像源 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中國大陸網路；`latest` 每 30 分鐘同步一次 |
| Docker Hub | `kcilnk/fn-knock:latest` | 可穩定存取 Docker Hub 的網路 |

下方預設使用官方映像源。切換來源時，只需將拉取指令和 `.env` 中的 `FN_KNOCK_IMAGE` 換成對應位址；如需鎖定版本，可將 `latest` 改為已發布的固定標籤。

## 網路模式

| 網路模式 | 建議程度 | 說明 |
| --- | --- | --- |
| HOST 網路 | 建議、預設 | 容器直接使用主機網路，可識別真實網卡與 IPv6 |
| 橋接網路 | 可選 | 使用隔離的雙棧 bridge 並映射連接埠，但 DDNS 可能找不到主機網卡或 IPv6 |

需要使用 DDNS「從網卡取得」或依賴主機 IPv6 時，請使用 HOST 網路。橋接網路適合更重視網路隔離、且不依賴主機網卡識別的部署。

## 一鍵安裝

在目標 Linux 主機的 root 終端機中貼上下方整段指令碼。指令碼預設使用建議的 HOST 網路，寫入完整 Compose 設定並啟動 fn-knock。

<!--@include: ../../_shared/docker-quick-install.inc-->

安裝目錄為 `/opt/fn-knock-docker`。若其中已有 `.env` 或 `docker-compose.yml`，指令碼會停止且不會覆寫原有設定。

## 完整安裝步驟

### 01 檢查 Docker 環境

需要 Linux 主機、Docker Engine 和 Docker Compose 外掛。

```bash
docker version
docker compose version
```

下方預設使用 HOST 網路。此模式不宣告 `ports` 或自訂 bridge，服務直接監聽主機連接埠。

### 02 準備目錄並拉取映像

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 建立 `.env`

將以下內容儲存為 `/opt/fn-knock-docker/.env`：

<!--@include: ../../_shared/docker-env.inc-->

重要設定：

| 設定項目 | 預設值 | 說明 |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 預設跟隨 `latest`；可改為 Docker Hub 位址或固定版本標籤 |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | 管理面板與閘道入口的主機連接埠 |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | 僅橋接網路使用；衝突時改用其他私有 CIDR |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | 僅橋接網路使用；Docker bridge 的 IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 留空 | 僅當 `7991` 位於可信反向代理後時，填寫代理出口 IP 或 CIDR |
| `DOCKER_DISCOVER_LAN_IP` | 留空 | 僅在第三方反代無法自動識別主機區域網路位址時填寫 |

### 04 建立 `docker-compose.yml`

建議設定只需要一個 `fn-knock` 容器，並使用 HOST 網路直接存取主機的真實網卡與 IPv6：

<!--@include: ../../_shared/docker-compose.inc-->

#### 可選：切換到橋接網路

橋接網路可能使 DDNS 找不到主機網卡或 IPv6。確認部署不依賴「從網卡取得」後，將 `.env` 替換為：

<!--@include: ../../_shared/docker-env-bridge.inc-->

並將 `docker-compose.yml` 替換為：

<!--@include: ../../_shared/docker-compose-bridge.inc-->

### 05 啟動並檢查狀態

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最後一個指令會持續顯示日誌，可按 `Ctrl+C` 結束。

## 首次存取與設定

預設 HOST 網路直接使用主機網路命名空間。管理面板監聽 `7991`，閘道入口監聽 `7999`，其餘服務保持內部或主機 Loopback 存取。

| 連接埠 | 服務 | 暴露範圍 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理後台入口 | HOST 網路 | 首次存取時設定 Docker 管理面板密碼 |
| `7999` | 閘道 / 代理入口 | HOST 網路 | 外部使用者存取代理服務時使用 |
| `7998` | Rust 後端 | 主機 Loopback / 內部 | 通常維持預設值 |
| `7997` | 驗證前端 | 主機 Loopback / 內部 | 通常維持預設值 |
| `7996` | Go 閘道管理 | 主機 Loopback / 內部 | 通常維持預設值 |

1. 開啟 `http://<主機IP>:7991`，設定 Docker 管理面板密碼並登入。
2. 在管理後台完成反向代理、子網域、憑證和驗證設定。
3. 讓外部業務流量存取 `7999` 對應的閘道入口。
4. 如果 `7991` 位於可信反向代理後，請在 `.env` 設定 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`。
5. 僅當第三方反代無法自動識別主機區域網路位址時，才設定 `DOCKER_DISCOVER_LAN_IP`。

## 更新至最新映像

保持 `.env` 中的 `latest`，然後重新拉取並建立容器。持久化磁碟區不會被刪除。

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## 使用 Watchtower 自動更新

當 `.env` 使用 `latest` 時，可以在同一台 Docker 主機上執行 Watchtower。預設情況下，它每 24 小時檢查所有執行中的容器；發現同一映像標籤的摘要發生變化後，會拉取新映像並使用原有設定重新建立容器。fn-knock 的掛載磁碟區會保留，但更新過程會造成短暫重新啟動。固定版本標籤不會自動跨標籤升級。

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  nickfedor/watchtower
```

確認 Watchtower 已啟動並查看檢查記錄：

```bash
docker ps --filter name=watchtower
docker logs watchtower
```

> 此基礎設定預設管理主機上的所有執行中容器，並透過 Docker Socket 取得管理 Docker 的高權限。僅在可信任的主機上使用；啟用前請先備份 fn-knock 資料。如果其他容器不應自動更新，請先依照 [Watchtower 官方文件](https://watchtower.nickfedor.com/)使用容器名稱、標籤或 Scope 限制更新範圍。

## 重設管理面板密碼

忘記密碼時，請登入執行 Docker 的主機並執行：

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

再次存取 `7991` 時會重新進入首次設定密碼流程。此指令只會清除管理面板密碼、登入工作階段和密碼輸入錯誤後的退避狀態，不會刪除業務設定、反向代理規則、憑證、白名單、日誌或資料磁碟區。

## 繼續閱讀

- [連接埠、入口與存取路徑](/zh-tw/quick-start/ports-and-entrypoints)
- [選擇存取模式](/zh-tw/quick-start/run-modes)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
- [控制台與系統更新](/zh-tw/guide/dashboard-and-update)
