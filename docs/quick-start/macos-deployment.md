# macOS 部署（Intel / Apple Silicon）

macOS 版使用命令行安装器和 `knock` 管理命令，不提供 `.app`、`.pkg` 或菜单栏程序。它支持 macOS 13 及以上版本，并分别提供 Intel 与 Apple Silicon 原生包。

管理面板默认只监听 `127.0.0.1:7991`。macOS 运行时不会调用 `iptables`，也不会修改 macOS 主机防火墙。

## 安装前确认

- macOS 13 或更高版本。
- 当前账号可以使用 `sudo`。
- 可以通过 HTTPS 访问 `cdn.fnknock.cn` 和 GitHub Release。
- 默认端口 `7991`、`7996`、`7997`、`7998`、`7999` 没有被其他程序占用；安装器发现冲突时会提示修改。

安装器会自动识别架构：

| Mac | 发布架构 | 安装包文件名 |
| --- | --- | --- |
| Intel（`x86_64`） | `amd64` | `fn-knock-macos-<版本>-amd64.tar.gz` |
| Apple Silicon（`arm64`） | `arm64` | `fn-knock-macos-<版本>-arm64.tar.gz` |

即使在 Apple Silicon 上从 Rosetta 终端执行，安装器也会通过系统信息识别真实架构并选择 `arm64` 包。安装前还会检查包内 Mach-O 架构，错误架构不会进入服务安装阶段。

## 一行安装

在“终端”中执行：

```bash
curl -fsSL https://cdn.fnknock.cn/macos/install.sh | sudo bash
```

安装器会下载当前架构的稳定版、核对文件大小与 SHA-256、安装 root LaunchDaemon，然后等待管理服务和网关就绪。它不依赖 Homebrew。

安装完成后检查状态：

```bash
sudo knock status
```

在这台 Mac 的浏览器中打开：

```text
http://127.0.0.1:7991/
```

首次进入时设置管理面板密码。它只保护管理面板，与访客访问网关时使用的 TOTP、账号密码或 Passkey 不是同一套凭据。

### 从另一台电脑管理

`7991` 固定为本机回环入口，不应通过修改监听地址直接暴露。需要临时远程管理时，可从客户端建立 SSH 转发：

```bash
ssh -L 7991:127.0.0.1:7991 <macOS用户名>@<Mac地址>
```

保持 SSH 会话后，在客户端浏览器打开 `http://127.0.0.1:7991/`。长期提供管理入口时，可使用 `sudo knock nginx` 查看 HTTPS 反向代理示例，并额外配置访问控制。

## 未签名发行与 Gatekeeper

macOS 包没有 Apple Developer ID 签名，也没有经过 Apple 公证。通过命令行安装器安装时，会使用稳定版指针中的文件大小与 SHA-256 校验下载内容；手动下载时，应从官方 GitHub Release 获取压缩包和 `SHA256SUMS`，再执行：

```bash
shasum -a 256 fn-knock-macos-<版本>-<amd64或arm64>.tar.gz
```

校验结果必须与 `SHA256SUMS` 中相同文件名的条目完全一致。

浏览器可能给手动下载和解压的文件添加 quarantine。只有在校验通过后，才可对已解压目录手动移除：

```bash
xattr -dr com.apple.quarantine /path/to/fn-knock
```

安装器不会静默清除 quarantine。不要对未核验来源的文件执行 `xattr`。

## 端口与网络边界

| 默认端口 | 监听范围 | 用途 |
| --- | --- | --- |
| `7991` | `127.0.0.1` | 管理面板 |
| `7998` | 本机回环 | Rust 管理后端 |
| `7997` | 本机回环 | 认证服务 |
| `7996` | 本机回环 | Go 网关管理接口 |
| `7999` | 网关配置决定；默认业务入口 | 接收经过 fn-knock 的业务流量 |

`7996`、`7997`、`7998` 不应暴露。`7999` 能否从局域网或公网访问，还取决于 macOS 防火墙、路由器或 NAT、IPv6 防火墙和运营商入站策略；fn-knock 不会自动修改这些规则。

自动 HTTPS 和协议映射只负责 fn-knock 自身的监听与路由，不会替你打开 macOS 防火墙、路由器端口或云安全组。协议映射增加端口后，需要管理员手动放行固定端口。

## 使用 `knock` 管理

不带参数执行 `sudo knock` 会打开交互菜单。常用命令如下：

| 命令 | 作用 |
| --- | --- |
| `sudo knock status` | 查看 LaunchDaemon、核心进程、端口与内存状态 |
| `sudo knock start` | 启动服务 |
| `sudo knock stop` | 停止服务 |
| `sudo knock restart` | 重启服务 |
| `sudo knock config` | 修改五个运行端口并检查冲突 |
| `sudo knock logs` | 查看最近 100 行标准输出和错误日志 |
| `sudo knock logs --follow` | 持续跟随日志 |
| `sudo knock update` | 检查并安装当前架构的新版本 |
| `sudo knock update --yes` | 非交互确认更新 |
| `sudo knock rollback` | 切换到保留的上一版本并验证服务 |
| `sudo knock nginx` | 输出管理面板 HTTPS 反向代理示例 |
| `sudo knock reset-panel-password` | 清除管理面板密码，以便重新设置 |
| `sudo knock version` | 显示已安装版本 |

更新命令会下载同架构包、校验、原子切换 `current` 链接并执行健康检查。新版本启动失败时会恢复版本链接、管理命令、LaunchDaemon 配置和原来的启停状态。自动恢复不能替代备份；更新前仍应导出应用备份。

## 文件位置

| 内容 | 路径 |
| --- | --- |
| 版本目录 | `/Library/Application Support/FnKnock/releases/<版本>` |
| 当前与上一版本 | `/Library/Application Support/FnKnock/current`、`previous` |
| 运行配置 | `/Library/Application Support/FnKnock/config/fn-knock.env` |
| 应用数据 | `/Library/Application Support/FnKnock/data` |
| 服务日志 | `/Library/Logs/FnKnock` |
| 管理命令 | `/usr/local/bin/knock` |
| LaunchDaemon | `/Library/LaunchDaemons/cn.fnknock.service.plist` |

LaunchDaemon 以 root 运行，登录前即可启动；系统重启后会自动加载，核心进程异常退出时由 launchd 重启整个服务组。

## 平台能力边界

macOS 支持 Host / 路径反向代理、认证、证书与 ACME、WAF、监控、深度监控，以及内置 FRP / Cloudflared。它不提供：

- `iptables` 或 macOS 主机防火墙管理。
- 直连授权和智能连接。
- SSH 安全管理、Web 终端、fnOS 证书库同步或 fnOS 专属网络优化。
- 网页内安装更新；请使用 `sudo knock update`。

不要把后台中已隐藏或被拒绝的能力当成安装故障。macOS 上的白名单仍参与网关访问策略，但不能用于打开宿主机原始端口。

## 卸载

保留配置、数据和日志，只移除程序与服务：

```bash
sudo knock uninstall
```

彻底删除程序、配置、数据和日志：

```bash
sudo knock uninstall --purge
```

彻底删除会要求在交互终端中输入 `DELETE`。执行前先导出应用备份；删除后的本地数据不能由卸载器恢复。

## 排错

```bash
sudo knock status
sudo launchctl print system/cn.fnknock.service
sudo knock logs
```

- 管理页打不开：确认在安装 fn-knock 的 Mac 本机访问 `127.0.0.1`，并检查 `7991` 是否已修改。
- 服务未就绪：查看 `/Library/Logs/FnKnock/stdout.log` 与 `stderr.log`，并检查五个端口冲突。
- 网关从外部不可达：检查 `7999` 的实际监听、macOS 防火墙、路由器/NAT、IPv6 和运营商策略。
- 更新失败：先看日志确认是否已经自动恢复；仅在 `previous` 存在时执行 `sudo knock rollback`。
- 提示架构不匹配：不要强制安装，重新使用一行安装命令选择本机原生包。

继续阅读：[端口与入口](/quick-start/ports-and-entrypoints)、[选择部署与访问方案](/quick-start/deployment-options)、[控制台与系统更新](/guide/dashboard-and-update)。
