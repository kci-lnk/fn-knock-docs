# 常见问题

按症状定位问题。先确认当前部署方式、运行模式，以及访问的是管理入口还是网关入口。

## 管理入口打不开或无法登录

### 桌面图标和网关入口应该打开哪一个

| 目的 | 入口 |
| --- | --- |
| 修改配置、查看日志、切换模式 | 飞牛桌面的 `敲门 knock`；群晖从 DSM 主菜单打开 `敲门 knock`；OpenWrt 使用 `服务 → 敲门 Knock`；macOS 在本机打开 `127.0.0.1:7991`；Windows 使用管理程序打开本机管理页 |
| 验证公网、域名、隧道或业务映射 | 实际网关端口或对应外部域名；默认通常为 `7999` |

OpenWrt 默认管理端口是 `7991`，网关仍是 `7999`。macOS 与 Windows 管理页严格限定为 `127.0.0.1:7991`，不能从另一台机器直接打开。其他部署的端口见[端口与入口](./quick-start/ports-and-entrypoints.md)。

### Windows 管理页打不开

先打开 `fn-knock Windows 管理程序`，确认 `FnKnock` 服务状态为就绪，再点击“打开管理后台”。初装默认地址是 `http://127.0.0.1:7991/`；只能在安装该程序的 Windows 主机上访问。

若服务无法就绪，优先检查五个默认端口是否被占用。通过管理程序修改端口并保存，避免直接编辑 `%ProgramData%\FnKnock\config\runtime.json`。完整步骤见 [Windows x86_64 部署](./quick-start/windows-deployment.md)。

### macOS 管理页打不开

在安装 fn-knock 的 Mac 本机打开 `http://127.0.0.1:7991/`，并执行 `sudo knock status`。若服务未就绪，使用 `sudo knock logs` 检查 LaunchDaemon 和五个运行端口；不要把 `7991` 改为公网监听。需要从另一台电脑管理时，使用 SSH 本地转发。完整步骤见 [macOS 部署](./quick-start/macos-deployment.md)。

### 群晖提示无法读取 DSM 会话

关闭当前 fn-knock 页面，确认 DSM 登录仍有效，再从 DSM 主菜单重新打开 `敲门 knock`。群晖管理入口需要从 DSM 桌面窗口读取会话；直接收藏或打开 `launch.html`、`index.cgi`，以及在新标签页复制内部地址，都可能缺少所需的 DSM 上下文。

只有 administrators 组成员能进入管理界面。仍然失败时，先在套件中心确认 fn-knock 已启动，再重新登录 DSM。不要改为公开 `7998`；完整入口与端口说明见[群晖 DSM 7 部署](./quick-start/synology-deployment.md)。

### 后台提示存储错误

当前版本使用 SQLite，新安装不需要 Redis。

- 新安装：检查数据目录权限、端口冲突和服务日志。
- 从早期 Redis 版本升级：保留旧 Redis 数据卷，按 [Docker 部署](./quick-start/docker-deployment.md) 的迁移步骤处理。
- OpenWrt：确认 `/etc/fn-knock/gateway` 和 `/etc/fn-knock/data` 仍然存在；从旧版本升级时再检查 UCI 数据目录是否已由 `/var/lib/fn-knock` 迁移。

不要为新安装额外创建空 Redis。旧数据迁移完成并确认后台正常后，再移除旧 Redis 服务和数据卷。

### 忘记管理密码

管理密码与访客认证凭据不是同一项。按部署方式进入本机控制台或容器执行重置，不要删除数据目录：

- Docker：见 [Docker 部署](./quick-start/docker-deployment.md) 的管理密码恢复说明。
- OpenWrt：见 [OpenWrt 部署](./quick-start/openwrt-deployment.md)。
- 飞牛 fnOS FPK：优先从飞牛桌面重新进入 `敲门 knock`。
- macOS：执行 `sudo knock reset-panel-password`。
- Windows：优先在 `fn-knock Windows 管理程序`中点击“清除管理密码”。管理程序无法打开时，在应用安装目录中以管理员 PowerShell 运行 `.\fn-knock-service.exe reset-panel-password`。

## 管理正常，但外网访问失败

### 后台能打开，外部域名仍超时

后台正常只说明管理服务在运行。按顺序检查：

1. 当前网络拓扑是否选对：公网直达或内网穿透。
2. 外部流量是否到达实际网关端口，而不是管理端口；默认通常为 `7999`。
3. DNS 是否指向当前公网或隧道入口。
4. 公网直达时，路由器端口转发和主机防火墙是否放行。
5. 内网穿透时，隧道是否在线并指向正确的本地网关。
6. `请求日志` 中是否能看到该请求。

无法配置公网入站时，使用[内网穿透：子域路由](./quick-start/reverse-proxy-mode.md)。

### Windows 的 `7999` 从局域网或公网访问不到

当前 Windows 版的 `7999` 默认监听全部 IPv4 / IPv6 接口；访问不到通常是入站链路尚未打通，而不是网关只监听回环。安装器创建的 `FnKnock Gateway` 入站程序规则只覆盖 Windows 的“域”和“专用”网络配置文件，不覆盖“公用”网络。

按链路检查：Windows 当前网络配置文件和第三方安全软件、路由器或 NAT 转发、IPv6 防火墙，以及运营商是否允许入站。管理后台 `7991` 仍严格限制在本机，不能作为公网回源。Windows 不支持按登录状态动态管理防火墙或直连授权。

若在同一台 Windows 主机上自行运行隧道或反向代理，建议它回源到 `127.0.0.1:7999`，但该进程不由 fn-knock 管理，且必须保留 Host 与真实客户端 IP。

### 飞牛原生 FPK 的 `7999` 被跳到其他端口

飞牛系统的 `强制 HTTPS 连接` 可能在请求到达 fn-knock 前执行重定向。

进入 `飞牛系统设置 → 安全性 → 端口设置 → 设置`，关闭 `强制 HTTPS 连接`，再测试 `7999`。

![飞牛端口设置页面](/settings-port.webp)

### 自动 HTTPS 启动失败

自动 HTTPS 只在当前部署显示该功能、且主机实际具备入站链路和 `80` 端口时才可用。Docker、OpenWrt 和群晖 DSM 7 SPK 不提供该开关。检查：

- `80` 是否被其他服务占用。
- 当前权限是否允许监听低端口。
- 飞牛系统端口重定向或其他前置入口是否冲突。
- SSL 证书是否已经配置。

自动 HTTPS 不会代替证书申请。Windows 的 `7999` 虽默认监听全部接口，开启该功能也不会自动打通防火墙、路由器/NAT 或运营商入站限制。Docker、OpenWrt 和群晖应在前置代理、边缘平台或网关外部终止 TLS。见 [SSL 证书](./guide/ssl.md)。

### 未登录也能直接访问业务端口

存在绕过 fn-knock 的入口。检查路由器端口转发、宿主机防火墙、IPv6 防火墙和前置代理，关闭直接指向业务服务的公网规则。

直连授权应只公开认证网关，登录后再临时放行当前出口 IP。Docker、macOS 和 Windows 不支持由 fn-knock 管理宿主机防火墙。

## 域名、子域或隧道不工作

### 应该选择哪种方案

| 条件 | 方案 |
| --- | --- |
| 有公网入站，主要访问 Web 服务 | [公网直达：子域路由](./quick-start/subdomain-mode.md) |
| 没有公网入站 | [内网穿透：子域路由](./quick-start/reverse-proxy-mode.md) |
| 需要保护 SSH、远程桌面等原始端口 | [原始端口访问：直连授权](./quick-start/direct-mode.md) |
| 必须保留旧路径前缀 | 内网穿透中的路径模式，仅用于兼容 |

先按网络拓扑选入口，再按 Host、路径或 TCP/UDP 选择路由，最后为服务设置访问策略。

### 隧道模式需要 DDNS 吗

通常不需要：

- FRP 使用服务端地址和外部端口。
- Cloudflared 使用 Cloudflare Tunnel 绑定的域名。

只有隧道入口本身依赖动态公网地址时，才为该入口配置 DDNS。

### FRP 和 Cloudflared 怎么选

- 已有 FRP 服务端，希望控制公网端口和流量：使用 FRP。
- 已使用 Cloudflare，希望减少公网服务器维护：使用 Cloudflared。

两者都应把认证域名和业务域名转到 fn-knock 网关，并保留原始 Host。见 [内网穿透](./guide/tunnel.md)。

### Cloudflared 回源应填 HTTP 还是 HTTPS

- fn-knock 本地网关没有配置证书：使用 `http://...:<实际网关端口>`。
- 本地网关已配置有效证书，且 Cloudflared 信任该证书：使用 `https://...:<实际网关端口>`。

Cloudflared 与 fn-knock 在不同容器时，`localhost` 指向错误的容器，应使用可互通的容器名或局域网地址。见 [Cloudflared 隧道](./guide/cloudflared-tunnel.md)。

### 子域打开了错误的服务

检查：

1. 前置代理或隧道是否保留原始 Host。
2. 根域名与子域映射是否匹配。
3. 是否有重复或兜底映射抢先命中。
4. 公网回源是否指向实际网关端口。

管理入口不能作为业务回源。

### 路径映射出现资源 404 或登录循环

上游应用没有正确处理路径前缀、重定向、Cookie 或 WebSocket。新配置应迁移到独立子域；只有上游明确支持前缀部署时才继续使用路径模式。

### 一键发现扫描不到服务

先确认目标是 fn-knock 运行环境可以访问的本地 IPv4 HTTP 服务。服务发现不扫描公网、IPv6、域名或非 HTTP 协议；Docker 中的 `127.0.0.1` 只指容器自身。

把扫描 CIDR 收窄到目标实际网段，确认没有超过 `16` 个 CIDR、合计 `1024` 台主机，再从 fn-knock 所在环境直接访问目标端口。TCP 端口开放但不能通过 HTTP 分析时，也不会生成候选。完整范围和强度设置见[服务发现与批量接入](./guide/service-discovery.md)。

### EdgeOne 或 ESA 出现登录循环、页面异常

检查：

- 回源是否指向 fn-knock 的实际网关端口。
- 子域映射是否启用了对应平台支持。
- 缓存是否关闭，WebSocket 是否开启。
- 真实客户端 IP 请求头是否正确传递。
- 双栈回源是否把请求分到不同入口。

专题配置见 [腾讯云 EdgeOne](./tutorials/tencent-edgeone-with-fknock.md) 和 [阿里云 ESA](./tutorials/aliyun-esa-with-fknock.md)。

### 回到家庭 Wi-Fi 后仍走公网

客户端仍在使用公网 DNS 结果。飞牛标准 FPK 使用智能连接时，检查：

- `系统设置 → 功能 → 智能连接` 是否启用。
- 本机局域网 IP 是否正确。
- 路由器 DHCP DNS 或客户端 DNS 是否指向 fn-knock 所在设备。
- 客户端 DNS 缓存是否刷新。

智能连接只用于飞牛标准 FPK 子域模式的局域网 DNS 优化，不会修改公网 DNS。OpenWrt、Docker 和其他部署不提供该能力；需要分流时应在路由器或独立 DNS 中自行配置。见 [智能连接](./guide/smart-connect.md)。

## 登录或会话异常

### TOTP、密码、Passkey 和 QQ 怎么选

- TOTP：默认登录方式，也是绑定 Passkey、QQ 和其他外部账号的基础；必须保留可用恢复方式。
- 账号密码：适合不方便使用身份验证器的成员。
- Passkey：在已有 TOTP 身份上提供便捷登录。
- QQ：把一个 QQ 账号绑定到已有 TOTP 后提供快捷登录，继承该 TOTP 的服务范围，不是独立用户。

切换到账号密码登录模式后，登录页不会显示 Passkey、QQ 或其他外部账号入口。见 [认证与登录](./guide/auth.md) 和 [绑定 QQ 快捷登录](./guide/qq-quick-login.md)。

### 登录页的人机验证在哪里配置

进入 `系统设置 → Challenge`。PoW 与 Turnstile 的区别见 [Challenge](./guide/captcha.md)；Cloudflare 配置见 [Turnstile](./guide/cloudflare-turnstile.md)。

### “记住我”如何影响会话

会话时长在 `系统设置 → 会话` 中配置。启用“记住我”会使用长期会话时长；若 IP 授权设置为跟随会话，对应授权也会延长。

只在个人可信设备上使用长期会话。

### 删除 TOTP 后其他登录方式失效

删除某个 TOTP 会同时使关联的 Passkey、QQ 和其他外部账号绑定失效。删除前应确认还有其他可用身份；删除后需要重新绑定关联登录方式。

### 登录成功后仍回到登录页

按顺序检查：

1. 认证域名和业务域名是否使用相同的公开协议。
2. 根域名、Cookie 作用域和 Passkey RP ID 是否匹配。
3. 浏览器是否阻止 Cookie。
4. 边缘平台是否缓存了登录响应。
5. 前置代理是否传递了正确的 `Host`、`X-Forwarded-Host` 和 `X-Forwarded-Proto`。
6. 系统时间是否准确。

系统遇到同一认证页或同一目标持续循环时会暂停自动回跳。此时从原始业务 Host 重新发起访问，不要反复刷新或复制认证回调地址。

### 飞牛 App 直接填写地址后无法登录

飞牛 App 是否能处理网页认证跳转并复用 Cookie，取决于客户端版本。浏览器会话不一定自动共享给原生 App：

- 子域或内网穿透：先在手机浏览器打开同一外部域名并登录。
- 直连授权：先在浏览器打开实际网关端口，再回到 App 连接原始地址。

完整步骤见 [使用飞牛 App](./tutorials/use-fnos-app-with-fknock.md)。

### 更换网络后突然失去访问权限

移动网络、代理和家庭宽带可能改变出口 IP。重新打开认证入口登录，并在 `系统设置 → 会话` 查看 `IP 漂移轨迹`。

该轨迹记录会话从原 IP 迁移到新 IP 的过程，不是普通请求日志。

### 会话旁的飞牛图标表示什么

表示该登录会话附着了飞牛 token，常见于飞牛 App 或网页继续复用当前登录。踢出、退出或会话过期时，附着 token 也会失效。见 [会话管理](./guide/session-management.md)。

## 路由、安全或日志异常

### 登录成功后仍提示不在白名单

先确认该 Host 是否继承了历史 `strict_whitelist` 规则：

- 关闭 `要求登录`：当前登录优先映射会公开访问，不检查登录和白名单；历史严格白名单映射不适用。
- 开启 `要求登录`：手动来源授权可独立放行；自动 IP 授权通常允许同一来源继续访问，但不会覆盖已携带的服务范围拒绝；没有可用来源授权时再检查会话。
- 历史严格白名单规则：即使关闭 `要求登录` 也不一定公开；只按有效来源授权记录判断（手动或登录后自动创建），浏览器会话 Cookie 本身不能替代来源条件。

当前 Host 编辑界面没有严格白名单选择。遇到历史规则时，应确认当前出口 IP 的手动或自动授权记录；若只允许手动来源，关闭登录后自动 IP 授权并检查遗留自动记录。需要退出该规则时，先记录完整映射配置，再按当前界面重新创建映射；单独关闭 `要求登录` 不足以公开。

### 飞牛分享链接被拦截

飞牛分享直通可用于子域路由和内网穿透，不适用于直连模式。确认 `/s/...` 请求的实际路由结果指向飞牛；如果它被另一条路径规则或错误的默认路由接管，直通不会生效。见 [飞牛分享直通](./guide/fnos-share-bypass.md)。

### 请求日志在哪里开启

进入 `系统设置 → 日志` 开启。开启后侧边栏出现 `请求日志`，可按日期查看命中的 Host、上游和响应状态。见 [请求日志](./guide/request-logs.md)。

### CPU 或内存很高，但事件中心没有告警

当前默认需要使用率持续达到 `80%` 约 `30` 秒才产生告警，短暂尖峰不会立即形成事件；恢复也要持续回落到 `60%`。Windows 不提供系统资源监控，Docker 中的数值按容器运行环境可见的资源边界解释。

先确认平台能力、事件系统和资源事件正常，再区分“资源事件产生条件”和“通知规则触发条件”。后者只决定已有事件何时发送，不改变采样阈值。见[事件中心与通知](./guide/event-center-and-notifications.md#cpu-与内存监控)。

### 通用黑名单和扫描器黑名单有什么区别

- 扫描器黑名单：根据未认证的异常路径探测自动封禁。
- 通用黑名单：管理员从日志或黑名单页面明确封禁 IP。

通用黑名单只接受精确 IPv4 或 IPv6，不接受 CIDR。网段或地区限制使用 [网关可见性](./guide/gateway-visibility.md)；单个异常 IP 使用 [通用黑名单](./guide/general-blacklist.md)。

### 为什么应尽早配置 HTTPS

HTTPS 保护登录凭据和会话 Cookie，也是 Passkey 的正常使用条件。公网域名、FRP 和 Cloudflared 的公开入口都应使用受信任证书。见 [SSL 证书](./guide/ssl.md)。

## 安装、升级或数据异常

### OpenWrt 如何安装和升级

OpenWrt 支持匹配架构的 `.ipk` 和 `.apk` 包。安装后入口为 `服务 → 敲门 Knock`。

升级时安装新版软件包；应用内 FPK 更新不适用于 OpenWrt。正常升级会保留 `/etc/config/fn-knock`、`/etc/fn-knock/gateway` 和 `/etc/fn-knock/data`；旧版默认 `/var/lib/fn-knock` 会在升级时迁移到新的持久化数据目录。完整命令见 [OpenWrt 部署](./quick-start/openwrt-deployment.md)。

### Docker 升级后数据为空

先停止继续写入，确认旧数据卷仍在。当前版本使用 SQLite；只有从早期 Redis 版本升级时才执行 Redis 到 SQLite 的历史迁移。

不要删除旧卷、不要用空卷覆盖原挂载，也不要在新安装中额外添加 Redis。按 [Docker 部署](./quick-start/docker-deployment.md) 的备份和迁移步骤恢复。

### `.knock` 备份无法导入或导入后有警告

确认文件保持原始 `.knock` 扩展名、大小不超过 `128 MiB`，并且导出版本不高于当前实例。目标版本还必须落在错误提示显示的支持区间内；不要通过修改归档 JSON 伪造版本。

导入成功后的警告表示配置条目已经恢复，但网关、WAF、SSL 等某个运行态同步步骤失败，不代表整个导入已自动回滚。保留管理入口，按警告逐项检查并手动重新保存对应配置，不要先反复导入同一文件。见[备份、恢复与数据清理](./guide/backup-and-restore.md)。

### Windows 如何更新或清理数据

通过 `fn-knock Windows 管理程序`或系统托盘的“检查更新”安装 Windows 更新；网页 `关于 / 更新` 只显示版本和说明。升级前导出备份，安装器在启动失败时会恢复前一版程序和数据。

卸载 Windows 程序后，`%ProgramData%\FnKnock` 会保留以便恢复，其中含 SQLite、证书与配置。确认不再需要恢复后，才以管理员权限单独删除该目录。

### macOS 如何更新、回滚或卸载

使用 `sudo knock update` 安装当前架构的新版本，使用 `sudo knock rollback` 切回保留的上一版本。`sudo knock uninstall` 会移除程序和 LaunchDaemon，但保留配置、数据与日志；只有 `sudo knock uninstall --purge` 并交互输入 `DELETE` 才会彻底清除。完整说明见 [macOS 部署](./quick-start/macos-deployment.md)。

### 更新后功能入口与旧文档不一致

先确认当前部署能力：

| 能力 | 飞牛 fnOS FPK | Docker | OpenWrt | Linux 服务 | macOS | 群晖 DSM 7 SPK | Windows x86_64 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 主机防火墙与直连授权 | 支持 | 不支持 | 不支持 | 不支持 | 不支持；不调用 `iptables` | 不支持 | 不支持 |
| 自动 HTTPS | 支持 | 不支持 | 不支持 | 支持；需 `80` 端口与入站链路 | 支持；需手动打通防火墙与入站链路 | 不支持 | 支持；仍需打通防火墙、NAT 与入站链路 |
| ACME DNS-01 | 支持 | 支持 | 支持 | 支持 | 支持 | 支持 | 支持；内置客户端，固定 Let's Encrypt |
| 智能连接 | 支持 | 不支持 | 不支持 | 不支持 | 不支持 | 不支持 | 不支持 |
| SSH 安全 | 支持 | 不支持 | 不支持 | 不支持 | 不支持 | 不支持 | 不支持 |
| Web 终端 | 支持 | 不支持 | 不支持 | 支持；依赖 `tmux` | 不支持 | 不支持 | 不支持 |
| 内置 FRP / Cloudflared | 支持 | 支持 | 支持 | 支持 | 支持 | 支持 | 不支持 |
| 更新安装 | 网页内更新 | 拉取新镜像 | 安装 IPK / APK | `sudo knock update` | `sudo knock update` | DSM 套件中心 / SPK | Windows 管理程序处理 |

部署边界和推荐入口见[选择部署与访问方案](./quick-start/deployment-options.md)。
