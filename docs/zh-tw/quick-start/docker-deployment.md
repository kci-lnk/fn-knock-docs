---
lang: zh-TW
title: "Docker Compose 部署"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 97365fd9d189e2f5d9f1ad5e1489b3c5c982f21395a8897de030ce841e4085e5
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

## 一鍵安裝

在目標 Linux 主機的 root 終端機中貼上下方整段指令碼。指令碼會檢查 Docker 環境，讀取 IPv6 介面表並確認存在全域 IPv6 位址，然後建立啟用 IPv6 的 bridge、寫入完整 Compose 設定並啟動 fn-knock。

<!--@include: ../../_shared/docker-quick-install.inc-->

安裝目錄為 `/opt/fn-knock-docker`。若其中已有 `.env` 或 `docker-compose.yml`，指令碼會停止且不會覆寫原有設定。

## 完整安裝步驟

### 01 檢查 Docker 環境

需要 Linux 主機、Docker Engine 和 Docker Compose 外掛。

```bash
docker version
docker compose version
```

主機還必須啟用 IPv6，且 `/proc/net/if_inet6` 中至少有一筆 scope 為 `00` 的全域 IPv6 記錄。這個 procfs 虛擬檔案顯示的大小始終為 `0`，因此不要使用 `test -s` 檢查；一鍵安裝指令碼會直接讀取內容判斷。

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
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | Docker bridge 的 IPv4 子網；衝突時改用其他私有 CIDR |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | Docker bridge 的 IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 留空 | 僅當 `7991` 位於可信反向代理後時，填寫代理出口 IP 或 CIDR |
| `DOCKER_DISCOVER_LAN_IP` | 留空 | 僅在第三方反代無法自動識別主機區域網路位址時填寫 |

### 04 建立 `docker-compose.yml`

最新部署只需要一個 `fn-knock` 容器，並繼續使用隔離的 Docker bridge，不使用 `network_mode: host`。下方設定會為 bridge 啟用 IPv6，並將主機 `/proc/net/if_inet6` 唯讀映射進容器，供 DDNS 的「從網卡取得」讀取真實 IPv6 網卡。

<!--@include: ../../_shared/docker-compose.inc-->

### 05 啟動並檢查狀態

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最後一個指令會持續顯示日誌，可按 `Ctrl+C` 結束。

## 首次存取與設定

Compose 只將管理面板與閘道入口映射到主機。`7996`–`7998` 保持容器內部使用，IPv6 網卡資訊則透過唯讀檔案映射提供給 DDNS。

| 連接埠 | 服務 | 暴露範圍 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理後台入口 | 映射到主機 | 首次存取時設定 Docker 管理面板密碼 |
| `7999` | 閘道 / 代理入口 | 映射到主機 | 外部使用者存取代理服務時使用 |
| `7998` | Rust 後端 | 僅容器內部 | 預設不對主機暴露 |
| `7997` | 驗證前端 | 僅容器內部 | 預設不對主機暴露 |
| `7996` | Go 閘道管理 | 僅容器內部 | 預設不對主機暴露 |

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
