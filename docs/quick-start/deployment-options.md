# 选择部署与访问方案

部署 fn-knock 时需要依次确定三件事：程序运行在哪里、外部流量怎样到达网关、网关怎样把请求交给目标服务。访问策略最后决定哪些请求可以通过。

fn-knock 用于收敛入口和前置认证，不能替代系统更新、备份、最小权限和上游服务自身的安全配置。

## 选择部署方式

| 部署方式 | 管理入口 | 默认网关入口 | 适用情况 | 主要限制 |
| --- | --- | --- | --- | --- |
| 飞牛应用 FPK | 飞牛桌面的“敲门 knock”图标（本机 CGI 转至后端 `7998`） | `7999` | fnOS 主机，希望使用完整的宿主机能力 | `7998` 是管理后端，不是对外或浏览器管理入口 |
| Docker Compose | `7991` | `7999` | NAS、家庭服务器或普通 Docker 主机 | 不支持直连模式、宿主机防火墙管理、自动 HTTPS、SSH 安全、智能连接和 Web 终端 |
| OpenWrt 软件包 | `服务 → 敲门 Knock`；默认端口为 `7991` | `7999` | 主路由、软路由或旁路由 | 不支持直连、宿主机防火墙管理、智能连接、自动 HTTPS、SSH 安全、Web 终端和应用内 FPK 更新 |
| [Linux（systemd / OpenRC）](/quick-start/linux-deployment) | `7991` | `7999` | 普通 Linux 服务器、VPS 或自管主机 | 需要 root 及正在运行的 systemd 或 OpenRC；主机防火墙由管理员自行管理 |
| [macOS 13+（Intel / Apple Silicon）](/quick-start/macos-deployment) | 本机 `127.0.0.1:7991` | `7999` | Intel 或 Apple Silicon Mac | 未签名且未公证；不支持直连、`iptables`、主机防火墙管理、智能连接、SSH 安全和 Web 终端 |
| [群晖 DSM 7 x86_64 / ARM SPK](/quick-start/synology-deployment) | DSM 桌面中的套件入口 | `7999` | DSM 7 的 Intel / AMD / ARM NAS | 不支持直连、宿主机防火墙管理、智能连接、Web 终端和 SSH 安全；通过套件中心升级 |
| [Windows x86_64](/quick-start/windows-deployment) | 管理程序打开本机 `127.0.0.1:7991` | `7999`，默认监听全部接口 | 需要 Windows 服务与本机托盘管理程序 | 仍须配置防火墙和 NAT；不支持直连授权、内置 FRP / Cloudflared、智能连接、Web 终端和 SSH 安全 |

Docker、OpenWrt、Linux、macOS 与 Windows 的管理入口需要单独设置面板密码。这个密码保护管理面板，与网关入口使用的 TOTP、账号密码或 Passkey 不是同一套凭据。

飞牛设备中若应用名称为 `敲门 knock Lite`，它是原生非 root 精简包，不是 Docker 部署，也不具备表中标准 FPK 的完整宿主机权限。Lite 支持 Host 反代、认证、DDNS、证书、WAF、内置 FRP / Cloudflared 和监控；不支持直连与宿主机防火墙、智能连接、系统时钟同步、自动 HTTPS、飞牛证书库同步、Web 终端、FN Connect WAF 接入或应用内更新。这里的“自动 HTTPS”特指运营商和入站链路允许 TCP `80 / 443` 时的标准端口直达辅助能力，不代表 Lite 不能使用证书和 HTTPS。完整边界与迁移方法见[应用商店 Lite 与官网标准 FPK 的区别](/quick-start/fpk-lite-vs-standard)。

安装说明：

- 飞牛应用：[安装与首次进入](/quick-start/install-and-first-login)
- Docker：[Docker 部署](/quick-start/docker-deployment)
- OpenWrt：[OpenWrt 部署](/quick-start/openwrt-deployment)
- Linux：[Linux 部署（systemd / OpenRC）](/quick-start/linux-deployment)
- macOS：[macOS 部署（Intel / Apple Silicon）](/quick-start/macos-deployment)
- 群晖：[群晖 DSM 7 部署](/quick-start/synology-deployment)
- Windows：[Windows x86_64 部署](/quick-start/windows-deployment)

### 安装包来源与校验

优先从 [fn-knock 官网](https://www.fnknock.cn/) 进入对应平台的下载页。正式发布同时提供以下核验信息：

- [`release-manifest.json`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/release-manifest.json)：记录版本、控制 API 版本、项目源码提交、Go 网关提交、平台、架构、文件大小和 SHA-256。
- [`SHA256SUMS`](https://github.com/kci-lnk/fn-knock-turborepo/releases/latest/download/SHA256SUMS)：用于校验 GitHub Release 中的安装包。
- Docker 多架构镜像的 SBOM 与构建来源信息（provenance）。

离线下载或转存安装包后，应在安装前重新计算 SHA-256，并与正式发布清单核对。校验值只能证明文件与发布清单一致，仍需确认平台和 CPU 架构选择正确。

建议按以下顺序核验：

1. 从官网进入对应 GitHub Release，不使用聊天群、网盘或搜索结果中的同名文件。
2. 在 `release-manifest.json` 中找到完全相同的文件名，核对发布版本、平台、架构和文件大小。
3. 计算本地 SHA-256：

   ```bash
   # Linux、OpenWrt 或其他提供 sha256sum 的系统
   sha256sum <安装包文件名>

   # macOS
   shasum -a 256 <安装包文件名>
   ```

   Windows PowerShell 使用：

   ```powershell
   (Get-FileHash -LiteralPath '<安装包文件名>' -Algorithm SHA256).Hash
   ```

4. 将结果与 manifest 中该文件的 `sha256` 或 `SHA256SUMS` 中的同名条目逐字符比较；不一致时停止安装并重新下载。
5. 需要审计构建来源时，再确认安装包的 GitHub build provenance 来自官方仓库。Docker 可同时核对 manifest 中的多架构镜像 digest、SBOM 和 provenance；固定版本部署可用 digest 避免 `latest` 后续变化。

`release-manifest.json` 还记录控制 API 版本、控制面源码提交和 Go 网关提交，可用于确认安装包中的 Rust、Go 与 Windows 组件使用同一协议契约，并把安装包追溯到两部分源码。单独拿到一个 SHA-256 文本并不能证明发布者身份，清单、校验文件和构建来源也必须来自官方 Release。

## 选择网络拓扑

### 公网直达

域名直接解析到家庭公网 IPv4 / IPv6，或由路由器把公网端口转发到 fn-knock 网关入口。

适用条件：

- 外部网络可以到达家庭入口
- 已准备域名
- 路由器、防火墙和运营商没有阻断所需端口

Web 服务使用 [公网直达：子域路由](/quick-start/subdomain-mode)。只有在必须继续访问原始端口时，才使用 [原始端口：直连授权](/quick-start/direct-mode)。

### FRP 或 Cloudflared 隧道

外部请求先进入 FRP 服务端或 Cloudflare，再由隧道回到 fn-knock 的网关入口。家庭网络不需要可入站的公网 IP。

新部署的 Web 服务默认使用：

- 后台模式：`内网穿透`
- 路由方式：`子域映射`

完整步骤见 [内网穿透：子域路由](/quick-start/reverse-proxy-mode)。

### EdgeOne 或 ESA 前置

EdgeOne、ESA 等边缘平台可以在公网侧接收标准 `80 / 443`，再回源到 fn-knock。它们属于公网直达拓扑的前置层，不改变 fn-knock 内部的 Host 路由和访问策略。

开始接入前，应先让 fn-knock 的本地网关、鉴权子域和业务子域正常工作。

## 选择路由方式

| 路由方式 | 外部地址示例 | 适用服务 | 说明 |
| --- | --- | --- | --- |
| Host 路由 | `https://nas.example.com` | Web 服务 | 推荐方案；每个服务使用独立子域 |
| 路径路由 | `https://example.com/photos` | 已经适配子路径的 Web 服务 | 兼容旧配置；后台位于 `内网穿透 → 路径模式`，该模式已标记为不再推荐 |
| TCP / UDP 转发 | `example.com:3306` | SSH、数据库、DNS 等非 Web 协议 | 通过“协议映射”配置；当前只在后台的子域模式下提供 |

Host 路由既可以用于公网直达，也可以用于 FRP / Cloudflared。是否有公网 IP 不再决定能否使用子域。

路径路由只应保留给以下情况：

- 已有路径映射需要平稳迁移
- 上游应用明确支持子路径
- 外部只能使用一个固定主机名

## 选择访问策略

当前管理界面通过 Host 映射里的 `要求登录` 开关配置新服务：

| 策略 | 当前设置方式 | 通过条件 |
| --- | --- | --- |
| 公开访问 | 关闭当前登录优先映射的 `要求登录` | 不检查 fn-knock 登录和白名单 |
| 要求登录 | 开启 `要求登录` | 手动来源授权可独立放行；自动 IP 授权通常允许同一来源继续访问，但不覆盖已携带的服务范围拒绝；没有可用来源授权时再检查会话 |
| 子域高级认证 | 为已开启 `要求登录` 的 HTTP / HTTPS Host 配置高级认证规则 | 来源或请求特征命中时，签发仅限当前 Host 的临时凭据；未命中时继续正常登录 |
| 严格白名单 | 只可能存在于历史映射，当前界面没有选择入口 | 即使关闭 `要求登录` 也不一定公开；只按有效来源授权记录判断（手动或登录后自动创建），会话 Cookie 本身不能替代来源条件 |

新建业务映射通常开启 `要求登录`。鉴权服务本身必须保持公开，否则未登录访问者无法进入登录页。若升级后遇到历史严格白名单规则，应同时检查手动与自动 IP 授权记录；若要退出该规则，记录完整映射后按当前界面重新创建，单独关闭 `要求登录` 不足以公开。若严格规则只允许手动来源，关闭登录后自动 IP 授权并清理遗留的自动记录。

登录凭据还可以限制允许访问的子域。子域高级认证是独立的 Host 放行路径，不是给登录凭据增加限制，配置前应阅读[子域高级认证](/guide/advanced-auth)。上游 Basic Auth 凭据注入只用于 fn-knock 连接目标服务，不是访问者登录 fn-knock 的方式。

## 按需求进入配置

| 条件 | 选择 |
| --- | --- |
| 有公网入口和域名，主要访问 Web 服务 | [公网直达：子域路由](/quick-start/subdomain-mode) |
| 没有公网 IP，使用 FRP 或 Cloudflared | [内网穿透：子域路由](/quick-start/reverse-proxy-mode) |
| 已有路径映射，暂时不能迁移 | [内网穿透页中的路径兼容方案](/quick-start/reverse-proxy-mode#路径模式仅用于兼容) |
| 必须在网页登录后访问 `5666`、`22` 等原始端口 | [原始端口：直连授权](/quick-start/direct-mode) |
| 还没有安装或无法区分管理入口和网关入口 | [安装与首次进入](/quick-start/install-and-first-login) |
| 在 Windows x86_64 本机部署与维护 | [Windows x86_64 部署](/quick-start/windows-deployment) |
| 在 Intel 或 Apple Silicon Mac 本机部署与维护 | [macOS 部署（Intel / Apple Silicon）](/quick-start/macos-deployment) |

对具备外部网关入口的部署，应使用移动网络等真实外部链路完成最终验证。局域网和本地来源可能被网关信任，不能替代公网认证测试。Windows 的 `7999` 虽默认监听全部接口，仍要同时验证 Windows 防火墙配置文件、路由器或 NAT、IPv6 防火墙与运营商入站策略。
