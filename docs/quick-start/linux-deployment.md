# Linux 部署（systemd / OpenRC）

本页适用于普通 Linux 主机。安装包支持 `amd64`、`arm64` 和 `armv7`，可运行在 systemd 发行版以及 Alpine Linux 的 OpenRC 上。主机需要 root 权限，并且 systemd 或 OpenRC 必须已经正常启动；没有 init 系统的精简容器不适用这个主机安装器，应改用 [Docker 部署](/quick-start/docker-deployment)。

安装器会按需安装 `curl`、`openssl`、`tar`、`unzip`、`gzip` 与端口检测工具；在 Alpine 上还会通过 `apk` 安装运行所需的 Bash 和依赖。

Linux 版会在 `7991` 提供管理面板，在 `7999` 提供 Go 网关入口。管理面板应只通过局域网、VPN 或受访问控制的 HTTPS 反向代理访问；不要直接将它映射到公网。

## 安装

### systemd 发行版

在终端执行：

```bash
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo bash
```

### Alpine Linux（OpenRC）

使用 `sh` 启动安装器，避免首次安装前系统尚未安装 Bash：

```sh
curl -fsSL https://cdn.fnknock.cn/install.sh | sudo sh
```

安装器会确认 OpenRC 正在运行，然后把 `fn-knock` 注册到 `default` 运行级别并立即启动。若只有 `rc-service` 命令、但 `/run/openrc` 不存在，说明当前不是正常引导的 OpenRC 主机，安装会停止而不会留下半配置的服务。

无论使用哪种服务管理器，安装器都会先检测是否已有 fn-knock：

- 首次安装可继续安装或退出。
- 已安装时可选择安装最新版本、打开管理菜单、查看服务状态或卸载。
- 下载发布包前会检查所需 TCP 端口。端口被占用时，会显示监听信息并进入端口配置菜单；修改后再继续安装。

如果未检测到已安装程序、但发现旧的 `/etc/fn-knock/fn-knock.env`，安装器会明确显示“残留端口配置”，并提供保留、修改或清除旧端口配置的选项。选择“清除旧端口配置”只删除该环境文件并恢复端口默认值，不会删除 `/var/lib/fn-knock` 中的数据或网关配置。

安装完成后，在浏览器打开：

```text
http://<服务器地址>:7991/
```

按页面提示设置管理面板密码。这个密码只保护管理面板，与访问业务服务的 TOTP、账号密码或 Passkey 不是同一套凭据。

## 默认端口

`7999` 是最重要的 Go 网关入口，承接已配置映射的业务流量；它排在 Linux 端口配置菜单的第一项。

| 端口 | 用途 | 默认监听范围 |
| --- | --- | --- |
| `7999` | Go 网关入口 | 所有网卡 |
| `7991` | 管理面板 | 所有网卡 |
| `7998` | Rust 管理后端 | 仅本机 |
| `7997` | 认证服务 | 仅本机 |
| `7996` | Go 管理接口 | 仅本机 |

首次安装或更新已有安装时，都可输入对应编号修改端口。保存前会拒绝重复端口和已被其他服务占用的端口。

## 管理命令

安装完成后使用 `sudo knock` 打开管理菜单。常用的非交互命令如下：

```bash
sudo knock status
sudo knock restart
sudo knock config
sudo knock update
sudo knock logs
sudo knock reset-panel-password
```

`sudo knock status` 会显示服务是否已启用和正在运行、对外监听端口，以及 `server-admin-rs`、`go-reauth-proxy` 两个核心进程的 PID、RSS 内存和合计内存。

命令会自动使用当前系统的服务管理器：systemd 使用 `systemctl`，OpenRC 使用 `rc-service`。两种环境都会显示服务状态、对外监听和核心进程内存；systemd 额外显示主 PID、最近退出码和启动时间。

查看日志可使用：

```bash
sudo knock logs
sudo knock logs --follow
```

在 systemd 上，这两个命令读取 `journalctl`；在 OpenRC 上读取或跟随 `/var/log/fn-knock.log`。日志文件尚未产生时，`knock logs` 会给出提示而不是将其当成服务故障。

`sudo knock config` 显示按编号排列的端口表；输入 `1` 到 `5` 修改对应端口，输入 `S` 校验并保存，输入 `R` 恢复默认端口。服务运行时保留其当前监听端口不会被误判为冲突。

`sudo knock reset-panel-password` 需要确认。它会清除管理面板密码、全部面板登录会话和登录失败退避记录；下次访问 `7991` 的实际管理地址时会重新进入首次设置密码流程。

## 更新与回滚

执行 `sudo knock update` 后，命令会同时显示本地和线上版本。更新器按当前架构读取固定地址的最新版本清单；发布流程会刷新该地址的 CDN 缓存并回读校验，因此命令不再为每次检查拼接随机查询参数。

即使本地版本与线上版本相同，仍可确认重新下载并部署该版本。新版本启动后会检查管理面板健康状态；启动失败时会恢复原有版本、管理命令、对应的 systemd 单元或 OpenRC 服务脚本，以及服务启停状态。

若有上一版本，可运行：

```bash
sudo knock rollback
```

## 数据与备份

默认安装的主要路径为：

| 路径 | 内容 |
| --- | --- |
| `/opt/fn-knock` | 版本化程序、当前版本链接和保留的回滚版本 |
| `/etc/fn-knock` | 端口环境文件和网关配置 |
| `/var/lib/fn-knock` | SQLite、证书、密钥、下载资源及其他应用数据 |
| `/var/log/fn-knock.log` | OpenRC 服务日志；systemd 使用 journal |

更新或迁移前先在维护页导出 `.knock`，再备份 `/etc/fn-knock` 与 `/var/lib/fn-knock`。应用归档用于迁移可恢复配置，目录备份用于保留 SQLite 和平台运行数据；任何一层都不能代替另一层。详细范围和恢复步骤见[备份、恢复与数据清理](/guide/backup-and-restore)。

这些目录包含认证凭据和私钥。备份应加密，并保持仅 root 或实际维护人员可读；不要把完整目录作为普通日志附件上传。

## 反向代理与安全边界

需要公网管理时，优先通过 HTTPS 反向代理提供入口。安装后运行下面的命令可输出 Nginx 示例：

```bash
sudo knock nginx
```

在反向代理上启用 TLS，并限制可信来源 IP、VPN 网段或额外认证。Linux 运行模式不会修改主机防火墙；只开放业务实际需要的端口。管理入口和业务网关入口的区别见[端口与入口](/quick-start/ports-and-entrypoints)。

### 挂载到现有业务域名的子路径

云服务器已经使用 Nginx 提供 `https://www.example.com` 时，可以不新增域名或公网端口，而是把 fn-knock 管理面板挂载到一个子路径。以下示例建议使用 `/fn-knock/`，也可以改成其他未被现有业务占用的路径。将配置加入 `www.example.com` 对应的 HTTPS `server {}`：

```nginx
# 自定义路径时，只需修改下一行中的 /fn-knock
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

这个示例假定管理面板仍使用默认端口 `7991`；如果安装时修改过端口，应同步修改 `proxy_pass`。`/etc/nginx/snippets/migrated-proxy-headers.conf` 也必须已经存在并提供当前站点的通用代理请求头；若现有站点使用其他公共代理配置，请把 `include` 路径改为实际文件。

Nginx 的 `location` 不能直接引用通过 `set` 定义的变量。这个示例改用正则命名捕获：`/fn-knock` 只出现一次，并保存为 `$panel_prefix`，所以改用 `/knock-admin` 等路径时只需修改 `location` 这一行。`$panel_uri` 保存前缀之后的请求路径，供转发时移除外部前缀。若同一个 `server` 中还有其他正则 `location`，请把这段配置放在可能与它冲突的规则之前。

- 不带尾斜杠的前缀会以 `308` 重定向到带 `/` 的地址，并保留原查询参数。
- `rewrite` 使用 `$panel_uri` 在转发到管理面板前移除外部前缀；`X-Forwarded-Prefix` 告知管理面板对外路径，`proxy_redirect` 则把上游返回的根路径重定向改写回相同前缀。
- `X-Forwarded-Host` 和 `X-Forwarded-Port` 保留访问者实际使用的域名与端口。

保存配置后先检查语法，再按主机使用的服务管理器重新加载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Alpine Linux 使用：

```sh
sudo rc-service nginx reload
```

重新加载成功后，示例中的管理面板可通过 `https://www.example.com/fn-knock/` 访问；若修改了建议路径，访问地址也使用相同的新前缀。打开不带尾斜杠的地址会自动跳转。这个路径只代理 `7991` 管理入口，不会替代 `7999` 业务网关入口。公网可访问时，仍应为该路径限制来源 IP、接入 VPN 或增加额外认证。

## 卸载

```bash
sudo knock uninstall
```

默认卸载只删除程序和当前服务管理器的注册项（systemd 单元或 OpenRC 服务脚本），保留 `/etc/fn-knock` 配置与 `/var/lib/fn-knock` 数据。只有明确使用 `--purge` 并在交互终端输入 `DELETE` 后，才会永久删除配置和数据。

继续阅读：

- [选择部署与访问方案](/quick-start/deployment-options)
- [端口与入口](/quick-start/ports-and-entrypoints)
- [备份、恢复与数据清理](/guide/backup-and-restore)
- [控制台与系统更新](/guide/dashboard-and-update)
