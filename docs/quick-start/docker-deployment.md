# Docker Compose 部署

本页使用 fn-knock 官方镜像源和仓库中的 `deploy/docker/compose.remote.yaml`。该文件不含本地构建配置，适合服务器部署；`docker compose up -d` 会在本机没有镜像时自动拉取它。

需要在飞牛 fnOS 上使用全部功能时，改看[飞牛原生应用 FPK 安装与首次配置](/quick-start/install-and-first-login)。

## 前提与边界

- 使用 Linux 宿主机，并已安装 Docker Engine、Docker Compose v2 和 `curl`。
- 宿主机已启用 IPv6，且 `/proc/net/if_inet6` 存在并至少包含一个 IPv6 接口；发布版 Compose 会将这个文件只读映射进容器。
- 宿主机的 `7991`、`7999` 未被其他服务占用，或已准备替代端口。
- 管理入口只应由局域网、VPN 或可信反向代理访问；不要将它直接做公网端口转发。

标准 Compose 只发布管理入口和网关入口。容器内的后端、认证服务和网关内部 gRPC 端口不发布到宿主机。

部署继续使用隔离的 Docker bridge，不使用 `network_mode: host`。Compose 会为 bridge 启用 IPv6，并只读映射宿主机的 IPv6 接口表，让 DDNS 的“从网卡获取”能够列出真实 IPv6 网卡。

| 宿主机端口 | 容器服务 | 用途 |
| --- | --- | --- |
| `7991` | 管理后台 | 首次访问时设置 Docker 管理面板密码 |
| `7999` | 网关入口 | 用户访问映射服务时经过的入口 |
| 不发布 | `7998`、`7997`、`7996` | 管理后端、认证服务和内部 gRPC |

Docker 管理面板密码和 `fn-knock` 为访问者配置的 TOTP、账号密码或 Passkey 是两套凭据。

## 选择镜像源

| 镜像源 | `FN_KNOCK_IMAGE` | 适用网络 |
| --- | --- | --- |
| 官方镜像源 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国大陆网络；`latest` 每 30 分钟同步一次 |
| Docker Hub | `kcilnk/fn-knock:latest` | 可稳定访问 Docker Hub 的网络 |

下文默认使用官方镜像源。需要固定版本时，将 `latest` 改为已发布的固定标签。

## 一键安装

以 root 身份在目标主机终端中粘贴下面整段脚本。脚本会检查 Docker 环境、创建 `/opt/fn-knock-docker`、写入默认配置、拉取镜像并启动服务；若目录中已有 `.env` 或 `docker-compose.yml`，脚本会停止且不会覆盖。

```bash
sh <<'FN_KNOCK_INSTALL'
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this installer in a root terminal." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose is not available." >&2; exit 1; }
[ -s /proc/net/if_inet6 ] || { echo "IPv6 is not enabled or /proc/net/if_inet6 is empty." >&2; exit 1; }

install_dir=/opt/fn-knock-docker
mkdir -p "$install_dir"
cd "$install_dir"

if [ -e .env ] || [ -e docker-compose.yml ]; then
  echo "Existing .env or docker-compose.yml found; installation stopped." >&2
  exit 1
fi

cat > .env <<'FN_KNOCK_ENV'
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
FN_KNOCK_ENV

curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml

docker compose pull
docker compose up -d
docker compose ps
FN_KNOCK_INSTALL
```

安装完成后，按[启动与验证](#启动与验证)检查日志、健康状态和首次访问。需要逐项调整配置时，使用下面的手动步骤。

## 获取发布版 Compose

以 root 身份（或在每条命令前加 `sudo`）建立独立运行目录，并将发布专用 Compose 文件保存为默认文件名：

```bash
install -d -m 0750 /opt/fn-knock-docker
cd /opt/fn-knock-docker
curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

在同一目录创建 `.env`。下面是默认的生产配置；`compose.remote.yaml` 会从该文件读取镜像、端口和网络范围。

```dotenv
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
```

通常只需要修改 `FN_KNOCK_IMAGE`、`ADMIN_VIEW_PORT`、`GO_REPROXY_PORT` 和时区。`BACKEND_PORT`、`AUTH_PORT`、`GO_BACKEND_PORT` 是容器内部组件端口，通常保持默认。Compose 默认使用 IPv4 `172.30.0.0/16` 和 IPv6 `fd42:fb33:7f7a:100::/64`；只有与现有 Docker 网络、VPN 或宿主机路由重叠时，才改为未占用的私有网段。不要为了部署额外添加 Redis 容器或 `REDIS_*` 环境变量，当前发布镜像使用 SQLite。

下载的 Compose 已包含下面这组关键配置，请保留。它不会共享整个宿主机网络，只会把 IPv6 接口表映射为只读文件：

```yaml
services:
  fn-knock:
    environment:
      DDNS_HOST_IF_INET6_PATH: /host/proc/net/if_inet6
    volumes:
      - type: bind
        source: /proc/net/if_inet6
        target: /host/proc/net/if_inet6
        read_only: true
    networks:
      - fn_knock_net

networks:
  fn_knock_net:
    enable_ipv6: true
```

宿主机没有 `/proc/net/if_inet6` 或该文件为空时，应先在宿主机启用 IPv6，而不是删除这项映射。可用 `test -s /proc/net/if_inet6 && cat /proc/net/if_inet6` 检查。

如果管理入口必须经过公网反向代理，将代理节点的出口 IP 或 CIDR 写入 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`，并让代理传递 `X-Forwarded-For` 或 `X-Real-IP`。不要把 `0.0.0.0/0` 写入可信代理列表。

`DOCKER_DISCOVER_LAN_IP` 只在第三方反向代理无法自动识别 Docker 宿主机局域网地址时作为兜底；正常情况下保持为空。

## 启动与验证

```bash
cd /opt/fn-knock-docker
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

`docker compose config` 应能输出完整配置，`docker compose ps` 中 `fn-knock` 应为运行状态。管理服务健康检查可在宿主机执行：

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

然后从局域网打开：

```text
http://<宿主机局域网地址>:<ADMIN_VIEW_PORT>/
```

`<ADMIN_VIEW_PORT>` 是 `.env` 中的实际管理端口，默认值为 `7991`。按页面提示设置 Docker 管理面板密码，再进入 `fn-knock` 管理后台配置模式、认证和映射。对外服务应进入 `.env` 中 `GO_REPROXY_PORT` 指定的网关端口，默认值为 `7999`；完成映射后，用移动网络等真实外部链路验证，而不是只在宿主机上访问 `127.0.0.1`。

## 数据、备份与恢复入口

Compose 创建两个持久化卷：

| 逻辑卷 | 内容 |
| --- | --- |
| `fn_knock_gateway` | 网关配置和 SQLite 数据库 |
| `fn_knock_data` | secret、备份、FRP / Cloudflared 等运行数据 |

重建容器不会清空这两个卷，但删除卷会。更新或迁移前先导出应用备份，并将两个卷纳入宿主机备份；其中可能含有凭据和密钥，归档不能放在对外可读的目录。

`.knock` 归档和卷备份解决的是不同问题：前者用于恢复可迁移的应用配置，后者保留 SQLite、下载资源和容器运行数据。归档内容、版本限制与恢复验收见[备份、恢复与数据清理](/guide/backup-and-restore)。

如果遗忘的是 Docker 管理面板密码，而不是访问者登录凭据，可执行：

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

该命令只清除管理面板密码、面板登录会话和密码输错后的退避状态，不会删除业务配置、反代规则、证书、白名单、日志或数据卷。执行完成后，下次访问管理入口会重新进入首次设置密码流程。

### 从旧 Redis 迁移

此步骤只适用于旧 Compose 中仍有 Redis、且需要保留旧数据的升级。全新安装不要添加 Redis，也不需要执行迁移。

先备份旧 Redis 和两个持久化卷。确保旧 Redis 服务与当前 `fn-knock` 容器仍在同一个 Compose 网络中，再执行：

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

命令成功后会删除 Redis 中的 `fn_knock:*` 键，避免旧数据再次被读取。因此必须先备份，并在移除 Redis 或切换到当前 Compose 前确认管理后台和 SQLite 数据均正常。仅在明确要覆盖已有 SQLite 数据时才追加 `--force`。

## Docker 版的能力限制

| 能力 | Docker Compose 中的处理方式 |
| --- | --- |
| 应用内 FPK 更新 | 不支持；通过 Compose 拉取并重建镜像 |
| 直连模式、宿主机防火墙管理、智能连接 | 不可用；容器不能安全接管宿主机网络策略 |
| Web 终端、SSH 安全 | 不可用；它们依赖宿主机终端或 SSH 日志 |
| 自动 HTTPS | 标准 Compose 未发布宿主机 `80` 端口；使用上游反代/证书方案，或手动规划端口与证书 |

这些限制不会阻止子域模式或反代模式使用网关。对 Docker 部署，优先选择不依赖宿主机防火墙放行的模式。

## 更新发布镜像

使用 `latest` 时：

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

若 `.env` 固定了版本标签，先把 `FN_KNOCK_IMAGE` 改为目标版本，再执行同一组命令。更新完成后，检查管理后台、网关入口、证书以及正在使用的隧道；公网验证必须从外部网络完成。

继续阅读：

- [端口、入口与访问路径](/quick-start/ports-and-entrypoints)
- [选择访问方案](/quick-start/run-modes)
- [备份、恢复与数据清理](/guide/backup-and-restore)
- [控制台与系统更新](/guide/dashboard-and-update)
