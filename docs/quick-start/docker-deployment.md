# Docker Compose 部署

选择适合当前网络的镜像来源，使用完整的 Compose 配置，即可在 Linux 主机或基于 Linux 的 NAS 上运行 fn-knock。

[查看原始 Docker Hub 页面](https://hub.docker.com/r/kcilnk/fn-knock)

## 镜像源

| 镜像源 | 镜像地址 | 适用网络 |
| --- | --- | --- |
| 官方镜像源 | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国大陆网络；`latest` 每 30 分钟同步一次 |
| Docker Hub | `kcilnk/fn-knock:latest` | 可稳定访问 Docker Hub 的网络 |

下文默认使用官方镜像源。切换镜像源时，只需把拉取命令和 `.env` 中的 `FN_KNOCK_IMAGE` 换成对应地址；如需锁定版本，可将 `latest` 改为已发布的固定标签。

## 一键安装

在目标 Linux 主机的 root 终端中粘贴下面整段脚本。脚本会检查 Docker 环境，读取 IPv6 接口表并确认存在全局 IPv6 地址，然后创建启用 IPv6 的 bridge、写入完整 Compose 配置并启动 fn-knock。

<!--@include: ../_shared/docker-quick-install.inc-->

安装目录为 `/opt/fn-knock-docker`。若其中已经存在 `.env` 或 `docker-compose.yml`，脚本会停止且不会覆盖原配置。

## 完整安装步骤

### 01 检查 Docker 环境

需要 Linux 宿主机、Docker Engine 和 Docker Compose 插件。

```bash
docker version
docker compose version
```

宿主机还必须启用 IPv6，并且 `/proc/net/if_inet6` 中至少有一条 scope 为 `00` 的全局 IPv6 记录。这个 procfs 虚拟文件显示的大小始终为 `0`，因此不要使用 `test -s` 检查；一键安装脚本会直接读取内容判断。

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
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | Docker bridge 的 IPv4 子网；冲突时改为其他私网 CIDR |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | Docker bridge 的 IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 留空 | 仅当 `7991` 位于可信反向代理后时，填写代理出口 IP 或 CIDR |
| `DOCKER_DISCOVER_LAN_IP` | 留空 | 仅在第三方反代无法自动识别宿主机局域网地址时填写 |

### 04 创建 `docker-compose.yml`

最新部署只需要一个 `fn-knock` 容器，并继续使用隔离的 Docker bridge，不使用 `network_mode: host`。下面的配置会为 bridge 启用 IPv6，并把宿主机 `/proc/net/if_inet6` 只读映射进容器，供 DDNS 的“从网卡获取”读取真实 IPv6 网卡。

<!--@include: ../_shared/docker-compose.inc-->

### 05 启动并检查状态

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最后一条命令会持续显示日志，可按 `Ctrl+C` 退出。

## 首次访问与配置

Compose 只向宿主机映射管理面板与网关入口。`7996`–`7998` 保持容器内部使用，IPv6 网卡信息则通过只读文件映射提供给 DDNS。

| 端口 | 服务 | 暴露范围 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理后台入口 | 映射到宿主机 | 首次访问时设置 Docker 管理面板密码 |
| `7999` | 网关 / 代理入口 | 映射到宿主机 | 外部用户访问代理服务时使用 |
| `7998` | Rust 后端 | 仅容器内部 | 默认不对宿主机暴露 |
| `7997` | 认证前端 | 仅容器内部 | 默认不对宿主机暴露 |
| `7996` | Go 网关管理 | 仅容器内部 | 默认不对宿主机暴露 |

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
