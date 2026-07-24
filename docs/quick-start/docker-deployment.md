# Docker Compose 部署

选择适合当前网络的镜像来源，使用完整的 Compose 配置，即可在 Linux 主机或基于 Linux 的 NAS 上运行 fn-knock。

[查看原始 Docker Hub 页面](https://hub.docker.com/r/kcilnk/fn-knock)

## 镜像源

| 镜像源 | 镜像地址 | 适用网络 |
| --- | --- | --- |
| 官方镜像源 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国大陆网络；`latest` 每 30 分钟同步一次 |
| Docker Hub | `kcilnk/fn-knock:latest` | 可稳定访问 Docker Hub 的网络 |

下文默认使用官方镜像源。切换镜像源时，只需把拉取命令和 `.env` 中的 `FN_KNOCK_IMAGE` 换成对应地址；如需锁定版本，可将 `latest` 改为已发布的固定标签。

## 网络模式

| 网络模式 | 推荐程度 | 说明 |
| --- | --- | --- |
| HOST 网络 | 推荐、默认 | 容器直接使用宿主机网络，可识别真实网卡与 IPv6 |
| 桥接网络 | 可选 | 使用隔离的双栈 bridge 并映射端口，但 DDNS 可能找不到宿主机网卡或 IPv6 |

需要使用 DDNS“从网卡获取”或依赖宿主机 IPv6 时，请使用 HOST 网络。桥接网络适合更看重网络隔离、并且不依赖宿主机网卡识别的部署。

## 一键安装

在目标 Linux 主机的 root 终端中粘贴下面整段脚本。脚本默认使用推荐的 HOST 网络，写入完整 Compose 配置并启动 fn-knock。

<!--@include: ../_shared/docker-quick-install.inc-->

安装目录为 `/opt/fn-knock-docker`。若其中已经存在 `.env` 或 `docker-compose.yml`，脚本会停止且不会覆盖原配置。

## 完整安装步骤

### 01 检查 Docker 环境

需要 Linux 宿主机、Docker Engine 和 Docker Compose 插件。

```bash
docker version
docker compose version
```

下文默认使用 HOST 网络。它不会声明 `ports` 或自定义 bridge，服务直接监听宿主机端口。

### 02 准备目录并拉取镜像

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 创建 `.env`

将以下内容保存为 `/opt/fn-knock-docker/.env`：

<!--@include: ../_shared/docker-env.inc-->

关键配置：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 默认跟随 `latest`；可改为 Docker Hub 地址或固定版本标签 |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | 管理面板和网关入口的宿主机端口 |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | 仅桥接网络使用；冲突时改为其他私网 CIDR |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | 仅桥接网络使用；Docker bridge 的 IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 留空 | 仅当 `7991` 位于可信反向代理后时，填写代理出口 IP 或 CIDR |
| `DOCKER_DISCOVER_LAN_IP` | 留空 | 仅在第三方反代无法自动识别宿主机局域网地址时填写 |

### 04 创建 `docker-compose.yml`

推荐配置只需要一个 `fn-knock` 容器，并使用 HOST 网络直接访问宿主机的真实网卡与 IPv6：

<!--@include: ../_shared/docker-compose.inc-->

#### 可选：切换到桥接网络

桥接网络可能导致 DDNS 找不到宿主机网卡或 IPv6。确认业务不依赖“从网卡获取”后，将 `.env` 替换为：

<!--@include: ../_shared/docker-env-bridge.inc-->

并将 `docker-compose.yml` 替换为：

<!--@include: ../_shared/docker-compose-bridge.inc-->

### 05 启动并检查状态

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最后一条命令会持续显示日志，可按 `Ctrl+C` 退出。

## 首次访问与配置

默认 HOST 网络直接使用宿主机网络命名空间。管理面板监听 `7991`，网关入口监听 `7999`，其余服务保持内部或宿主机回环访问。

| 端口 | 服务 | 暴露范围 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理后台入口 | HOST 网络 | 首次访问时设置 Docker 管理面板密码 |
| `7999` | 网关 / 代理入口 | HOST 网络 | 外部用户访问代理服务时使用 |
| `7998` | Rust 后端 | 宿主机回环 / 内部 | 通常保持默认值 |
| `7997` | 认证前端 | 宿主机回环 / 内部 | 通常保持默认值 |
| `7996` | Go 网关管理 | 宿主机回环 / 内部 | 通常保持默认值 |

1. 打开 `http://<宿主机IP>:7991`，设置 Docker 管理面板密码并登录。
2. 在管理后台完成反向代理、子域名、证书和鉴权配置。
3. 让外部业务流量访问 `7999` 对应的网关入口。
4. 如果 `7991` 位于可信反向代理后，请在 `.env` 设置 `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS`。
5. 仅当第三方反代无法自动识别宿主机局域网地址时，才设置 `DOCKER_DISCOVER_LAN_IP`。

## 更新到最新镜像

保持 `.env` 中的 `latest`，然后重新拉取并创建容器。持久化卷不会被删除。

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## 使用 Watchtower 自动更新

当 `.env` 使用 `latest` 时，可以在同一台 Docker 主机上运行 Watchtower。默认情况下，它每 24 小时检查所有正在运行的容器；发现同一镜像标签的摘要发生变化后，会拉取新镜像并使用原配置重新创建容器。fn-knock 的挂载卷会保留，但更新过程会造成短暂重启。固定版本标签不会自动跨标签升级。

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  nickfedor/watchtower --cleanup
```

`--cleanup` 会在容器成功更新后删除已被替换的旧镜像。若不添加此参数，Watchtower 默认不清理旧镜像，更新后可能留下仓库和标签显示为 `<none>` 的悬空镜像；此参数不会删除 fn-knock 的具名数据卷。

确认 Watchtower 已启动并查看检查记录：

```bash
docker ps --filter name=watchtower
docker logs watchtower
```

> 此基础配置默认管理主机上的所有运行中容器，并通过 Docker Socket 获得管理 Docker 的高权限。仅在可信主机上使用；启用前先备份 fn-knock 数据。如果其他容器不应自动更新，请先按 [Watchtower 官方文档](https://watchtower.nickfedor.com/) 使用容器名称、标签或 Scope 限制更新范围。

## 重设管理面板密码

忘记密码时，登录运行 Docker 的主机并执行：

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

再次访问 `7991` 时会重新进入首次设置密码流程。此命令只清除管理面板密码、登录会话和密码输错后的退避状态，不会删除业务配置、反代规则、证书、白名单、日志或数据卷。

## 继续阅读

- [端口、入口与访问路径](/quick-start/ports-and-entrypoints)
- [选择访问方案](/quick-start/run-modes)
- [备份、恢复与数据清理](/guide/backup-and-restore)
- [控制台与系统更新](/guide/dashboard-and-update)
